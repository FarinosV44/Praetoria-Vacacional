import { describe, expect, it } from "vitest";
import {
  slugify,
  isPubliclyVisible,
  isScheduled,
  relatedPropertySlug,
  ctaForPost,
  readingMinutes,
  autoExcerpt,
  relatedPosts,
} from "./helpers";
import type { BlogPost } from "./types";

const base: BlogPost = {
  id: "1",
  slug: "post-uno",
  status: "published",
  title: "Post uno",
  excerpt: "",
  bodyMarkdown: "Hola mundo",
  featuredImageUrl: null,
  featuredImageAlt: "",
  category: "",
  tags: [],
  destination: "general",
  relatedPropertySlug: null,
  author: "Praetoria Vacacional",
  seoTitle: null,
  metaDescription: null,
  canonicalUrl: null,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  publishedAt: "2026-01-01T00:00:00.000Z",
  updatedContentAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const NOW = new Date("2026-06-01T00:00:00.000Z");

describe("blog helpers", () => {
  it("slugify folds accents and kebab-cases", () => {
    expect(slugify("El Perelló y la Albufera")).toBe("el-perello-y-la-albufera");
    expect(slugify("  ¿Qué ver? ")).toBe("que-ver");
  });

  it("a draft is never public", () => {
    expect(isPubliclyVisible({ ...base, status: "draft" }, NOW)).toBe(false);
  });

  it("a published post with a future date is scheduled, not visible", () => {
    const future = { ...base, publishedAt: "2026-12-31T00:00:00.000Z" };
    expect(isPubliclyVisible(future, NOW)).toBe(false);
    expect(isScheduled(future, NOW)).toBe(true);
  });

  it("a published past-dated post is visible", () => {
    expect(isPubliclyVisible(base, NOW)).toBe(true);
    expect(isScheduled(base, NOW)).toBe(false);
  });

  it("relatedPropertySlug falls back to destination", () => {
    expect(relatedPropertySlug({ ...base, destination: "javalambre" })).toBe("javalambre");
    expect(relatedPropertySlug({ ...base, destination: "valencia" })).toBe("valencia");
    expect(relatedPropertySlug(base)).toBeNull();
    expect(relatedPropertySlug({ ...base, relatedPropertySlug: "valencia" })).toBe("valencia");
  });

  it("ctaForPost returns null for a general post with no property", () => {
    expect(ctaForPost(base)).toBeNull();
    expect(ctaForPost({ ...base, destination: "javalambre" })?.propertySlug).toBe("javalambre");
    expect(ctaForPost({ ...base, destination: "ambos" })?.propertySlug).toBeNull();
  });

  it("readingMinutes is at least 1", () => {
    expect(readingMinutes(base)).toBe(1);
    expect(readingMinutes({ ...base, bodyMarkdown: "palabra ".repeat(600) })).toBe(3);
  });

  it("autoExcerpt uses the explicit excerpt or derives one", () => {
    expect(autoExcerpt({ excerpt: "Mi resumen", bodyMarkdown: "x" })).toBe("Mi resumen");
    expect(autoExcerpt({ excerpt: "", bodyMarkdown: "## Título\n\nUn párrafo." })).toBe("Título Un párrafo.");
  });

  it("relatedPosts ranks same-destination first", () => {
    const a = { ...base, id: "a", destination: "javalambre" as const };
    const b = { ...base, id: "b", destination: "valencia" as const };
    const c = { ...base, id: "c", destination: "javalambre" as const };
    const ranked = relatedPosts(a, [a, b, c], 2);
    expect(ranked[0]?.id).toBe("c");
  });
});
