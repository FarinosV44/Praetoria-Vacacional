/**
 * Month-grid cell dates for a Monday-first calendar, built purely from strings /
 * UTC so they never shift by a day in a positive-UTC-offset timezone.
 *
 * The bug this fixes: `new Date(year, month, day).toISOString()` builds the date
 * at LOCAL midnight and then formats it in UTC, so in Spain (UTC+1/+2) day 1 of
 * a month came out as the last day of the previous month — the June grid started
 * with "31 May", July with "30 June", etc.
 */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `year-month-day` with a 1-indexed month, zero-padded, no timezone involved. */
export function ymd(year: number, month1: number, day: number): string {
  return `${year}-${pad2(month1)}-${pad2(day)}`;
}

/** Monday-first weekday index (0..6) for the 1st of the given month. */
export function firstWeekdayIndex(year: number, month1: number): number {
  const dow = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay(); // 0=Sun
  return (dow + 6) % 7;
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/**
 * Cells for one month: leading `null`s to line the 1st up under its weekday,
 * then one `YYYY-MM-DD` string per day of the month. Every non-null cell is
 * guaranteed to be inside `year-month1`.
 */
export function monthCells(year: number, month1: number): (string | null)[] {
  const lead = firstWeekdayIndex(year, month1);
  const total = daysInMonth(year, month1);
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= total; d++) cells.push(ymd(year, month1, d));
  return cells;
}
