/**
 * A deliberately small, safe Markdown renderer for blog bodies (issue #57).
 *
 * The project ships no Markdown dependency and blog content is authored only by
 * the trusted admin, so rather than pull in a full parser we render a fixed,
 * well-understood subset and HTML-escape everything else. The output tag set is
 * closed (h2–h4, p, ul/ol/li, blockquote, a, strong, em, code, hr, figure/img)
 * and every
 * link URL is validated, so the result is safe to inject even if someone pastes
 * raw HTML into the editor.
 *
 * Supported syntax:
 *   # / ## / ###…      headings  (mapped to h2 / h3 / h4 — the page keeps one h1)
 *   blank-line blocks  paragraphs
 *   - or *             unordered list items
 *   1.                 ordered list items
 *   >                  blockquote
 *   ---                horizontal rule
 *   ![alt](/images/… "pie")  a figure — the site's own /images/ files or an
 *                      images.unsplash.com photo,
 *                      on a line of its own; the optional title is the caption
 *   **bold**  *italic* _italic_  `code`  [text](href)
 *   [[Texto]](href)    a call-to-action button, on a line of its own
 *   :::cards / :::steps / :::faq   a block of items, each opened by `### Title`
 *   :::box             a highlighted panel (any of the above inside, except blocks)
 *   :::                closes the block
 */

import { currentInternalPath } from "@/lib/legacy-paths";

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE[c] ?? c);
}

/** Allow only http(s), mailto and site-relative links. Returns null if unsafe. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  return null;
}

const BLOCK_START = /^(#{1,6}\s|>\s?|[-*]\s+|\d+\.\s+|-{3,}$|\*{3,}$|_{3,}$|!\[|:::|\[\[)/;

/** A button line: `[[Texto]](href)` alone on its line. */
const BUTTON_LINE = /^\[\[([^\]]+)\]\]\(([^)\s]+)\)$/;

/** Opening line of a fenced block. */
const FENCE_OPEN = /^:::(cards|steps|faq|box)$/;

type FenceKind = "cards" | "steps" | "faq" | "box";

/** Split a block body into `### Title` items. Text before the first title is dropped. */
function splitItems(body: string[]): { title: string; body: string }[] {
  const items: { title: string; body: string[] }[] = [];
  for (const line of body) {
    const t = /^###\s+(.*)$/.exec(line.trim());
    if (t) items.push({ title: (t[1] ?? "").trim(), body: [] });
    else if (items.length > 0) items[items.length - 1]!.body.push(line);
  }
  return items.map((it) => ({ title: it.title, body: it.body.join("\n").trim() }));
}

function renderButton(text: string, href: string): string | null {
  const checked = safeHref(href);
  if (!checked) return null;
  const safe = checked.startsWith("/") ? currentInternalPath(checked) : checked;
  const external = /^https?:\/\//i.test(safe);
  const attrs = external ? ' rel="noopener" target="_blank"' : "";
  const wa = /^https:\/\/wa\.me\//i.test(safe) ? " blog-cta--whatsapp" : "";
  return `<p class="blog-cta${wa}"><a class="pv-btn pv-btn--lg pv-btn--primary" href="${escapeHtml(safe)}"${attrs}>${inline(text)}</a></p>`;
}

function renderFence(kind: FenceKind, body: string[]): string {
  if (kind === "box") {
    return `<section class="blog-box">${renderMarkdown(body.join("\n"), false)}</section>`;
  }
  const items = splitItems(body);
  if (kind === "steps") {
    const lis = items
      .map((it) => `<li><h3>${inline(it.title)}</h3>${renderMarkdown(it.body, false)}</li>`)
      .join("");
    return `<ol class="blog-steps">${lis}</ol>`;
  }
  const cls = kind === "faq" ? "blog-faq" : "blog-cards";
  const itemCls = kind === "faq" ? "blog-faq__item" : "blog-card";
  const divs = items
    .map((it) => `<div class="${itemCls}"><h3>${inline(it.title)}</h3>${renderMarkdown(it.body, false)}</div>`)
    .join("");
  return `<div class="${cls}">${divs}</div>`;
}

/** Questions and plain-text answers of every `:::faq` block (for FAQPage JSON-LD). */
export function extractFaqs(md: string): { question: string; answer: string }[] {
  const lines = (md ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out: { question: string; answer: string }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if ((lines[i] ?? "").trim() !== ":::faq") continue;
    const body: string[] = [];
    i += 1;
    while (i < lines.length && (lines[i] ?? "").trim() !== ":::") {
      body.push(lines[i] ?? "");
      i += 1;
    }
    for (const it of splitItems(body)) {
      const answer = markdownToText(it.body);
      if (it.title && answer) out.push({ question: markdownToText(it.title), answer });
    }
  }
  return out;
}

