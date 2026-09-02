import "server-only";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug, localizedProperty, getAllProperties } from "./registry";
import type { PropertyContent } from "./types";
import { applyPropertyOverride, propertyOverrideSchema, type PropertyOverride } from "./merge";

/**
 * Light CMS layer (issue #50): deep-merges admin-saved overrides over the
 * static property content. Only the fields an operator should be able to fix
 * without a deploy are editable; booking logic (prices, capacity, IDs) is not.
 * The pure merge lives in `./merge` (unit-tested); this file adds the repo read.
 */

export { applyPropertyOverride, propertyOverrideSchema };
export type { PropertyOverride };

const keyFor = (slug: string) => `property:${slug}`;

export async function getPropertyOverride(slug: string): Promise<PropertyOverride | null> {
  let row;
  try {
    row = await getRepository().getContentOverride(keyFor(slug));
  } catch (err) {
    // A CMS override is a nice-to-have. If the database is unreachable the
    // public pages must still render from static content — never 5xx the home
    // or property page because an optional override read failed.
    console.error(`[properties] override read failed for ${slug}; using static content`, err);
    return null;
  }
  if (!row) return null;
  const parsed = propertyOverrideSchema.safeParse(row.value);
  return parsed.success ? parsed.data : null;
}

export async function setPropertyOverride(slug: string, value: PropertyOverride | null): Promise<void> {
  await getRepository().setContentOverride(keyFor(slug), value);
}

/** The property a page should render: static content + locale + CMS overrides. */
export async function resolveProperty(
  slug: string,
  locale: "es" | "en",
): Promise<PropertyContent | null> {
  const base = getPropertyBySlug(slug);
  if (!base) return null;
  const localized = localizedProperty(base, locale);
  const override = await getPropertyOverride(slug);
  return applyPropertyOverride(localized, override);
}

/** All properties for the home page, in [sea, ski] order, with overrides applied. */
export async function resolvePropertiesForHome(locale: "es" | "en"): Promise<PropertyContent[]> {
  const out = await Promise.all(
    getAllProperties().map((p) => resolveProperty(p.slug, locale)),
  );
  const resolved = out.filter((p): p is PropertyContent => p !== null);
  return resolved.sort((a, b) => (a.experience === "sea" ? -1 : 1) - (b.experience === "sea" ? -1 : 1));
}
