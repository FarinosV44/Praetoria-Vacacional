import { addDays, compareIso, nightsBetween, type IsoDate } from "@/lib/dates";
import type { BusyRange } from "@/domains/booking/types";

/**
 * "Huecos difíciles de vender" (issue #60 §2): short openings — 1 or 2 nights by
 * default — trapped between two occupied ranges, which rarely sell at the normal
 * minimum stay. Pure: takes the already-fetched busy ranges for one property.
 */
export interface HardGap {
  checkIn: IsoDate;
  checkOut: IsoDate;
  nights: number;
}

export function findHardGaps(
  ranges: BusyRange[],
  from: IsoDate,
  to: IsoDate,
  maxNights = 2,
): HardGap[] {
  // Merge overlapping/touching busy ranges into a clean occupied timeline.
  const sorted = [...ranges]
    .filter((r) => compareIso(r.end, from) > 0 && compareIso(r.start, to) < 0)
    .sort((a, b) => compareIso(a.start, b.start));
  if (sorted.length < 2) return [];

  const merged: { start: IsoDate; end: IsoDate }[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && compareIso(r.start, last.end) <= 0) {
      if (compareIso(r.end, last.end) > 0) last.end = r.end;
    } else {
      merged.push({ start: r.start, end: r.end });
    }
  }

  const gaps: HardGap[] = [];
  for (let i = 0; i < merged.length - 1; i++) {
    const gapStart = merged[i]!.end; // previous guest checks out
    const gapEnd = merged[i + 1]!.start; // next guest checks in
    if (compareIso(gapStart, gapEnd) >= 0) continue;
    const nights = nightsBetween(gapStart, gapEnd);
    if (nights >= 1 && nights <= maxNights && compareIso(gapStart, addDays(from, -1)) > 0) {
      gaps.push({ checkIn: gapStart, checkOut: gapEnd, nights });
    }
  }
  return gaps;
}
