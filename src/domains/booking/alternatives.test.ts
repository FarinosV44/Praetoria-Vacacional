import { describe, expect, it } from "vitest";
import { nearbyAvailableStays, nextAvailableWeekends, rescueAlternatives } from "./alternatives";
import { consolidateBusyRanges } from "./busy-ranges";
import type { BusyRange } from "./types";

const NOW = "2026-09-01";
const res = (checkIn: string, checkOut: string): BusyRange => ({
  start: checkIn,
  end: checkOut,
  kind: "reservation",
});

describe("nearbyAvailableStays (issue #92)", () => {
  it("returns nothing for a zero-length request", () => {
    expect(nearbyAvailableStays([], "2026-09-12", "2026-09-12", { now: NOW })).toEqual([]);
  });

  it("suggests the closest fully-clear window first, earlier before later", () => {
    // 12→15 occupies nights 12,13,14 → a 3-night stay must shift ≥3 days
    const ranges = [res("2026-09-12", "2026-09-15")];
    const alts = nearbyAvailableStays(ranges, "2026-09-12", "2026-09-15", { now: NOW });
    expect(alts[0]).toMatchObject({ checkIn: "2026-09-09", checkOut: "2026-09-12", shiftDays: -3 });
    expect(alts.map((a) => a.checkIn)).toContain("2026-09-15"); // +3, shares the turnover day
  });

  it("keeps the same number of nights", () => {
    const ranges = [res("2026-09-12", "2026-09-16")]; // 4-night booking
    const alts = nearbyAvailableStays(ranges, "2026-09-12", "2026-09-16", { now: NOW, limit: 2 });
    expect(alts.every((a) => a.nights === 4)).toBe(true);
  });

  it("never proposes a start before now + leadDays", () => {
    const alts = nearbyAvailableStays([], "2026-09-02", "2026-09-05", { now: NOW, leadDays: 2 });
    expect(alts.every((a) => a.checkIn >= "2026-09-03")).toBe(true);
  });

  it("respects the max shift", () => {
    // everything within ±3 days of 12→15 is blocked
    const ranges = [res("2026-09-09", "2026-09-19")];
    expect(
      nearbyAvailableStays(ranges, "2026-09-12", "2026-09-15", { now: NOW, maxShiftDays: 3 }),
    ).toEqual([]);
  });
});

describe("nextAvailableWeekends", () => {
  it("returns Friday→Sunday windows only", () => {
    const weekends = nextAvailableWeekends([], { now: NOW, limit: 2 });
    expect(weekends).toHaveLength(2);
    for (const w of weekends) {
      expect(new Date(`${w.checkIn}T00:00:00Z`).getUTCDay()).toBe(5); // Friday
      expect(w.nights).toBe(2);
      expect(w.kind).toBe("weekend");
    }
  });

  it("skips a weekend that is taken", () => {
    // 2026-09-04 is the first Friday after NOW; block it
    const ranges = [res("2026-09-04", "2026-09-06")];
    const weekends = nextAvailableWeekends(ranges, { now: NOW, limit: 1 });
    expect(weekends[0]!.checkIn).not.toBe("2026-09-04");
  });
});

describe("rescueAlternatives", () => {
  it("prefers shifted windows and tops up with weekends", () => {
    const ranges = [res("2026-09-12", "2026-09-15")];
    const alts = rescueAlternatives(ranges, "2026-09-12", "2026-09-15", { now: NOW, limit: 3 });
    expect(alts).toHaveLength(3);
    expect(alts[0]!.kind).toMatch(/shift/);
  });

  it("works with consolidated ranges from reservations + blocks", () => {
    const ranges = consolidateBusyRanges(
      [{ status: "confirmed", checkIn: "2026-09-12", checkOut: "2026-09-15" }],
      [{ startDate: "2026-09-15", endDate: "2026-09-18" }],
    );
    const alts = rescueAlternatives(ranges, "2026-09-12", "2026-09-15", { now: NOW });
    // 9→12 is still free; 15→18 is now blocked by the imported block
    expect(alts.some((a) => a.checkIn === "2026-09-09")).toBe(true);
    expect(alts.some((a) => a.checkIn === "2026-09-15")).toBe(false);
  });
});
