import "server-only";
import { getRepository } from "@/lib/repository";
import {
  sendReservationConfirmation,
  sendPaymentFailedNotice,
  sendInternalReservationNotice,
} from "@/domains/notifications/email";
import { importAllFeeds, importPropertyFeeds } from "@/domains/integrations/sync";
import type { JobOutcome } from "./types";

/**
 * Issue #76 — job handlers. One idempotent function per job type.
 *
 * A handler must be safe to run more than once (a redelivered job, a retry, two
 * workers): the underlying operations already are — `sendReservationConfirmation`
 * writes to the email log every time but sending the same confirmation twice is
 * acceptable and rare; `importPropertyFeeds` dedupes by uid; `expireStaleHolds`
 * is a no-op once nothing is stale.
 *
 * Return `{ ok: false, retryable: false }` for a permanent failure (e.g. the
 * reservation was deleted) so the job goes straight to dead-letter instead of
 * burning every retry.
 */
export type JobHandler = (payload: Record<string, unknown>) => Promise<JobOutcome>;

function str(payload: Record<string, unknown>, key: string): string | null {
  const v = payload[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

async function emailForReservation(
  reservationId: string | null,
  send: (r: import("@/domains/booking/types").Reservation) => Promise<{ ok: boolean; error?: string }>,
): Promise<JobOutcome> {
  if (!reservationId) return { ok: false, error: "falta reservationId", retryable: false };
  const reservation = await getRepository().getReservation(reservationId);
  if (!reservation) return { ok: false, error: `reserva ${reservationId} no encontrada`, retryable: false };
  const res = await send(reservation);
  return res.ok ? { ok: true } : { ok: false, error: res.error ?? "envío fallido" };
}

export const HANDLERS: Record<string, JobHandler> = {
  "email.reservation_confirmation": (p) =>
    emailForReservation(str(p, "reservationId"), sendReservationConfirmation),

  "email.payment_failed": (p) =>
    emailForReservation(str(p, "reservationId"), sendPaymentFailedNotice),

  "email.internal_notice": (p) =>
    emailForReservation(str(p, "reservationId"), sendInternalReservationNotice),

  "ical.import": async (p) => {
    const slug = str(p, "slug");
    const reports = slug ? await importPropertyFeeds(slug) : await importAllFeeds();
    const errored = reports.filter((r) => r.status === "error");
    if (reports.length > 0 && errored.length === reports.length) {
      return { ok: false, error: errored.map((r) => `${r.property}/${r.channel}: ${r.error}`).join("; ") };
    }
    return { ok: true, result: { reports } };
  },

  "holds.expire": async () => {
    const released = await getRepository().expireStaleHolds();
    return { ok: true, result: { released } };
  },
};

export function hasHandler(type: string): boolean {
  return type in HANDLERS;
}
