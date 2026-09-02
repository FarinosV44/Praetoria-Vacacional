/**
 * Issue #79 — pure retention verdicts. No I/O. The sweep applies them.
 */

import type { Reservation } from "@/domains/booking/types";
import type { ScheduledMessage } from "@/domains/comms/types";
import type { AuditRow } from "@/lib/repository/types";
import { DEFAULT_RETENTION, type RetentionPolicy, type RetentionVerdict } from "./types";

const DAY = 86_400_000;

function daysBetween(a: number, b: number): number {
  return (a - b) / DAY;
}

export function reservationRetention(
  r: Pick<Reservation, "status" | "source" | "createdAt" | "updatedAt" | "checkOut" | "holdExpiresAt">,
  now: Date = new Date(),
  policy: RetentionPolicy = DEFAULT_RETENTION,
): RetentionVerdict {
  const t = now.getTime();

  if (r.status === "pending" || r.status === "expired") {
    const lapsed = r.holdExpiresAt ? Date.parse(r.holdExpiresAt) : Date.parse(r.createdAt);
    if (daysBetween(t, lapsed) >= policy.abandonedHoldDays) {
      return { action: "delete", reason: "reserva abandonada sin pago" };
    }
    return { action: "keep", reason: "reserva reciente sin completar" };
  }

  if (r.status === "cancelled") {
    if (daysBetween(t, Date.parse(r.updatedAt)) >= policy.cancelledReservationDays) {
      return { action: "anonymize", reason: "reserva cancelada antigua" };
    }
    return { action: "keep", reason: "cancelación reciente" };
  }

  // confirmed / external — completed stays
  const checkOut = Date.parse(`${r.checkOut}T00:00:00Z`);
  const yearsSince = daysBetween(t, checkOut) / 365;
  if (checkOut < t && yearsSince >= policy.completedStayContactYears) {
    return { action: "anonymize", reason: "estancia finalizada hace años; datos de contacto ya no necesarios" };
  }
  return { action: "keep", reason: "reserva vigente o dentro del periodo de conservación" };
}

export function scheduledMessageRetention(
  m: Pick<ScheduledMessage, "status" | "updatedAt">,
  now: Date = new Date(),
  policy: RetentionPolicy = DEFAULT_RETENTION,
): RetentionVerdict {
  const finished = m.status === "sent" || m.status === "failed" || m.status === "cancelled" || m.status === "skipped";
  if (finished && daysBetween(now.getTime(), Date.parse(m.updatedAt)) >= policy.scheduledMessageDays) {
    return { action: "delete", reason: "mensaje de ciclo de vida ya procesado" };
  }
  return { action: "keep", reason: "mensaje pendiente o reciente" };
}

export function auditRetention(
  row: Pick<AuditRow, "createdAt">,
  now: Date = new Date(),
  policy: RetentionPolicy = DEFAULT_RETENTION,
): RetentionVerdict {
  if (daysBetween(now.getTime(), Date.parse(row.createdAt)) >= policy.auditLogDays) {
    return { action: "delete", reason: "registro de actividad fuera del periodo de conservación" };
  }
  return { action: "keep", reason: "registro dentro del periodo" };
}
