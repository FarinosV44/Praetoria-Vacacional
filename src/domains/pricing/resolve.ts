import "server-only";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { safeRateConfig } from "./schema";
import type { RateConfig } from "./types";

/**
 * The effective rate config for a property: the admin-saved override (issue #13)
 * if present and valid, otherwise the file default (`src/content/rates`), with
 * per-date `daily_rates` overrides (issue #56 §5) merged in.
 * Server-only — reads the repository.
 */
export async function resolveRateConfig(slug: string): Promise<RateConfig | undefined> {
  const fileDefault = getRateConfig(slug);
  const property = getPropertyBySlug(slug);
  if (!property) return fileDefault;

  let base: RateConfig | undefined = fileDefault;
  try {
    const override = await getRepository().getRateOverride(property.id);
    if (override) {
      const valid = safeRateConfig(override);
      if (valid) base = { ...valid, propertySlug: slug };
    }
  } catch {
    // Repository unavailable — fall back to the file default.
  }
  if (!base) return undefined;

  try {
    const dayRates = await getRepository().listDailyRates(property.id);
    if (dayRates.length) return { ...base, dayRates };
  } catch {
    // Repository unavailable — return the config without per-date overrides.
  }
  return base;
}
