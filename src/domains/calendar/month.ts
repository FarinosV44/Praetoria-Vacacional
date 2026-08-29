import { addDays, todayIso, type IsoDate } from "@/lib/dates";
import type { AvailabilityBlock, BlockSource, Reservation, ReservationSource } from "@/domains/booking/types";
import type { DayRate, RateConfig } from "@/domains/pricing/types";
import { nightlyRateCents } from "@/domains/pricing/engine";

export interface CalendarCell {
  date: IsoDate;
  day: number;
  inMonth: boolean;
  past: boolean;
  priceCents: number;
  overridePrice: boolean;
  overrideMinNights: number | null;
  reservation: { code: string; source: ReservationSource; status: string } | null;
  block: { source: BlockSource; summary: string | null } | null;
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function monthNav(year: number, month: number): {
  label: string;
  prevMonth: string;
  nextMonth: string;
} {
  const prev = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return { label: `${MONTHS[month - 1]} ${year}`, prevMonth: prev, nextMonth: next };
}

/** Monday-first index (0..6) for an ISO date. */
function mondayIndex(iso: IsoDate): number {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0=Sun
  return (d + 6) % 7;
}

const covers = (start: IsoDate, end: IsoDate, day: IsoDate) => day >= start && day < end;

export function buildMonthGrid(args: {
  year: number;
  month: number; // 1-12
  config: RateConfig;
  reservations: Reservation[];
  blocks: AvailabilityBlock[];
  dayRates: DayRate[];
  today?: IsoDate;
}): { weeks: CalendarCell[][]; label: string; prevMonth: string; nextMonth: string } {
  const { year, month } = args;
  const today = args.today ?? todayIso();
  const firstOfMonth = `${year}-${String(month).padStart(2, "0")}-01` as IsoDate;
  const gridStart = addDays(firstOfMonth, -mondayIndex(firstOfMonth));
  const rateByDate = new Map(args.dayRates.map((d) => [d.date, d]));
  // Make the engine aware of the per-date overrides for accurate cell prices.
  const config: RateConfig = { ...args.config, dayRates: args.dayRates };

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    const inMonth = date.slice(0, 7) === firstOfMonth.slice(0, 7);
    const override = rateByDate.get(date);
    const reservation =
      args.reservations
        .filter((r) => ["pending", "confirmed", "external"].includes(r.status))
        .find((r) => covers(r.checkIn, r.checkOut, date)) ?? null;
    const block = args.blocks.find((b) => covers(b.startDate, b.endDate, date)) ?? null;
    cells.push({
      date,
      day: Number(date.slice(8, 10)),
      inMonth,
      past: date < today,
      priceCents: nightlyRateCents(config, date),
      overridePrice: override?.nightlyCents != null,
      overrideMinNights: override?.minNights ?? null,
      reservation: reservation
        ? { code: reservation.code, source: reservation.source, status: reservation.status }
        : null,
      block: block ? { source: block.source, summary: block.summary } : null,
    });
  }

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

  const prev = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    weeks,
    label: `${MONTHS[month - 1]} ${year}`,
    prevMonth: prev,
    nextMonth: next,
  };
}

export const CHANNEL_COLOR: Record<string, string> = {
  direct: "#2563eb",
  booking: "#7c3aed",
  airbnb: "#e11d48",
  manual: "#0891b2",
  other: "#64748b",
};
