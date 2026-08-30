import { addDays, type IsoDate } from "@/lib/dates";

/**
 * Pure selection logic for the public availability calendar (issue #59).
 *
 * The booking model is half-open `[check-in, check-out)`: the check-in day
 * occupies a night, the check-out day does NOT. Two stays may therefore share a
 * turnover day — one guest checks out the same day another checks in.
 *
 * The old calendar disabled every `busy` day outright, so a day that is only
 * occupied because *another* reservation checks in then (its previous night
 * free) could not be picked as a check-OUT date. That is the bug this module
 * fixes: the state of the check-out day itself is irrelevant — only the nights
 * strictly between check-in and check-out must be free.
 */

/** Day states as returned by `/api/properties/[property]/calendar` (`buildCalendar`). */
export type PublicDayState = "free" | "busy" | "past" | "checkout-only";

export interface RangeSelection {
  checkIn: IsoDate | null;
  checkOut: IsoDate | null;
}

type StateLookup = (date: IsoDate) => PublicDayState;

/** Are all the nights in `[from, to)` free? (`to` itself is never inspected.) */
export function nightsClear(from: IsoDate, to: IsoDate, stateOf: StateLookup): boolean {
  if (from >= to) return false;
  let cur = from;
  while (cur < to) {
    const s = stateOf(cur);
    if (s === "busy" || s === "past") return false;
    cur = addDays(cur, 1);
  }
  return true;
}

/**
 * Selection phase for the click handler:
 *  - "start"    — no check-in yet, or a full range already picked (a click starts over)
 *  - "checkout" — a check-in is set and we are choosing the check-out day
 */
export function selectionPhase(sel: RangeSelection): "start" | "checkout" {
  return sel.checkIn && !sel.checkOut ? "checkout" : "start";
}

/**
 * Can `date` be clicked right now?
 *
 * - Starting a stay: the night that BEGINS on `date` must be free — so `busy`
 *   and `past` are out, `free` / `checkout-only` are in.
 * - Choosing a check-out: any day strictly after the check-in whose in-between
 *   nights are all free is valid, **even if `date` itself is `busy`** (another
 *   guest may arrive that day). A click on or before the check-in restarts the
 *   selection, so it is allowed whenever that day is valid as a new check-in.
 */
export function isDaySelectable(date: IsoDate, sel: RangeSelection, stateOf: StateLookup): boolean {
  const s = stateOf(date);
  if (s === "past") return false;

  if (selectionPhase(sel) === "start" || !sel.checkIn || date <= sel.checkIn) {
    return s !== "busy";
  }
  return nightsClear(sel.checkIn, date, stateOf);
}

/**
 * Visual role of a day when NO selection is in progress, so the calendar can
 * distinguish the three states issue #59 asks for:
 *  - "open"      — selectable as check-in or check-out
 *  - "exit-only" — occupied by another guest's arrival, but a previous stay may
 *                  still check out here (render as a half / departure marker)
 *  - "blocked"   — fully unavailable (mid-stay night, or in the past)
 */
export function dayRole(date: IsoDate, stateOf: StateLookup): "open" | "exit-only" | "blocked" {
  const s = stateOf(date);
  if (s === "past") return "blocked";
  if (s === "free" || s === "checkout-only") return "open";
  // s === "busy": the night starting today is taken. If the previous night is
  // free, today is purely someone's arrival day → still valid as a check-out.
  const prev = stateOf(addDays(date, -1));
  return prev === "busy" || prev === "past" ? "blocked" : "exit-only";
}

/**
 * Resolve a click into the next selection state (mirrors the old inline `pick`).
 * Returns the new selection, or `null` when the click should be ignored.
 */
export function applyDayClick(
  date: IsoDate,
  sel: RangeSelection,
  stateOf: StateLookup,
): RangeSelection | null {
  if (!isDaySelectable(date, sel, stateOf)) return null;

  if (selectionPhase(sel) === "start" || !sel.checkIn) {
    return { checkIn: date, checkOut: null };
  }
  if (date <= sel.checkIn) {
    return { checkIn: date, checkOut: null };
  }
  if (!nightsClear(sel.checkIn, date, stateOf)) {
    return { checkIn: date, checkOut: null };
  }
  return { checkIn: sel.checkIn, checkOut: date };
}

/** Real nights of a stay — `check-out − check-in`, never a count of free cells. */
export function stayNights(checkIn: IsoDate, checkOut: IsoDate): number {
  return Math.round(
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000,
  );
}
