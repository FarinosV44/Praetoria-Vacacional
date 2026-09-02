/**
 * Issue #76 — durable jobs + transactional outbox.
 *
 * A job is a persisted intention to do asynchronous work (send an email, pull an
 * iCal feed, expire holds…). It is written in the same logical operation as the
 * business change that needs it, so a crash between "reservation confirmed" and
 * "confirmation email sent" cannot lose the email — a worker picks the job up
 * later. Workers are idempotent and lease jobs, so running two at once never
 * double-processes one job.
 *
 * This file is pure types only (no I/O) so it is safe to import anywhere.
 */

export type JobStatus =
  | "queued" // waiting for a worker, run_after may be in the future
  | "running" // leased by a worker right now
  | "retrying" // failed, will run again after a backoff
  | "succeeded"
  | "dead_letter" // exhausted retries — needs a human
  | "cancelled";

/** The work a job represents. Handlers are registered by this key. */
export type JobType =
  | "email.reservation_confirmation"
  | "email.payment_failed"
  | "email.internal_notice"
  | "ical.import"
  | "holds.expire";

export interface Job {
  id: string;
  type: JobType | string;
  payload: Record<string, unknown>;
  /** De-dupes an intention: a second enqueue with the same key returns the first job. */
  idempotencyKey: string | null;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  /** ISO — a worker will not pick the job up before this instant. */
  runAfter: string;
  lockedAt: string | null;
  lockedBy: string | null;
  lastError: string | null;
  result: unknown | null;
  createdAt: string;
  updatedAt: string;
  succeededAt: string | null;
  deadLetteredAt: string | null;
}

export interface EnqueueJobInput {
  type: JobType | string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string | null;
  maxAttempts?: number;
  /** ISO or ms-from-now delay. Defaults to "run now". */
  runAfter?: string | null;
}

/** What a handler returns. `retryable: false` sends a failure straight to dead-letter. */
export type JobOutcome =
  | { ok: true; result?: unknown }
  | { ok: false; error: string; retryable?: boolean };

/** The state transition `decideNext` computes; the repository applies it verbatim. */
export interface JobSettlement {
  status: JobStatus;
  attempts: number;
  runAfter: string;
  lastError: string | null;
  result: unknown | null;
  succeededAt: string | null;
  deadLetteredAt: string | null;
}

export interface JobFilter {
  status?: JobStatus[];
  type?: string;
  limit?: number;
}

export const ACTIVE_JOB_STATUSES: JobStatus[] = ["queued", "running", "retrying"];
export const TERMINAL_JOB_STATUSES: JobStatus[] = ["succeeded", "dead_letter", "cancelled"];
