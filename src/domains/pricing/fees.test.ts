import { describe, expect, it } from "vitest";
import { feesTotalCents, quoteFees, resolveStayFees, taxableFeesCents } from "./fees";
import { buildQuote } from "./engine";
import type { QuoteRequest, RateConfig } from "./types";

const base: RateConfig = {
  propertySlug: "test",
  currency: "EUR",
  baseNightlyCents: 10000,
  minNights: 1,
  maxNights: 0,
  cleaningFeeCents: 0,
  includedGuests: 4,
  extraGuestNightlyCents: 0,
  maxGuests: 6,
  seasons: [],
  discounts: [],
  taxPercent: 0,
  bookingWindowDays: 0,
  leadTimeDays: 0,
};

const req: QuoteRequest = {
  propertySlug: "test",
  checkIn: "2026-06-01",
  checkOut: "2026-06-04", // 3 nights = 30000
  guests: 2,
};
const NOW = "2026-04-01";

describe("resolveStayFees (issue #58)", () => {
  it("returns nothing when no fees are configured", () => {
    expect(resolveStayFees(base)).toEqual([]);
  });

  it("ignores a disabled charge entirely", () => {
    const cfg = { ...base, fees: [{ key: "cleaning", label: "Limpieza", enabled: false, amountCents: 4500 }] };
    expect(resolveStayFees(cfg)).toEqual([]);
    expect(feesTotalCents(cfg)).toBe(0);
  });

  it("ignores an enabled but zero charge (no 0 € line)", () => {
    const cfg = { ...base, fees: [{ key: "cleaning", label: "Limpieza", enabled: true, amountCents: 0 }] };
    expect(resolveStayFees(cfg)).toEqual([]);
  });

  it("returns an enabled, non-zero charge", () => {
    const cfg = {
      ...base,
      fees: [{ key: "cleaning", label: "Limpieza", enabled: true, amountCents: 4500, description: "Al salir" }],
    };
    expect(quoteFees(cfg)).toEqual([
      { key: "cleaning", label: "Limpieza", amountCents: 4500, description: "Al salir" },
    ]);
  });

  it("falls back to the legacy cleaningFeeCents when `fees` is absent", () => {
    const cfg = { ...base, cleaningFeeCents: 3000 };
    expect(quoteFees(cfg)).toEqual([{ key: "cleaning", label: "Limpieza", amountCents: 3000 }]);
  });

  it("`fees` wins over the legacy cleaningFeeCents", () => {
    const cfg = {
      ...base,
      cleaningFeeCents: 9999,
      fees: [{ key: "cleaning", label: "Limpieza", enabled: false, amountCents: 4500 }],
    };
    expect(feesTotalCents(cfg)).toBe(0);
  });

  it("only taxable charges count towards taxable fees", () => {
    const cfg = {
      ...base,
      fees: [
        { key: "cleaning", label: "Limpieza", enabled: true, amountCents: 4500 },
        { key: "linen", label: "Ropa de cama", enabled: true, amountCents: 1500, taxable: true },
      ],
    };
    expect(feesTotalCents(cfg)).toBe(6000);
    expect(taxableFeesCents(cfg)).toBe(1500);
  });
});

describe("buildQuote with optional fees (issue #58)", () => {
  it("no fee configured → no fee lines, total is just the nights", () => {
    const q = buildQuote(base, req, NOW);
    expect(q.fees).toEqual([]);
    expect(q.feesCents).toBe(0);
    expect(q.totalCents).toBe(30000);
  });

  it("disabled cleaning → total unchanged, nothing shown", () => {
    const cfg = { ...base, fees: [{ key: "cleaning", label: "Limpieza", enabled: false, amountCents: 4500 }] };
    const q = buildQuote(cfg, req, NOW);
    expect(q.fees).toEqual([]);
    expect(q.totalCents).toBe(30000);
  });

  it("enabled cleaning → one line and the total includes it", () => {
    const cfg = { ...base, fees: [{ key: "cleaning", label: "Limpieza", enabled: true, amountCents: 4500 }] };
    const q = buildQuote(cfg, req, NOW);
    expect(q.fees).toEqual([{ key: "cleaning", label: "Limpieza", amountCents: 4500 }]);
    expect(q.feesCents).toBe(4500);
    expect(q.totalCents).toBe(34500);
  });

  it("two properties carry independent fee configs", () => {
    const jv = { ...base, fees: [{ key: "cleaning", label: "Limpieza", enabled: true, amountCents: 4500 }] };
    const vlc = { ...base, propertySlug: "vlc", fees: [{ key: "cleaning", label: "Limpieza", enabled: false, amountCents: 5000 }] };
    expect(buildQuote(jv, req, NOW).totalCents).toBe(34500);
    expect(buildQuote(vlc, { ...req, propertySlug: "vlc" }, NOW).totalCents).toBe(30000);
  });

  it("a taxable fee is included in the tax base", () => {
    const cfg = {
      ...base,
      taxPercent: 10,
      fees: [
        { key: "cleaning", label: "Limpieza", enabled: true, amountCents: 4000 }, // not taxable
        { key: "linen", label: "Ropa", enabled: true, amountCents: 1000, taxable: true },
      ],
    };
    const q = buildQuote(cfg, req, NOW);
    // tax on 30000 (nights) + 1000 (taxable fee) = 3100
    expect(q.taxCents).toBe(3100);
    expect(q.totalCents).toBe(30000 + 5000 + 3100);
  });
});
