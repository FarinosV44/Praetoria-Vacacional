import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRateLimitStore,
  denyClient,
  evaluate,
  isDenied,
  rateLimit,
  rateLimitBackend,
  recordBreach,
  windowBucket,
} from "./rate-limit";

beforeEach(() => __resetRateLimitStore());

describe("windowBucket", () => {
  it("aligns to the window and gives the reset time", () => {
    expect(windowBucket(12_345, 1000)).toEqual({ start: 12_000, resetAt: 13_000 });
    expect(windowBucket(60_000, 60_000)).toEqual({ start: 60_000, resetAt: 120_000 });
  });
});

describe("evaluate", () => {
  it("is ok up to and including the limit", () => {
    expect(evaluate(5, 5, 0).ok).toBe(true);
    expect(evaluate(6, 5, 0).ok).toBe(false);
    expect(evaluate(6, 5, 0).remaining).toBe(0);
    expect(evaluate(2, 5, 0).remaining).toBe(3);
  });
});

describe("rateLimit (memory)", () => {
  it("defaults to the in-memory backend", () => {
    expect(rateLimitBackend()).toBe("memory");
  });

  it("counts hits within a window and trips past the limit", async () => {
    const key = `k-${Math.random()}`;
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await rateLimit(key, 3, 60_000));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results[3]!.remaining).toBe(0);
  });

  it("keeps separate keys independent", async () => {
    expect((await rateLimit("a", 1, 60_000)).ok).toBe(true);
    expect((await rateLimit("b", 1, 60_000)).ok).toBe(true);
    expect((await rateLimit("a", 1, 60_000)).ok).toBe(false);
  });
});

describe("denylist", () => {
  it("flags and clears a client", async () => {
    expect(await isDenied("1.2.3.4")).toBe(false);
    await denyClient("1.2.3.4", 50);
    expect(await isDenied("1.2.3.4")).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(await isDenied("1.2.3.4")).toBe(false);
  });
});

describe("recordBreach", () => {
  it("returns true once breaches exceed the cap", async () => {
    const ip = `ip-${Math.random()}`;
    const flags = [];
    for (let i = 0; i < 4; i += 1) flags.push(await recordBreach(ip, 3, 60_000));
    expect(flags).toEqual([false, false, false, true]);
  });
});
