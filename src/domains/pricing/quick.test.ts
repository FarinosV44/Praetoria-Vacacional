import { describe, expect, it } from "vitest";
import { applyQuickRateChanges } from "./quick";
import { buildQuote } from "./engine";
import { javalambreRates } from "@/content/rates";

describe("applyQuickRateChanges (admin phone app)", () => {
  it("changes base, weekend and season prices without mutating the input", () => {
    const res = applyQuickRateChanges(javalambreRates, [
      { field: "base", cents: 9500 },
      { field: "weekend", cents: 11500 },
      { field: "season:ski", cents: 14000 },
      { field: "season-weekend:ski", cents: 17000 },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.config.baseNightlyCents).toBe(9500);
    expect(res.config.weekendNightlyCents).toBe(11500);
    const ski = res.config.seasons.find((s) => s.key === "ski")!;
    expect(ski.nightlyCents).toBe(14000);
    expect(ski.weekendNightlyCents).toBe(17000);
    expect(javalambreRates.seasons.find((s) => s.key === "ski")!.nightlyCents).toBe(13500);
  });

  it("the new prices drive the quote", () => {
    const res = applyQuickRateChanges(javalambreRates, [{ field: "season-weekend:ski", cents: 20000 }]);
    if (!res.ok) throw new Error(res.error);
    // Fri 15 → Sun 17 Jan 2027: two weekend nights in ski season, 2 guests.
    const q = buildQuote(res.config, { propertySlug: "javalambre", checkIn: "2027-01-15", checkOut: "2027-01-17", guests: 2 }, "2026-10-26");
    expect(q.nightlySubtotalCents).toBe(40000);
  });

  it("drops per-date overrides so they are not copied into the saved tariff", () => {
    const res = applyQuickRateChanges({ ...javalambreRates, dayRates: [{ date: "2027-01-01", nightlyCents: 30000 }] }, []);
    expect(res.ok && res.config.dayRates).toBeUndefined();
  });

  it("rejects out-of-range prices, unknown seasons and unknown fields", () => {
    expect(applyQuickRateChanges(javalambreRates, [{ field: "base", cents: 500 }]).ok).toBe(false);
    expect(applyQuickRateChanges(javalambreRates, [{ field: "base", cents: 600000 }]).ok).toBe(false);
    expect(applyQuickRateChanges(javalambreRates, [{ field: "season:nope", cents: 9000 }]).ok).toBe(false);
    expect(applyQuickRateChanges(javalambreRates, [{ field: "taxPercent", cents: 9000 }]).ok).toBe(false);
  });
});
