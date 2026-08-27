import {
  addDays,
  compareIso,
  nightsOf,
  rangesOverlap,
  todayIso,
  type IsoDate,
} from "@/lib/dates";
import type { BusyRange, CalendarDay, DayState } from "./types";

/**
 * Pure availability logic (issue #7). No I/O — takes the already-fetched busy
 * ranges for ONE property and answers questions about them. Occupancy for a
 * property is the union of its occupying reservations and its availability
 * blocks; ranges for other properties are irrelevant here (independence).
 */

/** Every night occupied by any busy range, as a Set for O(1) lookup. */
export function busyNightSet(ranges: BusyRange[]): Set<IsoDate> {
  const set = new Set<IsoDate>();
  for (const r of ranges) for (const night of nightsOf(r.start, r.end)) set.add(night);
  return set;
}

/** Is [checkIn, checkOut) entirely free? Shares turnover days by design. */
export function isRangeAvailable(
  ranges: BusyRange[],
  checkIn: IsoDate,
  checkOut: IsoDate,
): boolean {
  if (compareIso(checkIn, checkOut) >= 0) return false;
  return !ranges.some((r) => rangesOverlap(checkIn, checkOut, r.start, r.end));
}

/** First night in the requested range that is already taken, or null. */
export function firstConflictNight(
  ranges: BusyRange[],
  checkIn: IsoDate,
  checkOut: IsoDate,
): IsoDate | null {
  const busy = busyNightSet(ranges);
  for (const night of nightsOf(checkIn, checkOut)) if (busy.has(night)) return night;
  return null;
}

/**
 * Per-day calendar states for [from, to). A day is:
 *  - "past"          before today
 *  - "busy"          the night starting that day is occupied
 *  - "checkout-only" the night is free but the previous night was busy — you can
 *                    only check OUT that day, not start a stay (rendered as a
 *                    half-cell). Kept simple: still selectable as check-out.
 *  - "free"          otherwise
 */
export function buildCalendar(
  ranges: BusyRange[],
  from: IsoDate,
  to: IsoDate,
  now: IsoDate = todayIso(),
): CalendarDay[] {
  const busy = busyNightSet(ranges);
  const days: CalendarDay[] = [];
  let cursor = from;
  while (compareIso(cursor, to) < 0) {
    let state: DayState;
    if (compareIso(cursor, now) < 0) {
      state = "past";
    } else if (busy.has(cursor)) {
      state = "busy";
    } else if (busy.has(addDays(cursor, -1))) {
      state = "checkout-only";
    } else {
      state = "free";
    }
    days.push({ date: cursor, state });
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** Next N available check-in dates for a minimum stay, scanning forward. */
export function nextAvailableStays(
  ranges: BusyRange[],
  minNights: number,
  count: number,
  now: IsoDate = todayIso(),
  horizonDays = 365,
): { checkIn: IsoDate; checkOut: IsoDate }[] {
  const out: { checkIn: IsoDate; checkOut: IsoDate }[] = [];
  for (let i = 1; i <= horizonDays && out.length < count; i++) {
    const checkIn = addDays(now, i);
    const checkOut = addDays(checkIn, minNights);
    if (isRangeAvailable(ranges, checkIn, checkOut)) out.push({ checkIn, checkOut });
  }
  return out;
}
