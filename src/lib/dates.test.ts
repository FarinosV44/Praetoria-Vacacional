import { describe, expect, it } from "vitest";
import {
  addDays,
  isIsoDate,
  nightsBetween,
  nightsOf,
  rangesOverlap,
  isWeekendNight,
} from "./dates";

describe("dates", () => {
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-01-15")).toBe(true);
    expect(isIsoDate("2026-1-5")).toBe(false);
    expect(isIsoDate("nope")).toBe(false);
    expect(isIsoDate("2026-13-40")).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts nights for a half-open stay", () => {
    expect(nightsBetween("2026-02-10", "2026-02-13")).toBe(3);
    expect(nightsOf("2026-02-10", "2026-02-13")).toEqual([
      "2026-02-10",
      "2026-02-11",
      "2026-02-12",
    ]);
  });

  it("lets stays share a turnover day without overlapping", () => {
    // A leaves on the 13th, B arrives on the 13th.
    expect(rangesOverlap("2026-02-10", "2026-02-13", "2026-02-13", "2026-02-16")).toBe(false);
  });

  it("detects a one-night overlap", () => {
    expect(rangesOverlap("2026-02-10", "2026-02-13", "2026-02-12", "2026-02-14")).toBe(true);
  });

  it("classifies weekend nights (Fri/Sat)", () => {
    expect(isWeekendNight("2026-02-13")).toBe(true); // Friday
    expect(isWeekendNight("2026-02-14")).toBe(true); // Saturday
    expect(isWeekendNight("2026-02-15")).toBe(false); // Sunday
    expect(isWeekendNight("2026-02-11")).toBe(false); // Wednesday
  });
});
