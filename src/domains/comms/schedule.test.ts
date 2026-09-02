import { describe, expect, it } from "vitest";
import { planReservationComms, resolveRules } from "./schedule";
import { DEFAULT_COMM_RULES } from "./types";

const base = {
  status: "confirmed",
  checkIn: "2026-10-10" as const,
  checkOut: "2026-10-14" as const,
  guestEmail: "guest@example.com",
};
const now = new Date("2026-10-01T09:00:00Z");

describe("planReservationComms", () => {
  it("schedules all four messages for a future confirmed stay", () => {
    const plan = planReservationComms(base, DEFAULT_COMM_RULES, now);
    expect(plan.map((m) => m.kind)).toEqual([
      "pre_arrival",
      "checkin_info",
      "checkout_reminder",
      "review_request",
    ]);
    // pre_arrival is 3 days before check-in at 10:00 local
    expect(plan[0]!.sendAt.startsWith("2026-10-07T10:00")).toBe(true);
    // review_request is 1 day after check-out
    expect(plan[3]!.sendAt.startsWith("2026-10-15T11:00")).toBe(true);
  });

  it("plans nothing for a non-confirmed reservation", () => {
    expect(planReservationComms({ ...base, status: "pending" }, DEFAULT_COMM_RULES, now)).toEqual([]);
    expect(planReservationComms({ ...base, status: "cancelled" }, DEFAULT_COMM_RULES, now)).toEqual([]);
  });

  it("plans nothing without a guest email", () => {
    expect(planReservationComms({ ...base, guestEmail: null }, DEFAULT_COMM_RULES, now)).toEqual([]);
  });

  it("drops messages whose send time is already in the past", () => {
    // check-in is tomorrow → pre_arrival (-3d) and checkin_info window gone
    const soon = { ...base, checkIn: "2026-10-02" as const, checkOut: "2026-10-05" as const };
    const plan = planReservationComms(soon, DEFAULT_COMM_RULES, now);
    expect(plan.map((m) => m.kind)).toEqual(["checkout_reminder", "review_request"]);
  });

  it("respects a disabled rule", () => {
    const rules = DEFAULT_COMM_RULES.map((r) =>
      r.kind === "review_request" ? { ...r, enabled: false } : r,
    );
    const plan = planReservationComms(base, rules, now);
    expect(plan.some((m) => m.kind === "review_request")).toBe(false);
  });

  it("re-planning after a date change yields the new times, same kinds", () => {
    const first = planReservationComms(base, DEFAULT_COMM_RULES, now);
    const moved = planReservationComms(
      { ...base, checkIn: "2026-11-10", checkOut: "2026-11-14" },
      DEFAULT_COMM_RULES,
      now,
    );
    expect(moved.map((m) => m.kind)).toEqual(first.map((m) => m.kind));
    expect(moved[0]!.sendAt).not.toEqual(first[0]!.sendAt);
  });
});

describe("resolveRules", () => {
  it("returns defaults when there are no overrides", () => {
    expect(resolveRules(null)).toEqual(DEFAULT_COMM_RULES);
  });

  it("merges a partial override onto the default rule", () => {
    const rules = resolveRules({ pre_arrival: { enabled: false, offsetDays: -5 } });
    const pa = rules.find((r) => r.kind === "pre_arrival")!;
    expect(pa.enabled).toBe(false);
    expect(pa.offsetDays).toBe(-5);
    expect(pa.hour).toBe(10); // untouched
  });
});
