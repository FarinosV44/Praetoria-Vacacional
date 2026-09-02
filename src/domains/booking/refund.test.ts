import { describe, expect, it } from "vitest";
import { computeRefund, daysUntilCheckIn } from "./refund";

const policy = {
  tiers: [
    { daysBefore: 30, refundPercent: 100 },
    { daysBefore: 7, refundPercent: 50 },
    { daysBefore: 0, refundPercent: 0 },
  ],
};

describe("daysUntilCheckIn", () => {
  it("floors to whole days and never goes negative", () => {
    expect(daysUntilCheckIn("2026-10-10", new Date("2026-10-01T09:00:00Z"))).toBe(8);
    expect(daysUntilCheckIn("2026-10-10", new Date("2026-10-12T00:00:00Z"))).toBe(0);
  });
});

describe("computeRefund", () => {
  const total = 60000;

  it("full refund 30+ days out", () => {
    const r = computeRefund(policy, "2026-12-01", total, new Date("2026-10-15T00:00:00Z"));
    expect(r.refundPercent).toBe(100);
    expect(r.refundCents).toBe(60000);
  });

  it("half refund inside 7–29 days", () => {
    const r = computeRefund(policy, "2026-10-25", total, new Date("2026-10-15T00:00:00Z"));
    expect(r.refundPercent).toBe(50);
    expect(r.refundCents).toBe(30000);
  });

  it("no refund inside 7 days", () => {
    const r = computeRefund(policy, "2026-10-20", total, new Date("2026-10-15T00:00:00Z"));
    expect(r.refundPercent).toBe(0);
    expect(r.refundCents).toBe(0);
  });

  it("no refund after check-in", () => {
    const r = computeRefund(policy, "2026-10-10", total, new Date("2026-10-15T00:00:00Z"));
    expect(r.daysBefore).toBe(0);
    expect(r.refundPercent).toBe(0);
  });

  it("exact tier boundary is inclusive", () => {
    const r = computeRefund(policy, "2026-11-14", total, new Date("2026-10-15T00:00:00Z"));
    expect(r.daysBefore).toBe(30);
    expect(r.refundPercent).toBe(100);
  });
});
