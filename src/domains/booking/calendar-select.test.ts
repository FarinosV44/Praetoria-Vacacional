import { describe, expect, it } from "vitest";
import {
  applyDayClick,
  dayRole,
  isDaySelectable,
  nightsClear,
  stayNights,
  type PublicDayState,
  type RangeSelection,
} from "./calendar-select";
import { buildCalendar } from "./availability";
import type { BusyRange } from "./types";

/**
 * Issue #59 — the calendar must let a stay check OUT on a day another guest
 * checks IN. Scenario: reservation B occupies 24→27 Sep; a new stay 21→24 must
 * be selectable even though the 24th shows as `busy`.
 */

function lookupFrom(ranges: BusyRange[], from: string, to: string) {
  const cal = buildCalendar(ranges, from, to, from);
  const map = new Map(cal.map((d) => [d.date, d.state]));
  return (d: string): PublicDayState => map.get(d) ?? (d < from ? "past" : "free");
}

const B: BusyRange[] = [{ start: "2026-09-24", end: "2026-09-27", kind: "reservation" }];
const stateOf = lookupFrom(B, "2026-09-01", "2026-10-15");
const NONE: RangeSelection = { checkIn: null, checkOut: null };

describe("issue #59 — check-out on an occupied arrival day", () => {
  it("the 24th is `busy` in the raw calendar", () => {
    expect(stateOf("2026-09-24")).toBe("busy");
  });

  it("the 24th is NOT selectable as a check-in", () => {
    expect(isDaySelectable("2026-09-24", NONE, stateOf)).toBe(false);
  });

  it("the 24th IS selectable as a check-out once the 21st is the check-in", () => {
    const sel: RangeSelection = { checkIn: "2026-09-21", checkOut: null };
    expect(isDaySelectable("2026-09-24", sel, stateOf)).toBe(true);
  });

  it("clicking the 24th completes the 21→24 range", () => {
    const sel: RangeSelection = { checkIn: "2026-09-21", checkOut: null };
    expect(applyDayClick("2026-09-24", sel, stateOf)).toEqual({
      checkIn: "2026-09-21",
      checkOut: "2026-09-24",
    });
  });

  it("renders the 24th as a departure-only day", () => {
    expect(dayRole("2026-09-24", stateOf)).toBe("exit-only");
  });
});

describe("issue #59 — mandatory overlap cases", () => {
  // 1. Existing 24→27. New 21→24 → allowed.
  it("case 1: 21→24 against an existing 24→27 is allowed", () => {
    const sel: RangeSelection = { checkIn: "2026-09-21", checkOut: null };
    expect(applyDayClick("2026-09-24", sel, stateOf)).toEqual({
      checkIn: "2026-09-21",
      checkOut: "2026-09-24",
    });
  });

  // 2. Existing 24→27. New 21→25 → not allowed (night 24 is taken).
  it("case 2: 21→25 straddles the booked night 24", () => {
    const sel: RangeSelection = { checkIn: "2026-09-21", checkOut: null };
    expect(isDaySelectable("2026-09-25", sel, stateOf)).toBe(false);
    // 25 is itself a booked night → the click is ignored, selection unchanged.
    expect(applyDayClick("2026-09-25", sel, stateOf)).toBeNull();
    // The first free check-out after the 21st is the 24th (another guest's arrival).
    expect(applyDayClick("2026-09-24", sel, stateOf)).toEqual({
      checkIn: "2026-09-21",
      checkOut: "2026-09-24",
    });
  });

  // 3. Existing 21→24. New 24→27 → allowed.
  it("case 3: 24→27 after an existing 21→24", () => {
    const s = lookupFrom([{ start: "2026-09-21", end: "2026-09-24", kind: "reservation" }], "2026-09-01", "2026-10-15");
    expect(isDaySelectable("2026-09-24", NONE, s)).toBe(true); // arrival on a turnover day
    const sel: RangeSelection = { checkIn: "2026-09-24", checkOut: null };
    expect(applyDayClick("2026-09-27", sel, s)).toEqual({
      checkIn: "2026-09-24",
      checkOut: "2026-09-27",
    });
  });

  // 4. Existing 21→24. New 23→26 → not allowed (night 23 taken).
  it("case 4: 23→26 against an existing 21→24 is rejected", () => {
    const s = lookupFrom([{ start: "2026-09-21", end: "2026-09-24", kind: "reservation" }], "2026-09-01", "2026-10-15");
    const sel: RangeSelection = { checkIn: "2026-09-23", checkOut: null };
    // 23 itself cannot even be a check-in (its night is busy)
    expect(isDaySelectable("2026-09-23", NONE, s)).toBe(false);
    expect(nightsClear("2026-09-23", "2026-09-26", s)).toBe(false);
    expect(isDaySelectable("2026-09-26", sel, s)).toBe(false);
  });
});

describe("issue #59 — minimum stay counted by real nights", () => {
  it("case 5: 21→24 is 3 nights", () => {
    expect(stayNights("2026-09-21", "2026-09-24")).toBe(3);
  });
  it("case 6: 21→23 is 2 nights (below a 3-night minimum)", () => {
    expect(stayNights("2026-09-21", "2026-09-23")).toBe(2);
  });
  it("counts nights, not free calendar cells around a booked block", () => {
    // A gap 21..24 next to a booked 24→27 is still exactly 3 nights.
    expect(stayNights("2026-09-21", "2026-09-24")).toBe(3);
  });
});

describe("issue #59 — manual block turnover (case 7)", () => {
  it("a manual block 24→25 still lets a prior stay check out on the 24th", () => {
    const s = lookupFrom([{ start: "2026-09-24", end: "2026-09-25", kind: "block" }], "2026-09-01", "2026-10-15");
    const sel: RangeSelection = { checkIn: "2026-09-21", checkOut: null };
    expect(applyDayClick("2026-09-24", sel, s)).toEqual({
      checkIn: "2026-09-21",
      checkOut: "2026-09-24",
    });
  });
});

describe("dayRole", () => {
  it("marks a mid-stay night as blocked", () => {
    expect(dayRole("2026-09-25", stateOf)).toBe("blocked");
  });
  it("marks a free day as open", () => {
    expect(dayRole("2026-09-10", stateOf)).toBe("open");
  });
});
