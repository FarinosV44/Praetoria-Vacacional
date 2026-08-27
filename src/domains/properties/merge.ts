import { z } from "zod";
import type { NearbyPoint, PropertyContent } from "./types";

/**
 * Pure merge logic for the light CMS (issue #50). No I/O — takes a property and
 * an override document and returns the property a page should render. Kept
 * separate from `content.ts` (which does the repository read) so it is unit
 * testable per the project's pure-logic-first policy.
 */

export const propertyOverrideSchema = z.object({
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(200).optional(),
  h1: z.string().trim().max(120).optional(),
  tagline: z.string().trim().max(160).optional(),
  shortIntro: z.string().trim().max(600).optional(),
  highlights: z
    .array(z.object({ title: z.string().trim().min(2).max(120), body: z.string().trim().min(2).max(400) }))
    .max(8)
    .optional(),
  nearby: z
    .array(z.object({ name: z.string().trim().min(2).max(120), distance: z.string().trim().min(1).max(40) }))
    .max(20)
    .optional(),
  faq: z
    .array(z.object({ question: z.string().trim().min(4).max(200), answer: z.string().trim().min(4).max(800) }))
    .max(20)
    .optional(),
});

export type PropertyOverride = z.infer<typeof propertyOverrideSchema>;

/** Apply an override document over an (already locale-resolved) property. */
export function applyPropertyOverride(
  p: PropertyContent,
  o: PropertyOverride | null,
): PropertyContent {
  if (!o) return p;
  const next: PropertyContent = { ...p, seo: { ...p.seo } };
  if (o.metaTitle) next.seo.metaTitle = o.metaTitle;
  if (o.metaDescription) next.seo.metaDescription = o.metaDescription;
  if (o.h1) next.seo.h1 = o.h1;
  if (o.tagline) next.tagline = o.tagline;
  if (o.shortIntro) next.shortIntro = o.shortIntro;
  if (o.highlights) next.highlights = o.highlights;
  if (o.faq) next.faq = o.faq;
  if (o.nearby) {
    const categoryByName = new Map(p.nearby.map((n) => [n.name, n.category]));
    next.nearby = o.nearby.map(
      (n): NearbyPoint => ({
        name: n.name,
        distance: n.distance,
        category: categoryByName.get(n.name) ?? "landmark",
      }),
    );
  }
  return next;
}
