import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Repository } from "@/lib/repository/types";
import type { JobHandler } from "./handlers";

/**
 * Issue #76 — the durable-job worker, against the in-memory repository.
 *
 * Covers the acceptance criteria that are about the queue mechanics:
 *   - a persisted intention survives and is processed
 *   - two workers running at once never double-process a job
 *   - a failing job retries, then dead-letters, then survives for a manual retry
 */

async function freshRepo(): Promise<{
  repo: Repository;
  runDueJobs: typeof import("./runner").runDueJobs;
}> {
  vi.resetModules();
  delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
  const { memoryRepository } = await import("@/lib/repository/memory");
  const { runDueJobs } = await import("./runner");
  return { repo: memoryRepository as Repository, runDueJobs };
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
});

beforeEach(() => {
  delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
});

describe("runDueJobs", () => {
  it("processes a queued job and marks it succeeded", async () => {
    const { repo, runDueJobs } = await freshRepo();
    let ran = 0;
    const handlers: Record<string, JobHandler> = {
      "test.ok": async () => {
        ran += 1;
        return { ok: true, result: { done: true } };
      },
    };

    const job = await repo.enqueueJob({ type: "test.ok", payload: { x: 1 } });
    const summary = await runDueJobs({ worker: "w1", handlers });

    expect(ran).toBe(1);
    expect(summary.succeeded).toBe(1);
    const after = await repo.getJob(job.id);
    expect(after?.status).toBe("succeeded");
    expect(after?.attempts).toBe(1);
    expect(after?.result).toEqual({ done: true });
  });

  it("de-dupes on the idempotency key — the intention cannot be lost or doubled", async () => {
    const { repo } = await freshRepo();
    const a = await repo.enqueueJob({ type: "test.ok", idempotencyKey: "res-42:confirm" });
    const b = await repo.enqueueJob({ type: "test.ok", idempotencyKey: "res-42:confirm" });
    expect(b.id).toBe(a.id);
    const all = await repo.listJobs({ type: "test.ok" });
    expect(all).toHaveLength(1);
  });

  it("two concurrent workers never process the same job twice", async () => {
    const { repo, runDueJobs } = await freshRepo();
    const runs = new Map<string, number>();
    const handlers: Record<string, JobHandler> = {
      "test.count": async () => {
        // yield so the two runners genuinely interleave
        await new Promise((r) => setTimeout(r, 1));
        return { ok: true };
      },
    };

    const ids: string[] = [];
    for (let i = 0; i < 12; i++) {
      const j = await repo.enqueueJob({ type: "test.count", payload: { i } });
      ids.push(j.id);
    }

    const [s1, s2] = await Promise.all([
      runDueJobs({ worker: "A", batch: 20, handlers }),
      runDueJobs({ worker: "B", batch: 20, handlers }),
    ]);

    expect(s1.claimed + s2.claimed).toBe(12);
    // no overlap in what each worker claimed
    for (const id of ids) {
      const job = await repo.getJob(id);
      expect(job?.status).toBe("succeeded");
      expect(job?.attempts).toBe(1); // processed exactly once
      runs.set(id, (runs.get(id) ?? 0) + 1);
    }
    expect([...runs.values()].every((n) => n === 1)).toBe(true);
  });

  it("a failing job with retries left goes to 'retrying', scheduled in the future", async () => {
    const { repo, runDueJobs } = await freshRepo();
    const handlers: Record<string, JobHandler> = {
      "test.fail": async () => ({ ok: false, error: "boom" }),
    };
    const job = await repo.enqueueJob({ type: "test.fail", maxAttempts: 3 });

    const before = Date.now();
    const s = await runDueJobs({ worker: "w", handlers });
    expect(s.retrying).toBe(1);
    const after = await repo.getJob(job.id);
    expect(after?.status).toBe("retrying");
    expect(after?.attempts).toBe(1);
    expect(after?.lastError).toBe("boom");
    // not due again yet — the backoff pushed run_after out
    expect(Date.parse(after!.runAfter)).toBeGreaterThan(before);
    expect((await runDueJobs({ worker: "w", handlers })).claimed).toBe(0);
  });

  it("a failing job with no retries left dead-letters on the same run", async () => {
    const { repo, runDueJobs } = await freshRepo();
    const handlers: Record<string, JobHandler> = {
      "test.fail": async () => ({ ok: false, error: "boom" }),
    };
    const job = await repo.enqueueJob({ type: "test.fail", maxAttempts: 1 });

    const s = await runDueJobs({ worker: "w", handlers });
    expect(s.deadLettered).toBe(1);
    const after = await repo.getJob(job.id);
    expect(after?.status).toBe("dead_letter");
    expect(after?.attempts).toBe(1);
    expect(after?.deadLetteredAt).toBeTruthy();
  });

  it("an unknown job type goes straight to dead-letter", async () => {
    const { repo, runDueJobs } = await freshRepo();
    const job = await repo.enqueueJob({ type: "test.nohandler" });
    const s = await runDueJobs({ worker: "w", handlers: {} });
    expect(s.deadLettered).toBe(1);
    expect((await repo.getJob(job.id))?.status).toBe("dead_letter");
  });

  it("admin retry sends a dead-lettered job back to the queue", async () => {
    const { repo, runDueJobs } = await freshRepo();
    let fail = true;
    const handlers: Record<string, JobHandler> = {
      "test.flaky": async () => (fail ? { ok: false, error: "temp" } : { ok: true }),
    };
    const job = await repo.enqueueJob({ type: "test.flaky", maxAttempts: 1 });

    await runDueJobs({ worker: "w", handlers });
    expect((await repo.getJob(job.id))?.status).toBe("dead_letter");

    fail = false;
    const requeued = await repo.retryJob(job.id);
    expect(requeued.status).toBe("queued");

    const s = await runDueJobs({ worker: "w", handlers });
    expect(s.succeeded).toBe(1);
    expect((await repo.getJob(job.id))?.status).toBe("succeeded");
  });

  it("recovers a job whose worker died mid-run (lease expired)", async () => {
    const { repo, runDueJobs } = await freshRepo();
    const job = await repo.enqueueJob({ type: "test.orphan" });

    // worker A claims but never settles (simulated crash)
    const claimed = await repo.claimJobs("A", 5, 120);
    expect(claimed.map((j) => j.id)).toContain(job.id);

    // still within the lease → not re-claimable
    let s = await runDueJobs({ worker: "B", leaseSeconds: 120, handlers: { "test.orphan": async () => ({ ok: true }) } });
    expect(s.claimed).toBe(0);

    // lease elapsed → B recovers it
    s = await runDueJobs({
      worker: "B",
      leaseSeconds: 0,
      handlers: { "test.orphan": async () => ({ ok: true }) },
    });
    expect(s.succeeded).toBe(1);
    expect((await repo.getJob(job.id))?.status).toBe("succeeded");
    expect((await repo.getJob(job.id))?.attempts).toBe(2); // A's claim + B's claim
  });
});
