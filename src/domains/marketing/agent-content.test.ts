import { describe, expect, it } from "vitest";
import { contentSignal, homeMarkdown, llmsTxt, robotsTxt } from "./agent-content";
import { getAllProperties } from "@/domains/properties/registry";
import { absoluteUrl } from "@/lib/seo";

describe("robots.txt", () => {
  const txt = robotsTxt();

  it("declares the Content-Signal inside the wildcard group", () => {
    expect(txt).toMatch(new RegExp(`^User-Agent: \\*\\nContent-Signal: ${contentSignal}\\n`));
  });

  it("keeps the existing crawl rules and sitemap", () => {
    expect(txt).toContain("Allow: /\n");
    for (const path of ["/admin/", "/api/", "/reservar/", "/reserva/", "/checkout/"]) {
      expect(txt).toContain(`Disallow: ${path}\n`);
    }
    expect(txt).toContain(`Sitemap: ${absoluteUrl("/sitemap.xml")}`);
  });
});

describe("llms.txt", () => {
  const txt = llmsTxt();

  it("follows the format: one H1, a summary, then sections of markdown links", () => {
    const lines = txt.split("\n");
    expect(lines[0]).toMatch(/^# \S/);
    expect(lines.filter((l) => l.startsWith("# "))).toHaveLength(1);
    expect(lines[2]).toMatch(/^> \S/);
    expect(txt).toMatch(/^## \S/m);
    expect(txt).toMatch(/^- \[[^\]]+\]\(https?:\/\/[^)]+\)/m);
  });

  it("links every property and the about, contact and legal pages", () => {
    for (const p of getAllProperties()) expect(txt).toContain(`(${absoluteUrl(`/${p.slug}`)})`);
    for (const path of ["/sobre-nosotros", "/contacto", "/legal/aviso-legal"]) {
      expect(txt).toContain(`(${absoluteUrl(path)})`);
    }
  });
});

describe("home markdown", () => {
  const md = homeMarkdown();

  it("describes each property with its real capacity and a link", () => {
    expect(md.startsWith("# ")).toBe(true);
    for (const p of getAllProperties()) {
      expect(md).toContain(`[${p.name}](${absoluteUrl(`/${p.slug}`)})`);
      expect(md).toContain(`Hasta ${p.capacity.guests} personas`);
    }
  });
});

describe("agent-facing content", () => {
  it("never exposes a discount code (they are campaign-only)", () => {
    for (const text of [llmsTxt(), homeMarkdown()]) {
      expect(text).not.toMatch(/10PRAETORIA10|cup[oó]n|c[oó]digo de descuento/i);
    }
  });
});
