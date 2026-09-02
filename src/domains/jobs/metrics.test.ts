import { describe, expect, it } from "vitest";
import { summarizeJobs } from "./metrics";
import type { Job } from "./types";

const base: Omit<Job, "id" | "status" | "createdAt"> = {
  type: "email.reservation_confirmation",
  payload: {},
  idempotencyKey: null,
  attempts: 0,
  maxAttempts: 5,
  runAfter: "2026-09-01T12:00:00.000Z",
  lockedAt: null,
  lockedBy: null,
  lastError: null,
  result: null,
  updatedAt: "2026-09-01T12:00:00.000Z",
  succeededAt: null,
  deadLetteredAt: null,
};

const job = (id: string, status: Job["status"], createdAt: string): Job => ({
  ...base,
  id,
  status,
  createdAt,
});

const now = new Date("2026-09-01T13:00:00.000Z");

describe("summarizeJobs", () => {
  it("counts by status and derives pending / dead-letter", () => {
    const m = summarizeJobs(
      [
        job("a", "queued", "2026-09-01T12:55:00.000Z"),
        job("b", "retrying", "2026-09-01T12:40:00.000Z"),
        job("c", "succeeded", "2026-09-01T12:00:00.000Z"),
        job("d", "dead_letter", "2026-09-01T12:00:00.000Z"),
        job("e", "cancelled", "2026-09-01T12:00:00.000Z"),
      ],
      now,
    );
    expect(m.total).toBe(5);
    expect(m.pending).toBe(2);
    expect(m.deadLetter).toBe(1);
    expect(m.byStatus.succeeded).toBe(1);
  });

  it("oldestPendingAgeMs ignores finished jobs", () => {
    const m = summarizeJobs(
      [
        job("old-done", "succeeded", "2026-09-01T06:00:00.000Z"),
        job("pending", "queued", "2026-09-01T12:30:00.000Z"),
      ],
      now,
    );
    expect(m.oldestPendingAgeMs).toBe(30 * 60_000);
  });

  it("errorRate is dead_letter over finished jobs", () => {
    const m = summarizeJobs(
      [
        job("s1", "succeeded", "2026-09-01T12:00:00.000Z"),
        job("s2", "succeeded", "2026-09-01T12:00:00.000Z"),
        job("s3", "succeeded", "2026-09-01T12:00:00.000Z"),
        job("d1", "dead_letter", "2026-09-01T12:00:00.000Z"),
      ],
      now,
    );
    expect(m.errorRate).toBeCloseTo(0.25);
  });

  it("needsAttention on a dead letter", () => {
    expect(
      summarizeJobs([job("d", "dead_letter", now.toISOString())], now).needsAttention,
    ).toBe(true);
  });

  it("needsAttention when a job has pended too long", () => {
    const m = summarizeJobs([job("p", "queued", "2026-09-01T12:00:00.000Z")], now, 30 * 60_000);
    expect(m.needsAttention).toBe(true);
  });

  it("empty queue is healthy", () => {
    const m = summarizeJobs([], now);
    expect(m.needsAttention).toBe(false);
    expect(m.errorRate).toBe(0);
    expect(m.oldestPendingAgeMs).toBe(0);
  });
});
