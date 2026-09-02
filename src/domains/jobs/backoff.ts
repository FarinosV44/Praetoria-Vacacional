/**
 * Issue #76 — retry backoff. Pure.
 *
 * Exponential backoff with a cap and optional full jitter. Attempt numbers are
 * 1-based (the delay before retry #1 uses `attempt = 1`).
 */

export interface BackoffOptions {
  /** Delay before the first retry, in ms. */
  baseMs: number;
  /** Multiplier per attempt. */
  factor: number;
  /** Upper bound on the delay, in ms. */
  maxMs: number;
  /** 0 = deterministic; 1 = full jitter in [0, delay]. */
  jitter: number;
}

export const DEFAULT_BACKOFF: BackoffOptions = {
  baseMs: 30_000, // 30s
  factor: 4,
  maxMs: 6 * 60 * 60_000, // 6h
  jitter: 0.2,
};

/**
 * Deterministic part of the delay for `attempt` (1-based), clamped to `maxMs`.
 * `rand` (default 0) applies jitter: the returned delay is
 * `base * (1 - jitter) + base * jitter * rand`, still clamped to `[0, maxMs]`.
 */
export function backoffMs(
  attempt: number,
  opts: BackoffOptions = DEFAULT_BACKOFF,
  rand = 0,
): number {
  const n = Math.max(1, Math.floor(attempt));
  const raw = opts.baseMs * Math.pow(opts.factor, n - 1);
  const capped = Math.min(raw, opts.maxMs);
  const j = Math.min(Math.max(opts.jitter, 0), 1);
  const r = Math.min(Math.max(rand, 0), 1);
  const delayed = capped * (1 - j) + capped * j * r;
  return Math.round(Math.min(Math.max(delayed, 0), opts.maxMs));
}

/** ISO timestamp `backoffMs(attempt)` from `now`. */
export function nextRunAfter(
  now: Date,
  attempt: number,
  opts: BackoffOptions = DEFAULT_BACKOFF,
  rand = 0,
): string {
  return new Date(now.getTime() + backoffMs(attempt, opts, rand)).toISOString();
}
