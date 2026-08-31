import { expect, it } from "vitest";
import type { Repository } from "./types";
import type { IsoDate } from "@/lib/dates";

/**
 * Issue #83 — repository contract.
 *
 * One behavioural spec that BOTH `memoryRepository` (DEMO) and
 * `supabaseRepository` (production) must satisfy identically. The pure booking
 * rules already live in `src/domains/booking/*` and are unit-tested there; this
 * suite pins the parts that each repository re-implements against its own
 * backend — availability, holds, the hold lifecycle and double-booking.
 *
 * `contract.memory.test.ts` runs it against the in-memory store unconditionally.
 * A Supabase runner can call `runRepositoryContract` too when a throwaway
 * database URL is available (guarded, so CI without a DB just skips it).
 */

const hold = (propertyId: string, checkIn: IsoDate, checkOut: IsoDate, key: string) => ({
  propertyId,
  checkIn,
  checkOut,
  guests: 2,
  totalCents: 20000,
  currency: "EUR" as const,
  priceBreakdown: {},
  holdMinutes: 30,
  idempotencyKey: key,
});

export interface ContractHarness {
  /** A fresh, empty repository (no reservations, no blocks). */
  repo: Repository;
  /** A real property id the repository will accept. */
  propertyId: string;
  /** Force `expireStaleHolds` to see the given hold as already expired. */
  makeHoldStale?: (reservationId: string) => Promise<void> | void;
}

/** Registers the shared `it(...)` cases. Call inside a `describe`. */
export function runRepositoryContract(makeHarness: () => Promise<ContractHarness>) {
  it("half-open availability: 21→24 leaves the 24th bookable", async () => {
    const { repo, propertyId } = await makeHarness();
    await repo.createHold(hold(propertyId, "2026-09-21", "2026-09-24", "k1"));

    expect(await repo.isStayAvailable(propertyId, "2026-09-21", "2026-09-24")).toBe(false);
    expect(await repo.isStayAvailable(propertyId, "2026-09-23", "2026-09-25")).toBe(false);
    // another guest checks in the day the first one leaves
    expect(await repo.isStayAvailable(propertyId, "2026-09-24", "2026-09-27")).toBe(true);
    // and can check out the day the first one arrives
    expect(await repo.isStayAvailable(propertyId, "2026-09-18", "2026-09-21")).toBe(true);
  });

  it("rejects an inverted or empty range", async () => {
    const { repo, propertyId } = await makeHarness();
    expect(await repo.isStayAvailable(propertyId, "2026-09-24", "2026-09-21")).toBe(false);
    expect(await repo.isStayAvailable(propertyId, "2026-09-21", "2026-09-21")).toBe(false);
  });

  it("createHold is idempotent on the idempotency key", async () => {
    const { repo, propertyId } = await makeHarness();
    const a = await repo.createHold(hold(propertyId, "2026-10-01", "2026-10-04", "same"));
    const b = await repo.createHold(hold(propertyId, "2026-10-01", "2026-10-04", "same"));
    expect(b.id).toBe(a.id);
    expect((await repo.listReservations({})).length).toBe(1);
  });

  it("rejects a second hold that overlaps a live one", async () => {
    const { repo, propertyId } = await makeHarness();
    await repo.createHold(hold(propertyId, "2026-10-10", "2026-10-14", "h1"));
    await expect(
      repo.createHold(hold(propertyId, "2026-10-12", "2026-10-16", "h2")),
    ).rejects.toThrow();
    // adjacent is fine
    const adj = await repo.createHold(hold(propertyId, "2026-10-14", "2026-10-17", "h3"));
    expect(adj.status).toBe("pending");
  });

  it("hold → confirm keeps the dates occupied", async () => {
    const { repo, propertyId } = await makeHarness();
    const h = await repo.createHold(hold(propertyId, "2026-11-01", "2026-11-05", "c1"));
    const confirmed = await repo.confirmReservation(h.id, "pi_test_123");
    expect(confirmed.status).toBe("confirmed");
    expect(await repo.isStayAvailable(propertyId, "2026-11-02", "2026-11-04")).toBe(false);
  });

  it("cancel frees the dates", async () => {
    const { repo, propertyId } = await makeHarness();
    const h = await repo.createHold(hold(propertyId, "2026-11-10", "2026-11-14", "x1"));
    await repo.cancelReservation(h.id, "test");
    expect(await repo.isStayAvailable(propertyId, "2026-11-10", "2026-11-14")).toBe(true);
  });

  it("a manual block occupies its range and only its range", async () => {
    const { repo, propertyId } = await makeHarness();
    await repo.createBlock({
      propertyId,
      startDate: "2026-12-20",
      endDate: "2026-12-27",
      source: "manual",
      summary: "owner",
    });
    expect(await repo.isStayAvailable(propertyId, "2026-12-22", "2026-12-24")).toBe(false);
    expect(await repo.isStayAvailable(propertyId, "2026-12-27", "2026-12-30")).toBe(true);
  });

  it("expireStaleHolds releases an elapsed hold and nothing else", async () => {
    const { repo, propertyId, makeHoldStale } = await makeHarness();
    const stale = await repo.createHold(hold(propertyId, "2027-01-05", "2027-01-09", "s1"));
    if (makeHoldStale) await makeHoldStale(stale.id);
    // a hold taken *after* the clock jump is still live
    const fresh = await repo.createHold(hold(propertyId, "2027-02-05", "2027-02-09", "f1"));

    const n = await repo.expireStaleHolds();
    expect(n).toBeGreaterThanOrEqual(makeHoldStale ? 1 : 0);
    if (makeHoldStale) {
      expect(await repo.isStayAvailable(propertyId, "2027-01-05", "2027-01-09")).toBe(true);
    }
    expect((await repo.getReservation(fresh.id))?.status).toBe("pending");
  });
}
