/**
 * Issue #70 — pure turnover planning. For each confirmed reservation checking
 * out within the window and without a turnover task yet, produce the task to
 * create. Same-day back-to-back stays get an `urgent` turnover.
 */

import type { Reservation } from "@/domains/booking/types";
import type { OpsTaskInput } from "./types";

export interface TurnoverSource {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: Reservation["status"];
}

export function planTurnovers(
  reservations: TurnoverSource[],
  existingTurnoverReservationIds: Set<string>,
  now: Date = new Date(),
  windowDays = 45,
): OpsTaskInput[] {
  const today = now.toISOString().slice(0, 10);
  const horizon = new Date(now.getTime() + windowDays * 86_400_000).toISOString().slice(0, 10);

  // A stay that starts the same day another ends → the turnover is time-critical.
  const arrivalsByPropertyDate = new Set(
    reservations
      .filter((r) => r.status === "confirmed" || r.status === "pending")
      .map((r) => `${r.propertyId}|${r.checkIn}`),
  );

  const out: OpsTaskInput[] = [];
  for (const r of reservations) {
    if (r.status !== "confirmed") continue;
    if (existingTurnoverReservationIds.has(r.id)) continue;
    if (r.checkOut < today || r.checkOut > horizon) continue;

    const sameDayArrival = arrivalsByPropertyDate.has(`${r.propertyId}|${r.checkOut}`);
    out.push({
      propertyId: r.propertyId,
      kind: "turnover",
      title: `Cambio de huésped · salida ${r.checkOut}`,
      description: sameDayArrival
        ? "Entra otro huésped el mismo día: limpieza y preparación con prioridad."
        : "Limpieza y preparación tras la salida.",
      status: "scheduled",
      priority: sameDayArrival ? "urgent" : "normal",
      dueDate: r.checkOut,
      reservationId: r.id,
    });
  }
  return out;
}

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 } as const;

/** Board sort: open first, then by due date, then priority. */
export function compareTasks(
  a: { status: string; dueDate: string | null; priority: keyof typeof PRIORITY_ORDER },
  b: { status: string; dueDate: string | null; priority: keyof typeof PRIORITY_ORDER },
): number {
  const done = (s: string) => (s === "done" || s === "cancelled" ? 1 : 0);
  if (done(a.status) !== done(b.status)) return done(a.status) - done(b.status);
  if (a.dueDate !== b.dueDate) return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}
