import "server-only";
import { getRepository } from "@/lib/repository";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { safeRateConfig } from "./schema";
import type { RateConfig } from "./types";

/**
 * The effective rate config for a property: the admin-saved override (issue #13)
 * if present and valid, otherwise the file default (`src/content/rates`).
 * Server-only — reads the repository.
 */
export async function resolveRateConfig(slug: string): Promise<RateConfig | undefined> {
  const fileDefault = getRateConfig(slug);
  const property = getPropertyBySlug(slug);
  if (!property) return fileDefault;

  try {
    const override = await getRepository().getRateOverride(property.id);
    if (override) {
      const valid = safeRateConfig(override);
      if (valid) return { ...valid, propertySlug: slug };
    }
  } catch {
    // Repository unavailable — fall back to the file default.
  }
  return fileDefault;
}
