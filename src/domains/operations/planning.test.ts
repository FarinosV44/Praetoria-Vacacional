import { describe, expect, it } from "vitest";
import { compareTasks, planTurnovers, type TurnoverSource } from "./planning";

const now = new Date("2026-09-02T00:00:00Z");

const stay = (o: Partial<TurnoverSource>): TurnoverSource => ({
  id: "r1",
  propertyId: "p1",
  checkIn: "2026-09-10",
  checkOut: "2026-09-14",
  status: "confirmed",
  ...o,
});

describe("planTurnovers", () => {
  it("creates a scheduled turnover for a confirmed upcoming checkout", () => {
    const plan = planTurnovers([stay({})], new Set(), now);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.kind).toBe("turnover");
    expect(plan[0]!.dueDate).toBe("2026-09-14");
    expect(plan[0]!.priority).toBe("normal");
  });

  it("marks a same-day back-to-back turnover urgent", () => {
    const plan = planTurnovers(
      [
        stay({ id: "a", checkOut: "2026-09-14" }),
        stay({ id: "b", checkIn: "2026-09-14", checkOut: "2026-09-18" }),
      ],
      new Set(),
      now,
    );
    const first = plan.find((t) => t.reservationId === "a");
    expect(first?.priority).toBe("urgent");
  });

  it("skips reservations that already have a turnover, non-confirmed, or out of window", () => {
    expect(planTurnovers([stay({})], new Set(["r1"]), now)).toHaveLength(0);
    expect(planTurnovers([stay({ status: "pending" })], new Set(), now)).toHaveLength(0);
    expect(planTurnovers([stay({ checkOut: "2027-06-01" })], new Set(), now)).toHaveLength(0);
    expect(planTurnovers([stay({ checkOut: "2026-08-01" })], new Set(), now)).toHaveLength(0);
  });
});

describe("compareTasks", () => {
  it("puts done/cancelled last, then sorts by due date then priority", () => {
    const tasks = [
      { status: "done", dueDate: "2026-09-01", priority: "urgent" as const },
      { status: "open", dueDate: "2026-09-10", priority: "low" as const },
      { status: "open", dueDate: "2026-09-05", priority: "normal" as const },
      { status: "open", dueDate: "2026-09-05", priority: "urgent" as const },
    ];
    const sorted = [...tasks].sort(compareTasks);
    expect(sorted.map((t) => `${t.dueDate}/${t.priority}/${t.status}`)).toEqual([
      "2026-09-05/urgent/open",
      "2026-09-05/normal/open",
      "2026-09-10/low/open",
      "2026-09-01/urgent/done",
    ]);
  });
});
