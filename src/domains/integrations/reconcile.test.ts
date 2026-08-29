import { describe, expect, it } from "vitest";
import { planExternalReservations } from "./reconcile";

const block = (uid: string, start: string, end: string, summary: string | null = null) => ({
  startDate: start,
  endDate: end,
  externalUid: uid,
  summary,
});
const res = (
  id: string,
  uid: string | null,
  status: "external" | "confirmed" | "cancelled",
  checkIn: string,
  checkOut: string,
) => ({ id, externalUid: uid, status, checkIn, checkOut });

describe("planExternalReservations (issue #56 §8)", () => {
  it("creates an external reservation for each new imported block", () => {
    const plan = planExternalReservations(
      [block("bk-1", "2026-08-01", "2026-08-05", "Reserved"), block("bk-2", "2026-09-10", "2026-09-12")],
      [],
    );
    expect(plan.toCreate.map((c) => c.externalUid)).toEqual(["bk-1", "bk-2"]);
    expect(plan.toCreate[0]?.summary).toBe("Reserved");
    expect(plan.toCancel).toHaveLength(0);
  });

  it("updates an external reservation when the block dates drift", () => {
    const plan = planExternalReservations(
      [block("bk-1", "2026-08-02", "2026-08-06")],
      [res("r1", "bk-1", "external", "2026-08-01", "2026-08-05")],
    );
    expect(plan.toUpdate).toEqual([{ id: "r1", startDate: "2026-08-02", endDate: "2026-08-06" }]);
    expect(plan.toCreate).toHaveLength(0);
  });

  it("cancels an external reservation whose block left the feed", () => {
    const plan = planExternalReservations(
      [block("bk-2", "2026-09-10", "2026-09-12")],
      [
        res("r1", "bk-1", "external", "2026-08-01", "2026-08-05"),
        res("r2", "bk-2", "external", "2026-09-10", "2026-09-12"),
      ],
    );
    expect(plan.toCancel).toEqual([{ id: "r1", externalUid: "bk-1" }]);
  });

  it("never touches a confirmed reservation that shares a uid", () => {
    const plan = planExternalReservations(
      [],
      [res("r1", "bk-1", "confirmed", "2026-08-01", "2026-08-05")],
    );
    expect(plan.toCancel).toHaveLength(0);
    expect(plan.toUpdate).toHaveLength(0);
  });

  it("is idempotent for an unchanged feed", () => {
    const blocks = [block("bk-1", "2026-08-01", "2026-08-05")];
    const reservations = [res("r1", "bk-1", "external", "2026-08-01", "2026-08-05")];
    const plan = planExternalReservations(blocks, reservations);
    expect(plan).toEqual({ toCreate: [], toUpdate: [], toCancel: [] });
  });
});
