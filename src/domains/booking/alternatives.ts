import { addDays, compareIso, nightsBetween, parseDay, todayIso, type IsoDate } from "@/lib/dates";
import { isRangeAvailable } from "./availability";
import type { BusyRange } from "./types";

/**
 * "Disponibilidad inteligente" (issue #92) — when a requested range is taken,
 * find REAL nearby availability so the search never dead-ends. Pure: takes the
 * already-fetched busy ranges for one property. Same stay length and guests as
 * the request (the caller checks guests fit); never invents urgency.
 */

export type AlternativeKind = "shift-earlier" | "shift-later" | "weekend";

export interface AlternativeStay {
  checkIn: IsoDate;
  checkOut: IsoDate;
  nights: number;
  kind: AlternativeKind;
  /** Signed days the check-in moved vs the request. */
  shiftDays: number;
}

/** First day a stay may start: max(request-relative earliest, now + leadDays). */
function earliestStart(now: IsoDate, leadDays: number): IsoDate {
  return addDays(now, Math.max(0, leadDays));
}

/**
 * Windows of the SAME length that are free, closest first: −1, +1, −2, +2, …
 * up to `maxShiftDays`. `limit` results max.
 */
export function nearbyAvailableStays(
  ranges: BusyRange[],
  checkIn: IsoDate,
  checkOut: IsoDate,
  opts: { now?: IsoDate; leadDays?: number; maxShiftDays?: number; limit?: number } = {},
): AlternativeStay[] {
  const now = opts.now ?? todayIso();
  const maxShift = opts.maxShiftDays ?? 10;
  const limit = opts.limit ?? 3;
  const floor = earliestStart(now, opts.leadDays ?? 0);
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return [];

  const out: AlternativeStay[] = [];
  const seen = new Set<string>();

  for (let d = 1; d <= maxShift && out.length < limit; d++) {
    for (const sign of [-1, 1] as const) {
      const ci = addDays(checkIn, sign * d);
      if (compareIso(ci, floor) < 0) continue;
      const co = addDays(ci, nights);
      const key = `${ci}|${co}`;
      if (seen.has(key)) continue;
      if (isRangeAvailable(ranges, ci, co)) {
        seen.add(key);
        out.push({
          checkIn: ci,
          checkOut: co,
          nights,
          kind: sign < 0 ? "shift-earlier" : "shift-later",
          shiftDays: sign * d,
        });
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

/** ISO weekday, 1 = Monday … 7 = Sunday. */
function isoWeekday(d: IsoDate): number {
  const wd = parseDay(d).getUTCDay(); // 0 = Sun
  return wd === 0 ? 7 : wd;
}

/**
 * The next few free weekend windows (Fri→Sun, 2 nights). Used to rescue a
 * midweek search that has no availability — a weekend break is the natural
 * fallback for these properties.
 */
export function nextAvailableWeekends(
  ranges: BusyRange[],
  opts: { now?: IsoDate; leadDays?: number; horizonDays?: number; limit?: number } = {},
): AlternativeStay[] {
  const now = opts.now ?? todayIso();
  const horizon = opts.horizonDays ?? 90;
  const limit = opts.limit ?? 2;
  const floor = earliestStart(now, opts.leadDays ?? 0);

  const out: AlternativeStay[] = [];
  for (let i = 0; i <= horizon && out.length < limit; i++) {
    const day = addDays(now, i);
    if (compareIso(day, floor) < 0) continue;
    if (isoWeekday(day) !== 5) continue; // Friday
    const co = addDays(day, 2); // Fri → Sun
    if (isRangeAvailable(ranges, day, co)) {
      out.push({ checkIn: day, checkOut: co, nights: 2, kind: "weekend", shiftDays: 0 });
    }
  }
  return out;
}

/**
 * Everything the UI needs to rescue an unavailable search for ONE property:
 * shifted same-length windows first, then weekend fallbacks (de-duplicated).
 */
export function rescueAlternatives(
  ranges: BusyRange[],
  checkIn: IsoDate,
  checkOut: IsoDate,
  opts: { now?: IsoDate; leadDays?: number; limit?: number } = {},
): AlternativeStay[] {
  const limit = opts.limit ?? 3;
  const nearby = nearbyAvailableStays(ranges, checkIn, checkOut, { ...opts, limit });
  if (nearby.length >= limit) return nearby;

  const have = new Set(nearby.map((a) => `${a.checkIn}|${a.checkOut}`));
  const weekends = nextAvailableWeekends(ranges, { ...opts, limit: limit - nearby.length + 1 }).filter(
    (w) => !have.has(`${w.checkIn}|${w.checkOut}`),
  );
  return [...nearby, ...weekends].slice(0, limit);
}
