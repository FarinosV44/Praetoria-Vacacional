import type { RateConfig } from "@/domains/pricing/types";

/**
 * Default rate configuration per property (issue #8).
 *
 * These are STARTING values, fully independent per property. In production they
 * are seeded into `rate_rules` / `property_settings` and edited from the admin
 * panel (issue #13); this file is the seed + the DEMO-mode source of truth.
 *
 * All amounts in EUR cents. Adjust with the owner's real pricing before go-live.
 */

export const javalambreRates: RateConfig = {
  propertySlug: "javalambre",
  currency: "EUR",
  baseNightlyCents: 9000, // 90 €
  weekendNightlyCents: 11000, // 110 €
  minNights: 2,
  maxNights: 21,
  cleaningFeeCents: 0, // legacy — see `fees`
  // Optional per-stay charges (issue #58). Disabled by default: the guest sees
  // no cleaning line until the owner turns it on from Admin → Precios y cargos.
  fees: [
    { key: "cleaning", label: "Limpieza", enabled: false, amountCents: 4500 },
  ],
  includedGuests: 4,
  extraGuestNightlyCents: 1200, // 12 €/guest/night above 4
  maxGuests: 6,
  seasons: [
    {
      key: "ski",
      label: "Temporada de esquí",
      start: "12-01",
      end: "03-31",
      nightlyCents: 13500, // 135 €
      weekendNightlyCents: 16500, // 165 €
      minNights: 2,
    },
    {
      key: "easter",
      label: "Semana Santa",
      start: "03-24",
      end: "04-07",
      nightlyCents: 12000,
      minNights: 3,
    },
    {
      key: "summer-mountain",
      label: "Verano en la montaña",
      start: "07-01",
      end: "08-31",
      nightlyCents: 10500,
    },
  ],
  discounts: [
    { minNights: 7, percent: 10, label: "Descuento por semana completa" },
    { minNights: 14, percent: 15, label: "Descuento por estancia larga" },
  ],
  taxPercent: 0,
  bookingWindowDays: 540,
  leadTimeDays: 1,
};

export const valenciaRates: RateConfig = {
  propertySlug: "valencia",
  currency: "EUR",
  baseNightlyCents: 8500, // 85 €
  weekendNightlyCents: 10000,
  minNights: 2,
  maxNights: 28,
  cleaningFeeCents: 0, // legacy — see `fees`
  fees: [
    { key: "cleaning", label: "Limpieza", enabled: false, amountCents: 5000 },
  ],
  includedGuests: 2,
  extraGuestNightlyCents: 1500,
  maxGuests: 6,
  seasons: [
    {
      key: "summer-beach",
      label: "Temporada alta de playa",
      start: "06-15",
      end: "09-15",
      nightlyCents: 15000, // 150 €
      weekendNightlyCents: 17500,
      minNights: 4,
    },
    {
      key: "easter",
      label: "Semana Santa",
      start: "03-24",
      end: "04-07",
      nightlyCents: 12000,
      minNights: 3,
    },
    {
      key: "fallas",
      label: "Fallas",
      start: "03-14",
      end: "03-20",
      nightlyCents: 16000,
      minNights: 3,
    },
  ],
  discounts: [
    { minNights: 7, percent: 8, label: "Descuento por semana completa" },
    { minNights: 21, percent: 18, label: "Descuento por estancia mensual" },
  ],
  taxPercent: 0,
  bookingWindowDays: 540,
  leadTimeDays: 1,
};

const RATES: Record<string, RateConfig> = {
  javalambre: javalambreRates,
  valencia: valenciaRates,
};

export function getRateConfig(slug: string): RateConfig | undefined {
  return RATES[slug];
}

export function allRateConfigs(): RateConfig[] {
  return Object.values(RATES);
}
