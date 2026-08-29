import { describe, expect, it } from "vitest";
import { buildQuote, effectiveMinNights, nightlyRateCents } from "./engine";
import type { RateConfig } from "./types";

const config: RateConfig = {
  propertySlug: "javalambre",
  currency: "EUR",
  baseNightlyCents: 10000,
  weekendNightlyCents: 12000,
  minNights: 2,
  maxNights: 30,
  cleaningFeeCents: 5000,
  includedGuests: 4,
  extraGuestNightlyCents: 1500,
  maxGuests: 8,
  seasons: [
    { key: "alta", label: "Alta", start: "12-01", end: "03-31", nightlyCents: 18000, minNights: 3 },
  ],
  discounts: [],
  taxPercent: 0,
  bookingWindowDays: 0,
  leadTimeDays: 0,
};

describe("day-rate overrides (issue #56 §5)", () => {
  it("a per-date price beats season, weekend and base", () => {
    const withOverride: RateConfig = {
      ...config,
      dayRates: [{ date: "2026-07-15", nightlyCents: 25000 }],
    };
    // 2026-07-15 is a Wednesday, no season → base would be 10000
    expect(nightlyRateCents(config, "2026-07-15")).toBe(10000);
    expect(nightlyRateCents(withOverride, "2026-07-15")).toBe(25000);
    // a date without an override is unchanged
    expect(nightlyRateCents(withOverride, "2026-07-16")).toBe(10000);
  });

  it("a per-date minNights raises the effective minimum stay", () => {
    const cfg: RateConfig = {
      ...config,
      dayRates: [{ date: "2026-07-18", minNights: 5 }],
    };
    // July has no season → base minNights 2; the override night forces 5
    expect(effectiveMinNights(config, "2026-07-17", "2026-07-20")).toBe(2);
    expect(effectiveMinNights(cfg, "2026-07-17", "2026-07-20")).toBe(5);
  });

  it("buildQuote uses the override in the per-night breakdown and total", () => {
    const cfg: RateConfig = {
      ...config,
      dayRates: [{ date: "2026-07-20", nightlyCents: 30000 }],
    };
    const quote = buildQuote(cfg, {
      propertySlug: "javalambre",
      checkIn: "2026-07-20",
      checkOut: "2026-07-22",
      guests: 2,
    });
    expect(quote.perNight[0]?.cents).toBe(30000);
    expect(quote.perNight[1]?.cents).toBe(10000);
    expect(quote.nightlySubtotalCents).toBe(40000);
    expect(quote.totalCents).toBe(45000); // + 5000 cleaning, no tax
  });
});
