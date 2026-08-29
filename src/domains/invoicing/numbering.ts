/**
 * Invoice numbering (issue #56 §3). Pure — tested in isolation.
 *
 * Series are per property: `JAV` for Javalambre Mountain SuperSki, `PALM` for
 * Valencia Frente al Mar. Format: `<SERIES>-<YY><NNNN>` (year's last two digits
 * + a 4-digit sequence, zero-padded), e.g. `JAV-260503`, `PALM-260401`.
 *
 * Numbering is NOT rigidly automatic: the admin may type any number. These
 * helpers only *suggest* the next one, flag duplicates and report gaps.
 */

export interface ParsedInvoiceNumber {
  series: string;
  yearCode: string; // "26"
  seq: number; // 503
}

const PATTERN = /^([A-Z]{2,6})-(\d{2})(\d{1,6})$/;

export function parseInvoiceNumber(raw: string): ParsedInvoiceNumber | null {
  const m = raw.trim().toUpperCase().match(PATTERN);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return { series: m[1], yearCode: m[2], seq: Number(m[3]) };
}

export function formatInvoiceNumber(series: string, yearCode: string, seq: number): string {
  return `${series.toUpperCase()}-${yearCode}${String(seq).padStart(4, "0")}`;
}

export function yearCodeOf(date: Date | string): string {
  const y = typeof date === "string" ? Number(date.slice(0, 4)) : date.getFullYear();
  return String(y % 100).padStart(2, "0");
}

/**
 * Suggest the next sequence for a series + year: highest existing seq + 1,
 * or 1 when there are none yet. Only numbers of the SAME series and year count.
 */
export function suggestNextNumber(
  series: string,
  yearCode: string,
  existing: string[],
): string {
  const seqs = existing
    .map(parseInvoiceNumber)
    .filter(
      (p): p is ParsedInvoiceNumber =>
        !!p && p.series === series.toUpperCase() && p.yearCode === yearCode,
    )
    .map((p) => p.seq);
  const next = seqs.length ? Math.max(...seqs) + 1 : 1;
  return formatInvoiceNumber(series, yearCode, next);
}

export function isDuplicateNumber(candidate: string, existing: string[]): boolean {
  const c = candidate.trim().toUpperCase();
  return existing.some((e) => e.trim().toUpperCase() === c);
}

/**
 * Missing sequence numbers within a series + year, between the lowest and the
 * highest present. An empty array means the run is contiguous.
 */
export function detectGaps(series: string, yearCode: string, existing: string[]): number[] {
  const seqs = existing
    .map(parseInvoiceNumber)
    .filter(
      (p): p is ParsedInvoiceNumber =>
        !!p && p.series === series.toUpperCase() && p.yearCode === yearCode,
    )
    .map((p) => p.seq)
    .sort((a, b) => a - b);
  const first = seqs[0];
  const last = seqs[seqs.length - 1];
  if (seqs.length < 2 || first === undefined || last === undefined) return [];
  const gaps: number[] = [];
  for (let n = first + 1; n < last; n++) {
    if (!seqs.includes(n)) gaps.push(n);
  }
  return gaps;
}

export interface NumberingInsight {
  series: string;
  yearCode: string;
  suggestedNext: string;
  gaps: string[]; // formatted missing numbers
  count: number;
}

export function numberingInsight(
  series: string,
  yearCode: string,
  existing: string[],
): NumberingInsight {
  return {
    series: series.toUpperCase(),
    yearCode,
    suggestedNext: suggestNextNumber(series, yearCode, existing),
    gaps: detectGaps(series, yearCode, existing).map((n) => formatInvoiceNumber(series, yearCode, n)),
    count: existing
      .map(parseInvoiceNumber)
      .filter((p) => p && p.series === series.toUpperCase() && p.yearCode === yearCode).length,
  };
}
