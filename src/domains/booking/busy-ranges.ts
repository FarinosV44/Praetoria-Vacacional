import { compareIso, type IsoDate } from "@/lib/dates";
import type { BusyRange, ReservationStatus } from "./types";

/**
 * Which reservation statuses actually occupy availability.
 *
 * This mirrors, and is the single source of truth for, the filter in the
 * Postgres function `public.property_busy_ranges` and the
 * `reservations_no_overlap` exclusion constraint:
 *   - `pending` + `confirmed` occupy;
 *   - `external` does NOT — a Booking/Airbnb reservation row is an informational
 *     record and its dates are already held by its imported iCal block;
 *   - `cancelled` + `expired` never occupy.
 */
export const OCCUPYING_STATUSES: readonly ReservationStatus[] = ["pending", "confirmed"];

export function statusOccupies(status: string): boolean {
  return (OCCUPYING_STATUSES as readonly string[]).includes(status);
}

interface ReservationRow {
  status: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
}
interface BlockRow {
  startDate: IsoDate;
  endDate: IsoDate;
}

/**
 * Consolidate every busy source for ONE property into half-open `[start, end)`
 * ranges — the exact contract of `public.property_busy_ranges`:
 *
 *   - occupying reservations (`pending` | `confirmed`) → `[check_in, check_out)`
 *   - every availability block (manual closures + imported iCal/Booking/Airbnb
 *     events, any `source`)                            → `[start_date, end_date)`
 *
 * `end` is EXCLUSIVE: a stay 2026-09-21 → 2026-09-24 occupies the nights of the
 * 21st, 22nd and 23rd only, so a different guest can check in on the 24th. The
 * two ranges are never merged or double-counted here; the pure consumers
 * (`busyNightSet`, `buildCalendar`, `isRangeAvailable`) already de-duplicate by
 * night and clip to their own window.
 */
export function consolidateBusyRanges(
  reservations: readonly ReservationRow[],
  blocks: readonly BlockRow[],
): BusyRange[] {
  const out: BusyRange[] = [];

  for (const r of reservations) {
    if (!statusOccupies(r.status)) continue;
    if (compareIso(r.checkIn, r.checkOut) >= 0) continue; // guard: never a zero/negative range
    out.push({ start: r.checkIn, end: r.checkOut, kind: "reservation" });
  }

  for (const b of blocks) {
    if (compareIso(b.startDate, b.endDate) >= 0) continue;
    out.push({ start: b.startDate, end: b.endDate, kind: "block" });
  }

  return out;
}
