import { describe, expect, it } from "vitest";
import { backoffMs, nextRunAfter, DEFAULT_BACKOFF } from "./backoff";

describe("backoffMs", () => {
  const noJitter = { ...DEFAULT_BACKOFF, jitter: 0 };

  it("grows exponentially from baseMs", () => {
    expect(backoffMs(1, noJitter)).toBe(30_000);
    expect(backoffMs(2, noJitter)).toBe(120_000);
    expect(backoffMs(3, noJitter)).toBe(480_000);
  });

  it("clamps to maxMs", () => {
    expect(backoffMs(20, noJitter)).toBe(noJitter.maxMs);
  });

  it("treats attempts < 1 as 1", () => {
    expect(backoffMs(0, noJitter)).toBe(30_000);
    expect(backoffMs(-5, noJitter)).toBe(30_000);
  });

  it("applies full jitter within [base*(1-j), base]", () => {
    const opts = { ...DEFAULT_BACKOFF, jitter: 1 };
    expect(backoffMs(1, opts, 0)).toBe(0);
    expect(backoffMs(1, opts, 1)).toBe(30_000);
    expect(backoffMs(1, opts, 0.5)).toBe(15_000);
  });

  it("partial jitter keeps a floor", () => {
    const opts = { ...DEFAULT_BACKOFF, jitter: 0.2 };
    // base 30_000 -> floor 24_000, ceiling 30_000
    expect(backoffMs(1, opts, 0)).toBe(24_000);
    expect(backoffMs(1, opts, 1)).toBe(30_000);
  });

  it("never exceeds maxMs even with jitter", () => {
    const opts = { ...DEFAULT_BACKOFF, jitter: 1 };
    expect(backoffMs(50, opts, 1)).toBe(opts.maxMs);
  });
});

describe("nextRunAfter", () => {
  it("adds the backoff to now and returns ISO", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    const iso = nextRunAfter(now, 1, { ...DEFAULT_BACKOFF, jitter: 0 });
    expect(iso).toBe("2026-09-01T12:00:30.000Z");
  });
});
