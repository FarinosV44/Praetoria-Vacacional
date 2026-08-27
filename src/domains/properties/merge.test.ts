import { describe, expect, it } from "vitest";
import { applyPropertyOverride, propertyOverrideSchema } from "./merge";
import { javalambre } from "@/content/properties/javalambre";

describe("applyPropertyOverride", () => {
  it("returns the property untouched when there is no override", () => {
    expect(applyPropertyOverride(javalambre, null)).toBe(javalambre);
  });

  it("overrides SEO fields without mutating the base", () => {
    const out = applyPropertyOverride(javalambre, {
      metaTitle: "Nuevo title",
      metaDescription: "Nueva meta",
      h1: "Nuevo H1",
    });
    expect(out.seo.metaTitle).toBe("Nuevo title");
    expect(out.seo.metaDescription).toBe("Nueva meta");
    expect(out.seo.h1).toBe("Nuevo H1");
    // base object is not mutated
    expect(javalambre.seo.metaTitle).not.toBe("Nuevo title");
  });

  it("replaces highlights and faq wholesale when provided", () => {
    const out = applyPropertyOverride(javalambre, {
      highlights: [{ title: "Solo una", body: "cosa" }],
      faq: [{ question: "¿Una?", answer: "Sí." }],
    });
    expect(out.highlights).toHaveLength(1);
    expect(out.faq).toHaveLength(1);
  });

  it("keeps the category of a known nearby point and defaults unknown ones", () => {
    const known = javalambre.nearby[0]!.name;
    const out = applyPropertyOverride(javalambre, {
      nearby: [
        { name: known, distance: "5 min" },
        { name: "Sitio nuevo", distance: "1 km" },
      ],
    });
    expect(out.nearby[0]).toEqual({
      name: known,
      distance: "5 min",
      category: javalambre.nearby[0]!.category,
    });
    expect(out.nearby[1]).toEqual({ name: "Sitio nuevo", distance: "1 km", category: "landmark" });
  });

  it("ignores empty strings (schema-level) and undefined fields", () => {
    const parsed = propertyOverrideSchema.parse({ metaTitle: "  ", tagline: "Algo" });
    // "  " trims to "" which is still a string; apply treats falsy as "keep base"
    const out = applyPropertyOverride(javalambre, parsed);
    expect(out.seo.metaTitle).toBe(javalambre.seo.metaTitle);
    expect(out.tagline).toBe("Algo");
  });

  it("rejects an over-long meta title", () => {
    expect(propertyOverrideSchema.safeParse({ metaTitle: "x".repeat(80) }).success).toBe(false);
  });
});
