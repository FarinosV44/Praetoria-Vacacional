/**
 * Issue #69 — pure scheduling of guest messages. No I/O.
 *
 * `planReservationComms` turns a reservation + the property's rules into the set
 * of messages that *should* exist. The repository then reconciles: upsert by
 * (reservationId, kind), cancel any `planned` row that is no longer desired.
 * Re-running after a date change re-plans without duplicating; a cancelled
 * reservation plans nothing.
 */

import type { IsoDate } from "@/lib/dates";
import { DEFAULT_COMM_RULES, type CommRule, type DesiredMessage } from "./types";

export interface ReservationForComms {
  status: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guestEmail: string | null;
}

/** Madrid is UTC+1/+2; we approximate with a fixed +02:00 so "9am" lands in the
 *  morning year-round without pulling in a tz database. Off by an hour in winter
 *  — irrelevant for a "send in the morning" reminder. */
function atLocalHour(date: IsoDate, hour: number): string {
  const hh = String(Math.min(Math.max(Math.trunc(hour), 0), 23)).padStart(2, "0");
  return `${date}T${hh}:00:00+02:00`;
}

/** A scheduled message needs some lead time to be worth sending. A last-minute
 *  booking (check-in today or tomorrow) has already missed the pre-arrival
 *  sequence — schedule only what still lies comfortably ahead. */
const MIN_LEAD_MS = 24 * 60 * 60_000;

function shiftDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10) as IsoDate;
}

export function planReservationComms(
  reservation: ReservationForComms,
  rules: CommRule[] = DEFAULT_COMM_RULES,
  now: Date = new Date(),
): DesiredMessage[] {
  // Only a live, confirmed direct stay with a contactable guest gets messages.
  if (reservation.status !== "confirmed") return [];
  if (!reservation.guestEmail) return [];

  const out: DesiredMessage[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const anchor = rule.anchor === "check_in" ? reservation.checkIn : reservation.checkOut;
    const day = shiftDays(anchor, rule.offsetDays);
    const sendAt = atLocalHour(day, rule.hour);
    // Never schedule in the past, and never so close that it fires late or
    // useless. If check-in is tomorrow the pre-arrival window has passed.
    if (Date.parse(sendAt) - now.getTime() < MIN_LEAD_MS) continue;
    out.push({ kind: rule.kind, sendAt });
  }
  return out;
}

/** Merge stored per-property rule overrides onto the defaults. */
export function resolveRules(overrides?: Partial<Record<string, Partial<CommRule>>> | null): CommRule[] {
  if (!overrides) return DEFAULT_COMM_RULES;
  return DEFAULT_COMM_RULES.map((base) => {
    const o = overrides[base.kind];
    return o ? { ...base, ...o, kind: base.kind } : base;
  });
}
