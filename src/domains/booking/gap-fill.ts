import { addDays, compareIso, type IsoDate } from "@/lib/dates";
import type { BusyRange } from "./types";
import { busyNightSet } from "./availability";

/**
 * "Excepción para huecos entre reservas" (issue #60 §5): when a stay EXACTLY
 * fills the gap between two occupied spans it may be sold even if it is shorter
 * than the normal minimum stay — the nights would otherwise be unsellable.
 *
 * A stay `[checkIn, checkOut)` exactly fills a gap when:
 *   - every night it needs is free, AND
 *   - the night immediately before check-in is occupied (a guest checks out
 *     that morning), AND
 *   - the check-out night is occupied (the next guest checks in that day).
 *
 * Pure — takes the already-fetched busy ranges for one property.
 */
export function fillsGapExactly(
  ranges: BusyRange[],
  checkIn: IsoDate,
  checkOut: IsoDate,
): boolean {
  if (compareIso(checkIn, checkOut) >= 0) return false;
  const busy = busyNightSet(ranges);

  // All requested nights free?
  for (let cur = checkIn; compareIso(cur, checkOut) < 0; cur = addDays(cur, 1)) {
    if (busy.has(cur)) return false;
  }
  // Wedged between two occupied spans, no slack on either side.
  return busy.has(addDays(checkIn, -1)) && busy.has(checkOut);
}
