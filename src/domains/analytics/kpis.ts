import { nightsBetween, type IsoDate } from "@/lib/dates";
import type { Reservation, ReservationSource } from "@/domains/booking/types";

/**
 * Issue #82 — Business Intelligence.
 *
 * Pure period KPIs from the reservations we already store. No new schema: the
 * admin dashboard shows "now"; this is the historical, comparable view
 * (occupancy · ADR · RevPAR · channel mix · lead time · cancellations) that the
 * owner needs to reason about pricing and channels.
 *
 * Bases (stated so the numbers are unambiguous):
 *   · a night is "in the period" when its date is in [from, to);
 *   · a reservation "belongs to the period" when its check-in is in [from, to);
 *   · revenue is the reservation total attributed to its check-in period;
 *   · available nights = nights(period) × number of properties in scope.
 */

const OCCUPYING = new Set<Reservation["status"]>(["confirmed", "pending", "external"]);

export interface KpiInput {
  from: IsoDate;
  /** exclusive */
  to: IsoDate;
  /** how many properties the scope covers (for the availability denominator) */
  propertyCount: number;
  reservations: readonly Pick<
    Reservation,
    "status" | "source" | "checkIn" | "checkOut" | "nights" | "totalCents" | "createdAt"
  >[];
}

export interface ChannelSlice {
  source: ReservationSource;
  nights: number;
  bookings: number;
  revenueCents: number;
  nightsShare: number;
}

export interface PeriodKpis {
  from: IsoDate;
  to: IsoDate;
  availableNights: number;
  nightsSold: number;
  occupancyRate: number; // 0..1
  revenueCents: number;
  adrCents: number; // average daily rate = revenue / nights sold
  revparCents: number; // revenue per available night
  bookings: number;
  avgLeadTimeDays: number | null;
  avgStayNights: number | null;
  cancellationRate: number; // cancelled+expired / all created in period
  directNightsShare: number; // 0..1
  channelMix: ChannelSlice[];
}

/** Nights of [aIn,aOut) that fall inside [from,to). */
function nightsInWindow(aIn: IsoDate, aOut: IsoDate, from: IsoDate, to: IsoDate): number {
  const start = aIn > from ? aIn : from;
  const end = aOut < to ? aOut : to;
  return end > start ? nightsBetween(start, end) : 0;
}

export function computePeriodKpis(input: KpiInput): PeriodKpis {
  const { from, to, propertyCount, reservations } = input;
  const periodNights = Math.max(0, nightsBetween(from, to));
  const availableNights = periodNights * Math.max(0, propertyCount);

  const belongs = reservations.filter(
    (r) => OCCUPYING.has(r.status) && r.checkIn >= from && r.checkIn < to,
  );

  // Occupancy counts every occupied night landing in the window, even from a
  // stay that checked in earlier.
  let nightsSold = 0;
  for (const r of reservations) {
    if (!OCCUPYING.has(r.status)) continue;
    nightsSold += nightsInWindow(r.checkIn, r.checkOut, from, to);
  }

  const revenueCents = belongs.reduce((s, r) => s + r.totalCents, 0);
  const bookings = belongs.length;
  const soldNightsForAdr = belongs.reduce((s, r) => s + r.nights, 0);

  const leadTimes = belongs
    .map((r) => nightsBetween(r.createdAt.slice(0, 10), r.checkIn))
    .filter((d) => Number.isFinite(d) && d >= 0);
  const avgLeadTimeDays =
    leadTimes.length === 0 ? null : leadTimes.reduce((s, d) => s + d, 0) / leadTimes.length;

  const avgStayNights = bookings === 0 ? null : soldNightsForAdr / bookings;

  const createdInPeriod = reservations.filter(
    (r) => r.createdAt.slice(0, 10) >= from && r.createdAt.slice(0, 10) < to,
  );
  const lost = createdInPeriod.filter(
    (r) => r.status === "cancelled" || r.status === "expired",
  ).length;
  const cancellationRate =
    createdInPeriod.length === 0 ? 0 : lost / createdInPeriod.length;

  const bySource = new Map<ReservationSource, ChannelSlice>();
  for (const r of reservations) {
    if (!OCCUPYING.has(r.status)) continue;
    const n = nightsInWindow(r.checkIn, r.checkOut, from, to);
    if (n === 0 && !(r.checkIn >= from && r.checkIn < to)) continue;
    const slice =
      bySource.get(r.source) ??
      ({ source: r.source, nights: 0, bookings: 0, revenueCents: 0, nightsShare: 0 } as ChannelSlice);
    slice.nights += n;
    if (r.checkIn >= from && r.checkIn < to) {
      slice.bookings += 1;
      slice.revenueCents += r.totalCents;
    }
    bySource.set(r.source, slice);
  }
  const channelMix = [...bySource.values()].sort((a, b) => b.nights - a.nights);
  for (const s of channelMix) s.nightsShare = nightsSold === 0 ? 0 : s.nights / nightsSold;

  const directNights = bySource.get("direct")?.nights ?? 0;

  return {
    from,
    to,
    availableNights,
    nightsSold,
    occupancyRate: availableNights === 0 ? 0 : nightsSold / availableNights,
    revenueCents,
    adrCents: soldNightsForAdr === 0 ? 0 : Math.round(revenueCents / soldNightsForAdr),
    revparCents: availableNights === 0 ? 0 : Math.round(revenueCents / availableNights),
    bookings,
    avgLeadTimeDays,
    avgStayNights,
    cancellationRate,
    directNightsShare: nightsSold === 0 ? 0 : directNights / nightsSold,
    channelMix,
  };
}

/** The last `count` calendar months as [from,to) windows, oldest first. */
export function trailingMonths(count: number, today = new Date()): { from: IsoDate; to: IsoDate }[] {
  const out: { from: IsoDate; to: IsoDate }[] = [];
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth(); // 0-based
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(y, m - i, 1));
    const end = new Date(Date.UTC(y, m - i + 1, 1));
    out.push({
      from: start.toISOString().slice(0, 10) as IsoDate,
      to: end.toISOString().slice(0, 10) as IsoDate,
    });
  }
  return out;
}

/** Period-over-period delta as a signed ratio (null when the base is 0). */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}
