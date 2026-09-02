/**
 * Issue #76 — job state machine. Pure.
 *
 * Given a job and the outcome of running it, decide the next persisted state.
 * The repository applies the returned `JobSettlement` verbatim; no I/O here.
 */

import { nextRunAfter, type BackoffOptions, DEFAULT_BACKOFF } from "./backoff";
import type { Job, JobOutcome, JobSettlement } from "./types";

const MAX_ERROR_LEN = 2000;

function clip(s: string): string {
  return s.length > MAX_ERROR_LEN ? s.slice(0, MAX_ERROR_LEN) + "…" : s;
}

/**
 * `job.attempts` is the count INCLUDING the run that just produced `outcome`
 * (the worker increments it when it leases the job). So "retries left" is
 * `maxAttempts - attempts`.
 */
export function decideNext(
  job: Pick<Job, "attempts" | "maxAttempts">,
  outcome: JobOutcome,
  now: Date,
  opts: BackoffOptions = DEFAULT_BACKOFF,
  rand = 0,
): JobSettlement {
  const nowIso = now.toISOString();
  const base: JobSettlement = {
    status: "queued",
    attempts: job.attempts,
    runAfter: nowIso,
    lastError: null,
    result: null,
    succeededAt: null,
    deadLetteredAt: null,
  };

  if (outcome.ok) {
    return { ...base, status: "succeeded", succeededAt: nowIso, result: outcome.result ?? null };
  }

  const err = clip(outcome.error || "error desconocido");
  const retryable = outcome.retryable !== false;
  const retriesLeft = job.maxAttempts - job.attempts;

  if (retryable && retriesLeft > 0) {
    return {
      ...base,
      status: "retrying",
      lastError: err,
      // the delay before attempt (attempts + 1)
      runAfter: nextRunAfter(now, job.attempts, opts, rand),
    };
  }

  return { ...base, status: "dead_letter", lastError: err, deadLetteredAt: nowIso };
}

/** A leased job whose lease elapsed without a settlement — treat as a crash mid-run. */
export function decideOrphan(
  job: Pick<Job, "attempts" | "maxAttempts">,
  now: Date,
  opts: BackoffOptions = DEFAULT_BACKOFF,
): JobSettlement {
  return decideNext(job, { ok: false, error: "worker perdió el lease (posible caída)" }, now, opts);
}
