import "server-only";
import { getRepository } from "@/lib/repository";
import { decideNext } from "./policy";
import { HANDLERS, type JobHandler } from "./handlers";
import type { JobOutcome } from "./types";

/**
 * Issue #76 — the worker. `runDueJobs` leases a batch of due jobs, runs each
 * handler idempotently, and persists the outcome (succeeded / retrying with a
 * backoff / dead-letter). It is safe to run concurrently: `claimJobs` leases
 * atomically, so two workers never take the same job.
 *
 * The scheduler (`/api/cron/jobs`) only calls this; it never does work inline.
 */

export interface RunOptions {
  worker?: string;
  batch?: number;
  leaseSeconds?: number;
  /** injectable clock for tests */
  now?: () => Date;
  /** handler registry override (tests) */
  handlers?: Record<string, JobHandler>;
}

export interface RunSummary {
  worker: string;
  claimed: number;
  succeeded: number;
  retrying: number;
  deadLettered: number;
  results: { id: string; type: string; status: string; error?: string }[];
}

export async function runDueJobs(opts: RunOptions = {}): Promise<RunSummary> {
  const worker = opts.worker ?? `w_${Math.random().toString(36).slice(2, 8)}`;
  const batch = opts.batch ?? 10;
  const leaseSeconds = opts.leaseSeconds ?? 120;
  const now = opts.now ?? (() => new Date());
  const handlers = opts.handlers ?? HANDLERS;
  const repo = getRepository();

  const jobs = await repo.claimJobs(worker, batch, leaseSeconds);
  const summary: RunSummary = {
    worker,
    claimed: jobs.length,
    succeeded: 0,
    retrying: 0,
    deadLettered: 0,
    results: [],
  };

  for (const job of jobs) {
    let outcome: JobOutcome;
    const handler = handlers[job.type];
    if (!handler) {
      outcome = { ok: false, error: `sin handler para «${job.type}»`, retryable: false };
    } else {
      try {
        outcome = await handler(job.payload);
      } catch (err) {
        outcome = { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    const settlement = decideNext(job, outcome, now());
    await repo.settleJob(job.id, settlement);

    if (settlement.status === "succeeded") summary.succeeded += 1;
    else if (settlement.status === "retrying") summary.retrying += 1;
    else if (settlement.status === "dead_letter") summary.deadLettered += 1;

    summary.results.push({
      id: job.id,
      type: job.type,
      status: settlement.status,
      error: settlement.lastError ?? undefined,
    });
  }

  return summary;
}
