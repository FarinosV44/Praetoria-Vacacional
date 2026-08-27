import { javalambre } from "@/content/properties/javalambre";
import { valencia } from "@/content/properties/valencia";
import type { Experience, PropertyContent } from "./types";

/**
 * The single place every property is registered.
 *
 * Adding a third property (issue #1 acceptance criterion): create
 * `src/content/properties/<slug>.ts`, import it here, add it to the array, seed
 * a `properties` row + `rate_rules`. Nothing else in the codebase enumerates
 * properties by name — pages, sitemap, admin, pricing and sync all read this.
 */
const ALL: readonly PropertyContent[] = [javalambre, valencia] as const;

export type PropertySlug = (typeof ALL)[number]["slug"];

export function getAllProperties(): readonly PropertyContent[] {
  return ALL;
}

export function getPropertyBySlug(slug: string): PropertyContent | undefined {
  return ALL.find((p) => p.slug === slug);
}

export function getPropertyById(id: string): PropertyContent | undefined {
  return ALL.find((p) => p.id === id);
}

export function requireProperty(slug: string): PropertyContent {
  const p = getPropertyBySlug(slug);
  if (!p) throw new Error(`Unknown property: ${slug}`);
  return p;
}

export function getPropertiesByExperience(experience: Experience): PropertyContent[] {
  return ALL.filter((p) => p.experience === experience);
}

export function propertySlugs(): string[] {
  return ALL.map((p) => p.slug);
}

/** Theme tokens per experience — consumed by Tailwind data-attributes and JSON-LD. */
export const experienceMeta: Record<
  Experience,
  { label: string; labelEn: string; accent: string; icon: string }
> = {
  ski: { label: "Nieve", labelEn: "Snow", accent: "sky", icon: "snowflake" },
  sea: { label: "Playa", labelEn: "Beach", accent: "amber", icon: "wave" },
};
