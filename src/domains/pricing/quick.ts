import type { RateConfig } from "./types";

/**
 * Nightly-price edits from the admin phone app (pure, shared by the server
 * action and the live preview). Fields:
 *   "base" · "weekend" · "season:<key>" · "season-weekend:<key>"
 */
export interface QuickRateChange {
  field: string;
  cents: number;
}

export const QUICK_MIN_CENTS = 1000; // 10 €
export const QUICK_MAX_CENTS = 500000; // 5.000 €

export function applyQuickRateChanges(
  config: RateConfig,
  changes: QuickRateChange[],
): { ok: true; config: RateConfig } | { ok: false; error: string } {
  // Per-date overrides live in their own table; never fold them into the override.
  const next: RateConfig = { ...config, seasons: config.seasons.map((s) => ({ ...s })) };
  delete next.dayRates;

  for (const c of changes) {
    const cents = Math.round(Number(c?.cents));
    if (!Number.isFinite(cents) || cents < QUICK_MIN_CENTS || cents > QUICK_MAX_CENTS) {
      return { ok: false, error: "Los precios deben estar entre 10 € y 5.000 € por noche" };
    }
    const field = String(c?.field ?? "");
    if (field === "base") next.baseNightlyCents = cents;
    else if (field === "weekend") next.weekendNightlyCents = cents;
    else if (field.startsWith("season:") || field.startsWith("season-weekend:")) {
      const key = field.slice(field.indexOf(":") + 1);
      const season = next.seasons.find((s) => s.key === key);
      if (!season) return { ok: false, error: `Temporada «${key}» no encontrada` };
      if (field.startsWith("season:")) season.nightlyCents = cents;
      else season.weekendNightlyCents = cents;
    } else {
      return { ok: false, error: "Campo de precio no válido" };
    }
  }
  return { ok: true, config: next };
}
