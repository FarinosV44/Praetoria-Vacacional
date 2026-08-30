import { describe, expect, it } from "vitest";
import { renderMarkdown, safeHref, escapeHtml, markdownToText } from "./markdown";

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
});
