import { describe, expect, it } from "vitest";
import { defaultDynamicSettings, suggestNightlyRate, type DynamicContext } from "./dynamic";

const ctx = (o: Partial<DynamicContext>): DynamicContext => ({
  date: "2026-10-10",
  baseNightlyCents: 10000,
  floorCents: 6000,
  bandPct: 25,
  leadDays: 40,
  windowOccupancy: 0.4,
  isOrphanNight: false,
  ...o,
});

describe("suggestNightlyRate", () => {
  it("leaves a neutral date at base", () => {
    const s = suggestNightlyRate(ctx({}));
    expect(s.recommendedCents).toBe(10000);
    expect(s.factors).toHaveLength(0);
  });

  it("surges on very high demand, within the band", () => {
    const s = suggestNightlyRate(ctx({ windowOccupancy: 0.95, leadDays: 30 }));
    expect(s.factors[0]!.label).toBe("Demanda muy alta");
    expect(s.recommendedCents).toBe(11800); // +18%, inside the ±25% band
    expect(s.clamped).toBeNull();
  });

  it("caps a stacked increase at +25%", () => {
    const s = suggestNightlyRate(ctx({ windowOccupancy: 0.95, leadDays: 130 }));
    // +18 +4 = +22% -> 12200, within band
    expect(s.recommendedCents).toBe(12200);
  });

  it("discounts last-minute + low demand, clamped by the band then the floor", () => {
    const s = suggestNightlyRate(ctx({ leadDays: 2, windowOccupancy: 0.1, floorCents: 8000 }));
    // -12 -8 = -20% -> 8000; floor is 8000
    expect(s.recommendedCents).toBe(8000);
  });

  it("never goes below the floor", () => {
    const s = suggestNightlyRate(ctx({ leadDays: 1, windowOccupancy: 0.05, isOrphanNight: true, floorCents: 9000 }));
    expect(s.recommendedCents).toBe(9000);
    expect(s.clamped).toBe("floor");
  });

  it("discounts an orphan night", () => {
    const s = suggestNightlyRate(ctx({ isOrphanNight: true }));
    expect(s.recommendedCents).toBe(8500);
    expect(s.changePct).toBe(-15);
  });
});

describe("defaultDynamicSettings", () => {
  it("starts disabled with a 60% floor and a 25% band", () => {
    expect(defaultDynamicSettings(10000)).toEqual({
      enabled: false,
      floorCents: 6000,
      bandPct: 25,
      horizonDays: 60,
    });
  });
});