/** A block image: the site's own raster files under /images/ (no traversal) or a licensed Unsplash photo. */
const IMAGE_BLOCK =
  /^!\[([^\]]*)\]\((\/images\/(?:[\w-]+\/)*[\w.-]+\.(?:webp|avif|jpe?g|png)|https:\/\/images\.unsplash\.com\/photo-[\w-]+(?:\?[\w=&%.-]*)?)(?:\s+"([^"]*)")?\)$/i;

function inline(src: string): string {
  // Escape first, then reintroduce the known inline constructs.
  let s = escapeHtml(src);

  // `code`
  s = s.replace(/`([^`]+)`/g, (_m, code: string) => `<code>${code}</code>`);

  // [text](href)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const clean = href.replace(/&amp;/g, "&");
    const checked = safeHref(clean);
    if (!checked) return text;
    const safe = checked.startsWith("/") ? currentInternalPath(checked) : checked;
    const external = /^https?:\/\//i.test(safe);
    const attrs = external ? ' rel="nofollow noopener" target="_blank"' : "";
    return `<a href="${escapeHtml(safe)}"${attrs}>${text}</a>`;
  });

  // **bold**
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // *italic* / _italic_
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_\w])_([^_\s][^_]*)_/g, "$1<em>$2</em>");

  return s;
}

export function renderMarkdown(md: string, allowFences = true): string {
  const lines = (md ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();

    if (trimmed === "") {
      closeList();
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      out.push("<hr />");
      i += 1;
      continue;
    }

    // Fenced block (:::cards / :::steps / :::faq / :::box … :::)
    const fence = allowFences ? FENCE_OPEN.exec(trimmed) : null;
    if (fence) {
      closeList();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && (lines[i] ?? "").trim() !== ":::") {
        body.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // closing ::: (or end of input)
      out.push(renderFence(fence[1] as FenceKind, body));
      continue;
    }
    if (/^:::/.test(trimmed)) {
      // Stray or nested fence marker: drop it rather than print it.
      i += 1;
      continue;
    }

    // Button
    const button = BUTTON_LINE.exec(trimmed);
    if (button) {
      const html = renderButton(button[1] ?? "", (button[2] ?? "").replace(/&amp;/g, "&"));
      if (html) {
        closeList();
        out.push(html);
        i += 1;
        continue;
      }
    }

    // Figure
    const image = IMAGE_BLOCK.exec(trimmed);
    if (image && !(image[2] ?? "").includes("..")) {
      closeList();
      const alt = escapeHtml(image[1] ?? "");
      const src = escapeHtml(image[2] ?? "");
      const caption = image[3] ? `<figcaption>${inline(image[3])}</figcaption>` : "";
      out.push(`<figure><img src="${src}" alt="${alt}" loading="lazy" decoding="async" />${caption}</figure>`);
      i += 1;
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeList();
      const level = Math.min(4, (heading[1]?.length ?? 1) + 1); // # -> h2
      out.push(`<h${level}>${inline((heading[2] ?? "").trim())}</h${level}>`);
      i += 1;
      continue;
    }

    // Blockquote (consecutive `>` lines)
    if (/^>\s?/.test(trimmed)) {
      closeList();
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test((lines[i] ?? "").trim())) {
        buf.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // List item
    const ul = /^[-*]\s+(.*)$/.exec(trimmed);
    const ol = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (ul || ol) {
      const want: "ul" | "ol" = ul ? "ul" : "ol";
      if (listType && listType !== want) closeList();
      if (!listType) {
        listType = want;
        out.push(`<${want}>`);
      }
      const item = (ul?.[1] ?? ol?.[1] ?? "").trim();
      out.push(`<li>${inline(item)}</li>`);
      i += 1;
      continue;
    }

    // Paragraph (gather until blank line / block start)
    closeList();
    const buf: string[] = [];
    while (i < lines.length) {
      const cur = (lines[i] ?? "").trim();
      // Always consume the first line: a line that merely LOOKS like a block start
      // (e.g. `![` that is not a valid figure) must not stall the loop.
      if (cur === "" || (buf.length > 0 && BLOCK_START.test(cur))) break;
      buf.push(cur);
      i += 1;
    }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }

  closeList();
  return out.join("\n");
}

/** Plain-text projection of a Markdown body — for excerpts and reading time. */
export function markdownToText(md: string): string {
  return (md ?? "")
    .replace(/^:::\w*\s*$/gm, " ")
    .replace(/\[\[([^\]]+)\]\]\([^)]*\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
