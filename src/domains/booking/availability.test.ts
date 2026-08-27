import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  busyNightSet,
  firstConflictNight,
  isRangeAvailable,
  occupancy,
} from "./availability";
import type { BusyRange } from "./types";

const ranges: BusyRange[] = [
  { start: "2026-03-10", end: "2026-03-14", kind: "reservation" }, // nights 10,11,12,13
  { start: "2026-03-20", end: "2026-03-22", kind: "block" }, // nights 20,21
];

describe("isRangeAvailable", () => {
  it("accepts a gap between two busy ranges", () => {
    expect(isRangeAvailable(ranges, "2026-03-14", "2026-03-20")).toBe(true);
  });
  it("allows checking in on another guest's checkout day", () => {
    expect(isRangeAvailable(ranges, "2026-03-14", "2026-03-18")).toBe(true);
  });
  it("allows checking out on a busy range's start day", () => {
    expect(isRangeAvailable(ranges, "2026-03-06", "2026-03-10")).toBe(true);
  });
  it("rejects a stay straddling a booked night", () => {
    expect(isRangeAvailable(ranges, "2026-03-12", "2026-03-16")).toBe(false);
  });
  it("rejects an inverted range", () => {
    expect(isRangeAvailable(ranges, "2026-03-16", "2026-03-12")).toBe(false);
  });
});

describe("firstConflictNight", () => {
  it("returns the first taken night", () => {
    expect(firstConflictNight(ranges, "2026-03-08", "2026-03-12")).toBe("2026-03-10");
  });
  it("returns null when clear", () => {
    expect(firstConflictNight(ranges, "2026-03-14", "2026-03-19")).toBeNull();
  });
});

describe("busyNightSet", () => {
  it("expands ranges to individual nights", () => {
    expect([...busyNightSet(ranges)].sort()).toEqual([
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-20",
      "2026-03-21",
    ]);
  });
});

describe("buildCalendar", () => {
  it("marks past, busy, checkout-only and free days", () => {
    const cal = buildCalendar(ranges, "2026-03-08", "2026-03-16", "2026-03-09");
    const byDate = Object.fromEntries(cal.map((d) => [d.date, d.state]));
    expect(byDate["2026-03-08"]).toBe("past");
    expect(byDate["2026-03-10"]).toBe("busy");
    expect(byDate["2026-03-13"]).toBe("busy");
    expect(byDate["2026-03-14"]).toBe("checkout-only");
    expect(byDate["2026-03-15"]).toBe("free");
  });
});

describe("property independence", () => {
  it("only considers the ranges it is given", () => {
    // Valencia's busy ranges never reach this call — Javalambre stays free.
    const javalambreRanges: BusyRange[] = [];
    expect(isRangeAvailable(javalambreRanges, "2026-03-10", "2026-03-14")).toBe(true);
  });
});

describe("occupancy", () => {
  it("is 0 when nothing is booked in the window", () => {
    const o = occupancy([], "2026-03-01", "2026-03-31");
    expect(o.busyNights).toBe(0);
    expect(o.rate).toBe(0);
    expect(o.totalNights).toBe(30);
  });
  it("counts only nights inside the window", () => {
    // ranges: 10-13 (4 nights) + 20-21 (2 nights) = 6 busy nights in March 1-31
    const o = occupancy(ranges, "2026-03-01", "2026-03-31");
    expect(o.busyNights).toBe(6);
    expect(o.totalNights).toBe(30);
    expect(o.rate).toBeCloseTo(6 / 30);
  });
  it("clips busy ranges that start before the window", () => {
    const o = occupancy(ranges, "2026-03-12", "2026-03-14"); // nights 12,13 both busy
    expect(o.busyNights).toBe(2);
    expect(o.totalNights).toBe(2);
    expect(o.rate).toBe(1);
  });
});
