/**
 * A deliberately small, safe Markdown renderer for blog bodies (issue #57).
 *
 * The project ships no Markdown dependency and blog content is authored only by
 * the trusted admin, so rather than pull in a full parser we render a fixed,
 * well-understood subset and HTML-escape everything else. The output tag set is
 * closed (h2–h4, p, ul/ol/li, blockquote, a, strong, em, code, hr) and every
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
 *   **bold**  *italic* _italic_  `code`  [text](href)
 */

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

const BLOCK_START = /^(#{1,6}\s|>\s?|[-*]\s+|\d+\.\s+|-{3,}$|\*{3,}$|_{3,}$)/;

function inline(src: string): string {
  // Escape first, then reintroduce the known inline constructs.
  let s = escapeHtml(src);

  // `code`
  s = s.replace(/`([^`]+)`/g, (_m, code: string) => `<code>${code}</code>`);

  // [text](href)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const clean = href.replace(/&amp;/g, "&");
    const safe = safeHref(clean);
    if (!safe) return text;
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

export function renderMarkdown(md: string): string {
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
      if (cur === "" || BLOCK_START.test(cur)) break;
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
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
