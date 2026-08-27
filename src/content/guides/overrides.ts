import "server-only";
import { getRepository } from "@/lib/repository";
import { guides as baseGuides } from "./index";
import {
  applyGuideOverride,
  guideOverrideSchema,
  type GuideOverride,
  type ResolvedGuide,
} from "./merge";

/**
 * Light CMS for guides (issue #50): an operator can retitle a guide, rewrite its
 * excerpt, reorder the cluster and flip draft/published — without a deploy. The
 * body sections stay in code (rich editing is out of scope for V1). New guides
 * still need a code change; existing ones are fully controllable here. The pure
 * merge lives in `./merge` (unit-tested).
 */

export { guideOverrideSchema };
export type { GuideOverride, ResolvedGuide };

export const guideKey = (propertySlug: string, slug: string) => `guide:${propertySlug}:${slug}`;

async function overridesMap(): Promise<Map<string, GuideOverride>> {
  const rows = await getRepository().listContentOverrides("guide:");
  const map = new Map<string, GuideOverride>();
  for (const r of rows) {
    const parsed = guideOverrideSchema.safeParse(r.value);
    if (parsed.success) map.set(r.key, parsed.data);
  }
  return map;
}

/** Every guide with overrides applied, sorted by (order, slug). */
export async function resolveGuides(): Promise<ResolvedGuide[]> {
  const map = await overridesMap();
  return baseGuides
    .map((g, i) => applyGuideOverride(g, map.get(guideKey(g.propertySlug, g.slug)), i))
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export async function resolvePublishedGuides(propertySlug?: string): Promise<ResolvedGuide[]> {
  const all = await resolveGuides();
  return all.filter(
    (g) => g.published && (propertySlug ? g.propertySlug === propertySlug : true),
  );
}

const HUB_TO_PROPERTY: Record<string, string> = { javalambre: "javalambre", "valencia-playa": "valencia" };

export async function resolveSatelliteGuides(hubSlug: string): Promise<ResolvedGuide[]> {
  const prop = HUB_TO_PROPERTY[hubSlug];
  if (!prop) return [];
  return (await resolvePublishedGuides(prop)).filter((g) => !g.pillar);
}

/** A satellite guide by (hub, slug) — returned even if a draft, with a flag. */
export async function resolveSatelliteGuide(
  hubSlug: string,
  slug: string,
): Promise<{ guide: ResolvedGuide; published: boolean } | undefined> {
  const prop = HUB_TO_PROPERTY[hubSlug];
  if (!prop) return undefined;
  const all = await resolveGuides();
  const guide = all.find((g) => g.propertySlug === prop && g.slug === slug && !g.pillar);
  return guide ? { guide, published: guide.published } : undefined;
}

export async function getGuideOverride(propertySlug: string, slug: string): Promise<GuideOverride | null> {
  const row = await getRepository().getContentOverride(guideKey(propertySlug, slug));
  if (!row) return null;
  const parsed = guideOverrideSchema.safeParse(row.value);
  return parsed.success ? parsed.data : null;
}

export async function setGuideOverride(
  propertySlug: string,
  slug: string,
  value: GuideOverride | null,
): Promise<void> {
  await getRepository().setContentOverride(guideKey(propertySlug, slug), value);
}
