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

/**
 * A property with English priority fields applied (issue #29). Deep sections and
 * FAQ fall back to Spanish only when no reviewed English copy exists; callers
 * that render those should check `p.en?.sections` before assuming translation.
 */
export function localizedProperty(p: PropertyContent, locale: "es" | "en"): PropertyContent {
  if (locale === "es" || !p.en) return p;
  return {
    ...p,
    tagline: p.en.tagline,
    shortIntro: p.en.shortIntro,
    seo: p.en.seo,
    highlights: p.en.highlights ?? p.highlights,
    sections: p.en.sections ?? p.sections,
    faq: p.en.faq ?? p.faq,
    cancellationPolicy: {
      ...p.cancellationPolicy,
      summary: p.en.cancellationSummary ?? p.cancellationPolicy.summary,
    },
  };
}

/** Theme tokens per experience — consumed by Tailwind data-attributes and JSON-LD. */
export const experienceMeta: Record<
  Experience,
  { label: string; labelEn: string; accent: string; icon: string }
> = {
  ski: { label: "Nieve", labelEn: "Snow", accent: "sky", icon: "snowflake" },
  sea: { label: "Playa", labelEn: "Beach", accent: "amber", icon: "wave" },
};
