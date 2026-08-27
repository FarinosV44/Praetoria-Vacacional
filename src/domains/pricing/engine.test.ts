import { describe, expect, it } from "vitest";
import { buildQuote, effectiveMinNights, seasonCovers } from "./engine";
import type { QuoteRequest, RateConfig } from "./types";

/** Fixed "today" so fixture dates are always in the bookable future. */
const NOW = "2026-04-01";
const quote = (config: RateConfig, req: QuoteRequest) => buildQuote(config, req, NOW);

const base: RateConfig = {
  propertySlug: "test",
  currency: "EUR",
  baseNightlyCents: 10000,
  weekendNightlyCents: 12000,
  minNights: 2,
  maxNights: 20,
  cleaningFeeCents: 4000,
  includedGuests: 2,
  extraGuestNightlyCents: 1000,
  maxGuests: 4,
  seasons: [
    { key: "high", label: "Alta", start: "07-01", end: "08-31", nightlyCents: 20000, minNights: 4 },
    { key: "ski", label: "Esquí", start: "12-15", end: "02-28", nightlyCents: 18000 },
  ],
  discounts: [{ minNights: 7, percent: 10, label: "Semana" }],
  taxPercent: 0,
  bookingWindowDays: 0,
  leadTimeDays: 0,
};

describe("seasonCovers", () => {
  it("matches a normal season window", () => {
    expect(seasonCovers(base.seasons[0]!, "2026-07-15")).toBe(true);
    expect(seasonCovers(base.seasons[0]!, "2026-09-01")).toBe(false);
  });
  it("matches a season that wraps the year end", () => {
    expect(seasonCovers(base.seasons[1]!, "2026-12-20")).toBe(true);
    expect(seasonCovers(base.seasons[1]!, "2026-01-10")).toBe(true);
    expect(seasonCovers(base.seasons[1]!, "2026-03-15")).toBe(false);
  });
});

describe("buildQuote — nightly rates", () => {
  it("uses weekday and weekend base rates outside any season", () => {
    // 2026-05-11 Mon .. 2026-05-14 Thu: 3 weekday nights (Mon, Tue, Wed)
    const q = quote(base, { propertySlug: "test", checkIn: "2026-05-11", checkOut: "2026-05-14", guests: 2 });
    expect(q.nights).toBe(3);
    expect(q.nightlySubtotalCents).toBe(30000);
    expect(q.valid).toBe(true);
    expect(q.totalCents).toBe(30000 + 4000);
  });

  it("charges the weekend rate on Friday and Saturday nights", () => {
    // 2026-05-15 Fri .. 2026-05-17 Sun: Fri + Sat nights, both weekend
    const q = quote(base, { propertySlug: "test", checkIn: "2026-05-15", checkOut: "2026-05-17", guests: 2 });
    expect(q.nightlySubtotalCents).toBe(24000);
  });

  it("applies season pricing and season minimum nights", () => {
    const q = quote(base, { propertySlug: "test", checkIn: "2026-07-10", checkOut: "2026-07-13", guests: 2 });
    expect(q.perNight.every((n) => n.seasonKey === "high")).toBe(true);
    expect(q.nightlySubtotalCents).toBe(60000);
    expect(q.valid).toBe(false);
    expect(q.violations).toContainEqual({ code: "min_nights", required: 4, got: 3 });
  });
});

describe("buildQuote — fees, discounts, guests", () => {
  it("adds an extra-guest per-night surcharge above the included guests", () => {
    const q = quote(base, { propertySlug: "test", checkIn: "2026-05-11", checkOut: "2026-05-14", guests: 4 });
    // 2 extra guests * 1000 * 3 nights
    expect(q.extraGuestFeeCents).toBe(6000);
  });

  it("applies the best length-of-stay discount", () => {
    const q = quote(base, { propertySlug: "test", checkIn: "2026-05-04", checkOut: "2026-05-11", guests: 2 });
    expect(q.nights).toBe(7);
    expect(q.lengthOfStayDiscount?.percent).toBe(10);
    expect(q.lengthOfStayDiscount?.amountCents).toBe(Math.round(q.nightlySubtotalCents * 0.1));
  });

  it("rejects too many guests", () => {
    const q = quote(base, { propertySlug: "test", checkIn: "2026-05-11", checkOut: "2026-05-14", guests: 9 });
    expect(q.valid).toBe(false);
    expect(q.violations).toContainEqual({ code: "max_guests", allowed: 4, got: 9 });
  });

  it("rejects an inverted date range without throwing", () => {
    const q = quote(base, { propertySlug: "test", checkIn: "2026-05-14", checkOut: "2026-05-11", guests: 2 });
    expect(q.valid).toBe(false);
    expect(q.totalCents).toBe(0);
    expect(q.violations).toContainEqual({ code: "invalid_range" });
  });
});

describe("independent configs", () => {
  it("produces different totals for the same dates under different configs", () => {
    const cfgA = { ...base, baseNightlyCents: 10000 };
    const cfgB = { ...base, baseNightlyCents: 25000, propertySlug: "b" };
    const req = { propertySlug: "x", checkIn: "2026-05-11", checkOut: "2026-05-14", guests: 2 };
    expect(quote(cfgA, req).totalCents).not.toBe(quote(cfgB, req).totalCents);
  });
});

describe("effectiveMinNights", () => {
  it("takes the strictest season minimum across the stay", () => {
    expect(effectiveMinNights(base, "2026-06-29", "2026-07-03")).toBe(4);
  });
});
