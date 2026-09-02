import { describe, expect, it } from "vitest";
import { decideNext, decideOrphan } from "./policy";
import { DEFAULT_BACKOFF } from "./backoff";

const now = new Date("2026-09-01T12:00:00.000Z");
const noJitter = { ...DEFAULT_BACKOFF, jitter: 0 };

describe("decideNext", () => {
  it("success → succeeded with a result and timestamp", () => {
    const s = decideNext({ attempts: 1, maxAttempts: 5 }, { ok: true, result: { released: 2 } }, now);
    expect(s.status).toBe("succeeded");
    expect(s.succeededAt).toBe(now.toISOString());
    expect(s.result).toEqual({ released: 2 });
    expect(s.lastError).toBeNull();
  });

  it("retryable failure with retries left → retrying, scheduled by backoff", () => {
    const s = decideNext(
      { attempts: 1, maxAttempts: 5 },
      { ok: false, error: "Resend 503" },
      now,
      noJitter,
    );
    expect(s.status).toBe("retrying");
    expect(s.lastError).toBe("Resend 503");
    // backoff for the delay before attempt 2 uses attempt=1 → 30s
    expect(s.runAfter).toBe("2026-09-01T12:00:30.000Z");
    expect(s.deadLetteredAt).toBeNull();
  });

  it("retryable failure with no retries left → dead_letter", () => {
    const s = decideNext({ attempts: 5, maxAttempts: 5 }, { ok: false, error: "still down" }, now);
    expect(s.status).toBe("dead_letter");
    expect(s.deadLetteredAt).toBe(now.toISOString());
    expect(s.lastError).toBe("still down");
  });

  it("non-retryable failure → dead_letter immediately, even with retries left", () => {
    const s = decideNext(
      { attempts: 1, maxAttempts: 5 },
      { ok: false, error: "reserva no encontrada", retryable: false },
      now,
    );
    expect(s.status).toBe("dead_letter");
  });

  it("clips a very long error message", () => {
    const s = decideNext(
      { attempts: 5, maxAttempts: 5 },
      { ok: false, error: "x".repeat(5000) },
      now,
    );
    expect(s.lastError!.length).toBeLessThanOrEqual(2001);
    expect(s.lastError!.endsWith("…")).toBe(true);
  });
});

describe("decideOrphan", () => {
  it("treats a lost lease as a retryable failure", () => {
    const s = decideOrphan({ attempts: 2, maxAttempts: 5 }, now, noJitter);
    expect(s.status).toBe("retrying");
    expect(s.lastError).toContain("lease");
  });

  it("dead-letters an orphan with no retries left", () => {
    const s = decideOrphan({ attempts: 5, maxAttempts: 5 }, now);
    expect(s.status).toBe("dead_letter");
  });
});
