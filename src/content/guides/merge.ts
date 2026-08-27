import { z } from "zod";
import type { Guide } from "./index";

/** Pure merge logic for the guide CMS (issue #50). Unit-tested; no I/O. */

export const guideOverrideSchema = z.object({
  title: z.string().trim().min(4).max(120).optional(),
  description: z.string().trim().min(10).max(200).optional(),
  lead: z.string().trim().min(10).max(600).optional(),
  status: z.enum(["draft", "published"]).optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

export type GuideOverride = z.infer<typeof guideOverrideSchema>;

export interface ResolvedGuide extends Guide {
  /** Sort key for the cluster; lower first. */
  order: number;
}

export function applyGuideOverride(
  g: Guide,
  o: GuideOverride | undefined,
  index: number,
): ResolvedGuide {
  return {
    ...g,
    title: o?.title ?? g.title,
    description: o?.description ?? g.description,
    lead: o?.lead ?? g.lead,
    published: o?.status ? o.status === "published" : g.published,
    order: o?.order ?? index,
  };
}
