import { describe, expect, it } from "vitest";
import { findHardGaps } from "./gaps";
import type { BusyRange } from "@/domains/booking/types";

const r = (start: string, end: string): BusyRange => ({ start, end, kind: "reservation" });

describe("findHardGaps (issue #60)", () => {
  it("finds a 2-night hole between two reservations", () => {
    const ranges = [r("2026-07-01", "2026-07-05"), r("2026-07-07", "2026-07-10")];
    expect(findHardGaps(ranges, "2026-06-01", "2026-08-01")).toEqual([
      { checkIn: "2026-07-05", checkOut: "2026-07-07", nights: 2 },
    ]);
  });

  it("ignores gaps longer than maxNights", () => {
    const ranges = [r("2026-07-01", "2026-07-05"), r("2026-07-12", "2026-07-15")];
    expect(findHardGaps(ranges, "2026-06-01", "2026-08-01")).toEqual([]);
  });

  it("ignores a shared turnover day (0 nights)", () => {
    const ranges = [r("2026-07-01", "2026-07-05"), r("2026-07-05", "2026-07-08")];
    expect(findHardGaps(ranges, "2026-06-01", "2026-08-01")).toEqual([]);
  });

  it("merges overlapping ranges before measuring", () => {
    const ranges = [
      r("2026-07-01", "2026-07-05"),
      r("2026-07-03", "2026-07-06"),
      r("2026-07-07", "2026-07-10"),
    ];
    expect(findHardGaps(ranges, "2026-06-01", "2026-08-01")).toEqual([
      { checkIn: "2026-07-06", checkOut: "2026-07-07", nights: 1 },
    ]);
  });

  it("returns nothing with fewer than two ranges", () => {
    expect(findHardGaps([r("2026-07-01", "2026-07-05")], "2026-06-01", "2026-08-01")).toEqual([]);
  });
});
