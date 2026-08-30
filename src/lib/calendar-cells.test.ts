import { describe, expect, it } from "vitest";
import { monthCells, ymd, firstWeekdayIndex, daysInMonth } from "./calendar-cells";

describe("calendar month cells", () => {
  it("June 2026 starts on the 1st (a Monday) — no trailing day from May", () => {
    const cells = monthCells(2026, 6);
    const firstDate = cells.find((c): c is string => c !== null);
    expect(firstDate).toBe("2026-06-01");
    expect(cells.filter((c) => c === null)).toHaveLength(0);
  });

  it("July 2026: the 1st is a Wednesday → 2 leading blanks, first real cell is the 1st", () => {
    const cells = monthCells(2026, 7);
    expect(cells.slice(0, 3)).toEqual([null, null, "2026-07-01"]);
  });

  it("every non-null cell belongs to the requested month (regression: no 31-May in June)", () => {
    for (const [y, m] of [
      [2026, 6],
      [2026, 7],
      [2026, 2],
      [2025, 6],
      [2024, 12],
    ] as const) {
      const prefix = `${y}-${String(m).padStart(2, "0")}`;
      for (const c of monthCells(y, m)) {
        if (c) expect(c.slice(0, 7)).toBe(prefix);
      }
    }
  });

  it("June 2025 (1st is a Sunday) gets 6 leading blanks", () => {
    const cells = monthCells(2025, 6);
    expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, "2025-06-01"]);
  });

  it("handles leap February", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(monthCells(2024, 2).filter(Boolean)).toHaveLength(29);
  });

  it("ymd zero-pads and uses a 1-indexed month", () => {
    expect(ymd(2026, 6, 1)).toBe("2026-06-01");
    expect(ymd(2026, 12, 9)).toBe("2026-12-09");
  });

  it("firstWeekdayIndex is Monday-first (Mon=0 … Sun=6)", () => {
    expect(firstWeekdayIndex(2026, 6)).toBe(0); // Monday
    expect(firstWeekdayIndex(2026, 7)).toBe(2); // Wednesday
    expect(firstWeekdayIndex(2025, 6)).toBe(6); // Sunday
  });
});
