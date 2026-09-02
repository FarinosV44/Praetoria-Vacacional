import "server-only";
import { addDays, todayIso, type IsoDate } from "@/lib/dates";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { nightlyRateCents } from "@/domains/pricing/engine";
import { occupancy } from "@/domains/booking/availability";
import { busyNightSet } from "@/domains/booking/availability";
import { logAction } from "@/domains/admin/audit";
import { reportMessage } from "@/lib/observability/report";
import {
  defaultDynamicSettings,
  suggestNightlyRate,
  type DynamicPricingSettings,
  type PricingSuggestion,
} from "./dynamic";

/**
 * Issue #74 — compute and (optionally) apply the dynamic-pricing plan for a
 * property. The "natural" price comes from the static rate config (seasons +
 * weekend), never the resolved config, so re-running does not ratchet.
 */

const SETTINGS_KEY = (propertyId: string) => `pricing:dynamic:${propertyId}`;

export async function getDynamicSettings(
  propertyId: string,
  baseNightlyCents: number,
): Promise<DynamicPricingSettings> {
  const row = await getRepository().getContentOverride(SETTINGS_KEY(propertyId)).catch(() => null);
  const stored = (row?.value as Partial<DynamicPricingSettings> | undefined) ?? {};
  return { ...defaultDynamicSettings(baseNightlyCents), ...stored };
}

export async function saveDynamicSettings(
  propertyId: string,
  patch: Partial<DynamicPricingSettings>,
): Promise<void> {
  const current = await getDynamicSettings(propertyId, 0);
  await getRepository().setContentOverride(SETTINGS_KEY(propertyId), { ...current, ...patch });
}

export interface DynamicPlan {
  propertySlug: string;
  settings: DynamicPricingSettings;
  suggestions: PricingSuggestion[];
}

export async function computeDynamicPlan(propertySlug: string): Promise<DynamicPlan | null> {
  const property = getPropertyBySlug(propertySlug);
  const config = getRateConfig(propertySlug);
  if (!property || !config) return null;

  const settings = await getDynamicSettings(property.id, config.baseNightlyCents);
  const start = todayIso();
  const end = addDays(start, settings.horizonDays);

  const repo = getRepository();
  const ranges = await repo
    .getBusyRanges(property.id, addDays(start, -10), addDays(end, 10))
    .catch(() => []);
  const busy = busyNightSet(ranges);

  const suggestions: PricingSuggestion[] = [];
  let cursor: IsoDate = start;
  let i = 0;
  while (cursor < end && i < 400) {
    if (!busy.has(cursor)) {
      const leadDays = i;
      const winFrom = addDays(cursor, -7);
      const winTo = addDays(cursor, 7);
      const { rate } = occupancy(ranges, winFrom, winTo);
      const isOrphanNight = busy.has(addDays(cursor, -1)) && busy.has(addDays(cursor, 1));
      suggestions.push(
        suggestNightlyRate({
          date: cursor,
          baseNightlyCents: nightlyRateCents(config, cursor),
          floorCents: settings.floorCents,
          bandPct: settings.bandPct,
          leadDays,
          windowOccupancy: rate,
          isOrphanNight,
        }),
      );
    }
    cursor = addDays(cursor, 1);
    i += 1;
  }

  return { propertySlug, settings, suggestions };
}

export interface ApplyResult {
  propertySlug: string;
  applied: number;
  skippedNoChange: number;
  enabled: boolean;
}

export async function applyDynamicPricing(
  propertySlug: string,
  opts: { force?: boolean } = {},
): Promise<ApplyResult> {
  const plan = await computeDynamicPlan(propertySlug);
  if (!plan) return { propertySlug, applied: 0, skippedNoChange: 0, enabled: false };
  if (!plan.settings.enabled && !opts.force) {
    return { propertySlug, applied: 0, skippedNoChange: 0, enabled: false };
  }

  const property = getPropertyBySlug(propertySlug)!;
  const repo = getRepository();
  let applied = 0;
  let skipped = 0;

  for (const s of plan.suggestions) {
    if (s.recommendedCents === s.baseCents) {
      skipped += 1;
      continue;
    }
    await repo.setDailyRates(property.id, [s.date], { nightlyCents: s.recommendedCents });
    applied += 1;
  }

  if (applied) {
    await logAction("pricing.dynamic_apply", {
      entity: "property",
      entityId: property.id,
      meta: { applied, horizonDays: plan.settings.horizonDays, forced: !!opts.force },
    });
    reportMessage("dynamic pricing applied", "info", {
      scope: "pricing/dynamic",
      extra: { propertySlug, applied },
    });
  }
  return { propertySlug, applied, skippedNoChange: skipped, enabled: plan.settings.enabled };
}
