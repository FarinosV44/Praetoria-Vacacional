import { describe, expect, it } from "vitest";
import { computePeriodKpis, pctChange, trailingMonths } from "./kpis";
import type { Reservation } from "@/domains/booking/types";

type R = Pick<
  Reservation,
  "status" | "source" | "checkIn" | "checkOut" | "nights" | "totalCents" | "createdAt"
>;

const r = (o: Partial<R>): R => ({
  status: "confirmed",
  source: "direct",
  checkIn: "2026-06-05",
  checkOut: "2026-06-08",
  nights: 3,
  totalCents: 30000,
  createdAt: "2026-05-20T10:00:00Z",
  ...o,
});

const JUNE = { from: "2026-06-01", to: "2026-07-01" } as const;

describe("computePeriodKpis (issue #82)", () => {
  it("occupancy, ADR and RevPAR for a single property month", () => {
    const k = computePeriodKpis({
      ...JUNE,
      propertyCount: 1,
      reservations: [r({ checkIn: "2026-06-05", checkOut: "2026-06-08", nights: 3, totalCents: 30000 })],
    });
    expect(k.availableNights).toBe(30);
    expect(k.nightsSold).toBe(3);
    expect(k.occupancyRate).toBeCloseTo(0.1);
    expect(k.adrCents).toBe(10000); // 30000 / 3
    expect(k.revparCents).toBe(1000); // 30000 / 30
    expect(k.bookings).toBe(1);
    expect(k.directNightsShare).toBe(1);
  });

  it("clips a stay that straddles the period boundary", () => {
    const k = computePeriodKpis({
      ...JUNE,
      propertyCount: 1,
      reservations: [r({ checkIn: "2026-06-29", checkOut: "2026-07-04", nights: 5, totalCents: 50000 })],
    });
    expect(k.nightsSold).toBe(2); // 29, 30 June
    // revenue still attributed by check-in (June)
    expect(k.revenueCents).toBe(50000);
  });

  it("ignores cancelled / expired for occupancy but counts them for cancellation rate", () => {
    const k = computePeriodKpis({
      ...JUNE,
      propertyCount: 1,
      reservations: [
        r({ status: "confirmed", createdAt: "2026-06-02T00:00:00Z" }),
        r({ status: "cancelled", createdAt: "2026-06-03T00:00:00Z" }),
        r({ status: "expired", createdAt: "2026-06-04T00:00:00Z" }),
      ],
    });
    expect(k.nightsSold).toBe(3); // only the confirmed one
    expect(k.cancellationRate).toBeCloseTo(2 / 3);
  });

  it("channel mix and direct share across sources", () => {
    const k = computePeriodKpis({
      ...JUNE,
      propertyCount: 2,
      reservations: [
        r({ source: "direct", checkIn: "2026-06-01", checkOut: "2026-06-05", nights: 4 }),
        r({ source: "booking", status: "external", checkIn: "2026-06-10", checkOut: "2026-06-16", nights: 6 }),
      ],
    });
    expect(k.nightsSold).toBe(10);
    expect(k.directNightsShare).toBeCloseTo(0.4);
    expect(k.channelMix[0]?.source).toBe("booking"); // more nights
    expect(k.channelMix.find((c) => c.source === "direct")?.nightsShare).toBeCloseTo(0.4);
  });

  it("average lead time in days", () => {
    const k = computePeriodKpis({
      ...JUNE,
      propertyCount: 1,
      reservations: [
        r({ createdAt: "2026-05-01T00:00:00Z", checkIn: "2026-06-01" }), // 31d
        r({ createdAt: "2026-05-21T00:00:00Z", checkIn: "2026-06-01" }), // 11d
      ],
    });
    expect(k.avgLeadTimeDays).toBeCloseTo(21);
  });

  it("empty period is all zeros, not NaN", () => {
    const k = computePeriodKpis({ ...JUNE, propertyCount: 1, reservations: [] });
    expect(k.occupancyRate).toBe(0);
    expect(k.adrCents).toBe(0);
    expect(k.revparCents).toBe(0);
    expect(k.avgLeadTimeDays).toBeNull();
  });
});

describe("trailingMonths", () => {
  it("returns N windows oldest-first ending with the current month", () => {
    const m = trailingMonths(3, new Date("2026-08-15T00:00:00Z"));
    expect(m).toEqual([
      { from: "2026-06-01", to: "2026-07-01" },
      { from: "2026-07-01", to: "2026-08-01" },
      { from: "2026-08-01", to: "2026-09-01" },
    ]);
  });

  it("crosses a year boundary", () => {
    const m = trailingMonths(2, new Date("2026-01-10T00:00:00Z"));
    expect(m).toEqual([
      { from: "2025-12-01", to: "2026-01-01" },
      { from: "2026-01-01", to: "2026-02-01" },
    ]);
  });
});

describe("pctChange", () => {
  it("signed ratio, null on a zero base", () => {
    expect(pctChange(120, 100)).toBeCloseTo(0.2);
    expect(pctChange(80, 100)).toBeCloseTo(-0.2);
    expect(pctChange(10, 0)).toBeNull();
  });
});
