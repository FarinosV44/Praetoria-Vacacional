/**
 * Date helpers for the booking engine.
 *
 * Convention: a stay is [checkIn, checkOut) — half-open. The guest occupies the
 * nights checkIn, checkIn+1, …, checkOut-1. Two stays for the same property may
 * share the turnover day (one checks out, another checks in) without overlapping.
 * All dates are handled as plain calendar days in ISO `YYYY-MM-DD`, timezone-free.
 */

export type IsoDate = string; // "YYYY-MM-DD"

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/** Parse an ISO day to a UTC-midnight Date. Throws on malformed input. */
export function parseDay(iso: IsoDate): Date {
  if (!isIsoDate(iso)) throw new Error(`Invalid ISO date: ${iso}`);
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = parseDay(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function todayIso(): IsoDate {
  return toIso(new Date());
}

/** Nights between check-in and check-out (half-open range length). */
export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  const ms = parseDay(checkOut).getTime() - parseDay(checkIn).getTime();
  return Math.round(ms / 86_400_000);
}

/** Every occupied night of a stay: checkIn .. checkOut-1 inclusive. */
export function nightsOf(checkIn: IsoDate, checkOut: IsoDate): IsoDate[] {
  const n = nightsBetween(checkIn, checkOut);
  const out: IsoDate[] = [];
  for (let i = 0; i < n; i++) out.push(addDays(checkIn, i));
  return out;
}

/**
 * Do two half-open stays overlap on at least one night?
 * [aIn, aOut) and [bIn, bOut) overlap iff aIn < bOut && bIn < aOut.
 */
export function rangesOverlap(
  aIn: IsoDate,
  aOut: IsoDate,
  bIn: IsoDate,
  bOut: IsoDate,
): boolean {
  return aIn < bOut && bIn < aOut;
}

export function isWeekendNight(iso: IsoDate): boolean {
  // The night belongs to its start day. Fri (5) and Sat (6) are weekend nights.
  const dow = parseDay(iso).getUTCDay();
  return dow === 5 || dow === 6;
}

export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Clamp helper for calendar windows. */
export function maxIso(a: IsoDate, b: IsoDate): IsoDate {
  return a >= b ? a : b;
}
export function minIso(a: IsoDate, b: IsoDate): IsoDate {
  return a <= b ? a : b;
}
