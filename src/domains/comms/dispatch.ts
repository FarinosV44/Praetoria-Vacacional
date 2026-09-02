import "server-only";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/domains/notifications/email";
import { planReservationComms, resolveRules } from "./schedule";
import { renderMessage, inferLocale } from "./templates";
import type { CommKind, ScheduledMessage } from "./types";

/**
 * Issue #69 — planning + dispatch of scheduled guest messages.
 *
 * `syncReservationComms` (re)computes the plan for one reservation. Call it on
 * confirmation and after any date change; call `cancelReservationMessages` on
 * cancellation. `dispatchDueMessages` is the worker — `/api/cron/comms` runs it.
 */

const MAX_ATTEMPTS = 4;
const RETRY_BACKOFF_MS = 30 * 60_000; // 30 min between attempts

interface CommSettings {
  rules?: Record<string, { enabled?: boolean; offsetDays?: number; hour?: number }>;
  checkinEs?: string | null;
  checkinEn?: string | null;
  checkoutEs?: string | null;
  checkoutEn?: string | null;
}

async function commSettings(propertyId: string): Promise<CommSettings> {
  const row = await getRepository()
    .getContentOverride(`comms:settings:${propertyId}`)
    .catch(() => null);
  return (row?.value as CommSettings) ?? {};
}

export async function syncReservationComms(reservationId: string): Promise<void> {
  const repo = getRepository();
  const reservation = await repo.getReservation(reservationId);
  if (!reservation) return;

  if (reservation.status !== "confirmed") {
    await repo.cancelReservationMessages(reservationId);
    return;
  }
  const settings = await commSettings(reservation.propertyId);
  const rules = resolveRules(settings.rules);
  const desired = planReservationComms(
    {
      status: reservation.status,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      guestEmail: reservation.guestEmail,
    },
    rules,
  );
  await repo.syncReservationMessages(reservationId, desired);
}

export interface DispatchSummary {
  due: number;
  sent: number;
  skipped: number;
  failed: number;
  retried: number;
}

export async function dispatchDueMessages(limit = 25): Promise<DispatchSummary> {
  const repo = getRepository();
  const now = new Date();
  const due = await repo.dueScheduledMessages(now.toISOString(), limit);
  const summary: DispatchSummary = { due: due.length, sent: 0, skipped: 0, failed: 0, retried: 0 };

  for (const msg of due) {
    const outcome = await dispatchOne(msg, now);
    summary[outcome] += 1;
  }
  return summary;
}

/** Send one message. Returns the summary bucket it fell into. */
async function dispatchOne(
  msg: ScheduledMessage,
  now: Date,
): Promise<"sent" | "skipped" | "failed" | "retried"> {
  const repo = getRepository();
  const reservation = await repo.getReservation(msg.reservationId);

  if (!reservation || reservation.status !== "confirmed") {
    await repo.markScheduledMessage(msg.id, { status: "cancelled" });
    return "skipped";
  }
  if (!reservation.guestEmail) {
    await repo.markScheduledMessage(msg.id, {
      status: "skipped",
      lastError: "reserva sin email de contacto",
    });
    return "skipped";
  }

  const property = getPropertyById(reservation.propertyId);
  const settings = await commSettings(reservation.propertyId);
  const locale = inferLocale(reservation.guestCountry);
  const propertyUrl = property
    ? `${publicEnv.siteUrl.replace(/\/$/, "")}${locale === "en" ? "/en" : ""}/${property.slug}`
    : null;

  const rendered = renderMessage(msg.kind as CommKind, {
    code: reservation.code,
    propertyId: reservation.propertyId,
    guestName: reservation.guestName,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    checkinNote: locale === "en" ? settings.checkinEn : settings.checkinEs,
    checkoutNote: locale === "en" ? settings.checkoutEn : settings.checkoutEs,
    propertyUrl,
  }, locale);

  const attempts = msg.attempts + 1;
  const res = await sendEmail(reservation.guestEmail, rendered.subject, rendered.html, rendered.text, {
    kind: msg.kind,
    reservationId: reservation.id,
  });

  if (res.ok) {
    await repo.markScheduledMessage(msg.id, {
      status: "sent",
      attempts,
      sentAt: now.toISOString(),
      providerId: res.id ?? null,
      lastError: null,
    });
    return "sent";
  }

  if (attempts >= MAX_ATTEMPTS) {
    await repo.markScheduledMessage(msg.id, {
      status: "failed",
      attempts,
      lastError: res.error ?? "envío fallido",
    });
    return "failed";
  }
  // stay 'planned' but push send_at out so a later cron tick retries it
  await repo.markScheduledMessage(msg.id, {
    status: "planned",
    attempts,
    sendAt: new Date(now.getTime() + RETRY_BACKOFF_MS).toISOString(),
    lastError: res.error ?? "envío fallido",
  });
  return "retried";
}
