import "server-only";
import { getRepository } from "@/lib/repository";
import { runDueJobs } from "./runner";
import type { EnqueueJobInput, Job, JobType } from "./types";

/**
 * Issue #76 — the transactional-outbox entry point.
 *
 * Business code that needs async work calls `enqueueJob` right after (and as
 * part of) the change that needs it. The intention is now persisted; if the
 * process dies before the work runs, a worker finishes it later.
 *
 * `enqueueJob` never throws in a way that should roll back the business change:
 * losing an email is bad, but un-confirming a paid reservation is worse. Callers
 * that must not fail should wrap it — see `enqueueBestEffort`.
 */
export async function enqueueJob(input: EnqueueJobInput): Promise<Job> {
  return getRepository().enqueueJob(input);
}

/** Enqueue without letting a queue failure bubble into the caller. */
export async function enqueueBestEffort(input: EnqueueJobInput): Promise<Job | null> {
  try {
    return await enqueueJob(input);
  } catch (err) {
    console.error(`enqueueJob(${input.type}) failed`, err);
    return null;
  }
}

/** Deterministic idempotency key: one job of a kind per subject. */
export function jobKey(type: string, subject: string): string {
  return `${type}:${subject}`;
}

/** Queue the confirmation + internal-notice emails for a freshly confirmed reservation. */
export async function enqueueReservationEmails(reservationId: string): Promise<void> {
  await enqueueBestEffort({
    type: "email.reservation_confirmation" satisfies JobType,
    payload: { reservationId },
    idempotencyKey: jobKey("email.reservation_confirmation", reservationId),
    maxAttempts: 6,
  });
  await enqueueBestEffort({
    type: "email.internal_notice" satisfies JobType,
    payload: { reservationId },
    idempotencyKey: jobKey("email.internal_notice", reservationId),
    maxAttempts: 4,
  });
}

export async function enqueuePaymentFailedEmail(reservationId: string): Promise<void> {
  await enqueueBestEffort({
    type: "email.payment_failed" satisfies JobType,
    payload: { reservationId },
    idempotencyKey: jobKey("email.payment_failed", reservationId),
    maxAttempts: 4,
  });
}

/**
 * Opportunistically drain the queue from inside a request (e.g. right after
 * confirming a reservation) so the guest gets their email without waiting for
 * the next cron tick. Never throws; the durable job is the real guarantee.
 */
export async function drainJobsSafely(batch = 5): Promise<void> {
  try {
    await runDueJobs({ worker: "inline", batch, leaseSeconds: 60 });
  } catch (err) {
    console.error("inline job drain failed (queue worker will retry)", err);
  }
}
