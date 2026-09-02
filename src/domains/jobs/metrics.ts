/**
 * Issue #76 — queue health metrics. Pure.
 *
 * Queue depth, age of the oldest pending job, and error rate — the numbers the
 * admin needs to see that work is flowing and nothing is stuck.
 */

import type { Job, JobStatus } from "./types";

export interface JobMetrics {
  total: number;
  byStatus: Record<JobStatus, number>;
  /** queued + retrying + running */
  pending: number;
  deadLetter: number;
  /** ms since the oldest still-pending job was created; 0 when nothing pends. */
  oldestPendingAgeMs: number;
  /** dead_letter / (succeeded + dead_letter), 0..1; 0 when nothing has finished. */
  errorRate: number;
  /** true when something needs a human: a dead letter, or a job pending > staleMs. */
  needsAttention: boolean;
}

const EMPTY_BY_STATUS: Record<JobStatus, number> = {
  queued: 0,
  running: 0,
  retrying: 0,
  succeeded: 0,
  dead_letter: 0,
  cancelled: 0,
};

export function summarizeJobs(
  jobs: Job[],
  now: Date = new Date(),
  staleMs: number = 30 * 60_000,
): JobMetrics {
  const byStatus: Record<JobStatus, number> = { ...EMPTY_BY_STATUS };
  let oldestPendingAgeMs = 0;

  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    if (job.status === "queued" || job.status === "retrying" || job.status === "running") {
      const age = now.getTime() - Date.parse(job.createdAt);
      if (age > oldestPendingAgeMs) oldestPendingAgeMs = age;
    }
  }

  const pending = byStatus.queued + byStatus.retrying + byStatus.running;
  const deadLetter = byStatus.dead_letter;
  const finished = byStatus.succeeded + byStatus.dead_letter;
  const errorRate = finished > 0 ? deadLetter / finished : 0;

  return {
    total: jobs.length,
    byStatus,
    pending,
    deadLetter,
    oldestPendingAgeMs: Math.max(0, oldestPendingAgeMs),
    errorRate,
    needsAttention: deadLetter > 0 || oldestPendingAgeMs > staleMs,
  };
}
