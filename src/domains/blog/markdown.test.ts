import { describe, expect, it } from "vitest";
import { renderMarkdown, safeHref, escapeHtml, markdownToText, extractFaqs } from "./markdown";

describe("blog markdown renderer", () => {
  it("maps # to h2 so the page keeps a single h1", () => {
    expect(renderMarkdown("# Título")).toBe("<h2>Título</h2>");
    expect(renderMarkdown("## Sub")).toBe("<h3>Sub</h3>");
    expect(renderMarkdown("#### Deep")).toBe("<h4>Deep</h4>");
  });

  it("wraps blank-line-separated blocks in paragraphs", () => {
    expect(renderMarkdown("uno\n\ndos")).toBe("<p>uno</p>\n<p>dos</p>");
  });

  it("renders unordered and ordered lists", () => {
    expect(renderMarkdown("- a\n- b")).toBe("<ul>\n<li>a</li>\n<li>b</li>\n</ul>");
    expect(renderMarkdown("1. a\n2. b")).toBe("<ol>\n<li>a</li>\n<li>b</li>\n</ol>");
  });

  it("renders bold, italic, code and a safe link", () => {
    expect(renderMarkdown("**x**")).toBe("<p><strong>x</strong></p>");
    expect(renderMarkdown("_y_")).toBe("<p><em>y</em></p>");
    expect(renderMarkdown("`z`")).toBe("<p><code>z</code></p>");
    expect(renderMarkdown("[ficha](/javalambre)")).toBe('<p><a href="/javalambre">ficha</a></p>');
  });

  it("marks external links nofollow + target blank", () => {
    expect(renderMarkdown("[x](https://example.com)")).toContain('rel="nofollow noopener"');
    expect(renderMarkdown("[x](https://example.com)")).toContain('target="_blank"');
  });

  it("escapes HTML and never emits a raw tag from content", () => {
    const html = renderMarkdown("hola <script>alert(1)</script> **mundo**");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>mundo</strong>");
  });

  it("drops unsafe link protocols, keeping the text", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(renderMarkdown("[x](javascript:evil)")).toBe("<p>x</p>");
  });

  it("renders a site image as a figure with its caption", () => {
    expect(
      renderMarkdown('![Rincón de juegos](/images/properties/javalambre/x-1200.webp "Juguetes y cuentos")'),
    ).toBe(
      '<figure><img src="/images/properties/javalambre/x-1200.webp" alt="Rincón de juegos" loading="lazy" decoding="async" /><figcaption>Juguetes y cuentos</figcaption></figure>',
    );
    expect(renderMarkdown("![Sin pie](/images/a.jpg)")).toBe(
      '<figure><img src="/images/a.jpg" alt="Sin pie" loading="lazy" decoding="async" /></figure>',
    );
  });

  it("never renders images from outside /images/ nor escapes the alt", () => {
    expect(renderMarkdown("![x](https://evil.example/a.png)")).not.toContain("<img");
    expect(renderMarkdown("![x](/images/../a.svg)")).not.toContain("<img");
    expect(renderMarkdown('![a"><script>](/images/a.webp)')).not.toContain("<script>");
  });

  it("renders a horizontal rule and blockquote", () => {
    expect(renderMarkdown("---")).toBe("<hr />");
    expect(renderMarkdown("> cita")).toBe("<blockquote>cita</blockquote>");
  });

  it("markdownToText strips syntax for excerpts", () => {
    expect(markdownToText("## Hola\n\n**mundo** con [enlace](/x)")).toBe("Hola mundo con enlace");
  });

  it("escapeHtml covers the five entities", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
  it("renders a button line and marks WhatsApp buttons", () => {
    const html = renderMarkdown("[[Escríbenos]](https://wa.me/34600000000?text=Hola%20qu%C3%A9%20tal)");
    expect(html).toContain('class="blog-cta blog-cta--whatsapp"');
    expect(html).toContain('href="https://wa.me/34600000000?text=Hola%20qu%C3%A9%20tal"');
    expect(html).toContain('target="_blank"');
    expect(renderMarkdown("[[Ir]](javascript:alert(1))")).not.toContain("<a");
  });

  it("renders cards, steps, box and faq blocks", () => {
    const md = ":::cards\n### Uno\nTexto **a**\n### Dos\n- x\n:::\n\n:::steps\n### Paso\nHaz esto\n:::\n\n:::box\n# Título\nCuerpo\n:::";
    const html = renderMarkdown(md);
    expect(html).toContain('<div class="blog-cards"><div class="blog-card"><h3>Uno</h3><p>Texto <strong>a</strong></p></div>');
    expect(html).toContain("<ul>\n<li>x</li>\n</ul>");
    expect(html).toContain('<ol class="blog-steps"><li><h3>Paso</h3><p>Haz esto</p></li></ol>');
    expect(html).toContain('<section class="blog-box"><h2>Título</h2>\n<p>Cuerpo</p></section>');
    expect(html).not.toContain(":::");
  });

  it("extracts FAQ items for structured data", () => {
    const md = "Intro\n\n:::faq\n### ¿Pregunta?\nRespuesta con [enlace](/x).\n### Sin respuesta\n:::";
    expect(extractFaqs(md)).toEqual([{ question: "¿Pregunta?", answer: "Respuesta con enlace." }]);
    expect(renderMarkdown(md)).toContain('<div class="blog-faq"><div class="blog-faq__item"><h3>¿Pregunta?</h3>');
  });

  it("an unclosed fence or stray marker never hangs or leaks", () => {
    expect(renderMarkdown(":::cards\n### A\nb")).toContain("blog-card");
    expect(renderMarkdown(":::\ntexto")).toBe("<p>texto</p>");
  });
});

