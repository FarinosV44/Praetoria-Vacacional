/**
 * Issue #62 — distributed rate limiting + basic anti-abuse.
 *
 * Fixed-window counters with a pluggable store:
 *   - `memory`  — a `Map`, fine for a single instance (dev, one Hostinger node).
 *   - `redis`   — Upstash Redis REST (works from any serverless region). Enabled
 *                 by `UPSTASH_REDIS_REST_URL` + `_TOKEN` (or the `KV_REST_API_*`
 *                 aliases Vercel injects).
 *
 * The window math is pure and unit-tested. Every Redis call falls back to the
 * in-memory store on error and fails **open** for limiting (an infra hiccup must
 * not lock users out) but fails **safe** for the denylist (unknown → not denied).
 */

import { env } from "./env";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** epoch ms when the current window resets */
  resetAt: number;
  limit: number;
}

// --- pure window math -------------------------------------------------

export function windowBucket(now: number, windowMs: number): { start: number; resetAt: number } {
  const start = Math.floor(now / windowMs) * windowMs;
  return { start, resetAt: start + windowMs };
}

export function evaluate(count: number, limit: number, resetAt: number): RateLimitResult {
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt, limit };
}

// --- stores ---------------------------------------------------------

interface Store {
  readonly kind: "memory" | "redis";
  incr(key: string, windowMs: number, now: number): Promise<number>;
  setFlag(key: string, ttlMs: number): Promise<void>;
  hasFlag(key: string): Promise<boolean>;
}

class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private counters = new Map<string, { count: number; resetAt: number }>();
  private flags = new Map<string, number>();

  async incr(key: string, windowMs: number, now: number): Promise<number> {
    const { start, resetAt } = windowBucket(now, windowMs);
    const bucketKey = `${key}:${start}`;
    const existing = this.counters.get(bucketKey);
    if (!existing || existing.resetAt <= now) {
      this.counters.set(bucketKey, { count: 1, resetAt });
      this.sweep(now);
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }

  async setFlag(key: string, ttlMs: number): Promise<void> {
    this.flags.set(key, Date.now() + ttlMs);
  }

  async hasFlag(key: string): Promise<boolean> {
    const exp = this.flags.get(key);
    if (!exp) return false;
    if (exp <= Date.now()) {
      this.flags.delete(key);
      return false;
    }
    return true;
  }

  private sweep(now: number) {
    if (this.counters.size < 5000) return;
    for (const [k, v] of this.counters) if (v.resetAt <= now) this.counters.delete(k);
  }
}

class RedisStore implements Store {
  readonly kind = "redis" as const;
  private fallback = new MemoryStore();

  constructor(
    private url: string,
    private token: string,
  ) {}

  private async pipeline(commands: (string | number)[][]): Promise<unknown[]> {
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    return (await res.json()) as unknown[];
  }

  async incr(key: string, windowMs: number, now: number): Promise<number> {
    const { start } = windowBucket(now, windowMs);
    const rk = `rl:${key}:${start}`;
    try {
      const out = await this.pipeline([
        ["INCR", rk],
        ["PEXPIRE", rk, windowMs, "NX"],
      ]);
      const first = out[0] as { result?: number } | undefined;
      return typeof first?.result === "number" ? first.result : 1;
    } catch {
      return this.fallback.incr(key, windowMs, now);
    }
  }

  async setFlag(key: string, ttlMs: number): Promise<void> {
    try {
      await this.pipeline([["SET", `f:${key}`, "1", "PX", ttlMs]]);
    } catch {
      await this.fallback.setFlag(key, ttlMs);
    }
  }

  async hasFlag(key: string): Promise<boolean> {
    try {
      const out = await this.pipeline([["GET", `f:${key}`]]);
      const first = out[0] as { result?: unknown } | undefined;
      return first?.result != null;
    } catch {
      // fail safe: an outage must not turn a denied client back on
      return this.fallback.hasFlag(key);
    }
  }
}

let _store: Store | null = null;
function store(): Store {
  if (_store) return _store;
  _store =
    env.rateLimitRedisUrl && env.rateLimitRedisToken
      ? new RedisStore(env.rateLimitRedisUrl, env.rateLimitRedisToken)
      : new MemoryStore();
  return _store;
}

/** Test seam. */
export function __resetRateLimitStore() {
  _store = null;
}

export function rateLimitBackend(): "memory" | "redis" {
  return store().kind;
}

// --- public API ---------------------------------------------------

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const { resetAt } = windowBucket(now, windowMs);
  const count = await store().incr(key, windowMs, now);
  return evaluate(count, limit, resetAt);
}

export async function isDenied(id: string): Promise<boolean> {
  return store().hasFlag(`deny:${id}`);
}

export async function denyClient(id: string, ttlMs: number): Promise<void> {
  await store().setFlag(`deny:${id}`, ttlMs);
}

/** Count over-limit breaches; returns true once the client should be denylisted. */
export async function recordBreach(
  id: string,
  maxBreaches: number,
  windowMs: number,
): Promise<boolean> {
  const res = await rateLimit(`breach:${id}`, maxBreaches, windowMs);
  return !res.ok;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
}
