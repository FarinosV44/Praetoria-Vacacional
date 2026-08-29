import { describe, expect, it } from "vitest";
import { buildMonthGrid, monthNav } from "./month";
import type { RateConfig } from "@/domains/pricing/types";
import type { AvailabilityBlock, Reservation } from "@/domains/booking/types";

const config: RateConfig = {
  propertySlug: "javalambre",
  currency: "EUR",
  baseNightlyCents: 10000,
  minNights: 2,
  maxNights: 30,
  cleaningFeeCents: 5000,
  includedGuests: 4,
  extraGuestNightlyCents: 1500,
  maxGuests: 8,
  seasons: [],
  discounts: [],
  taxPercent: 0,
  bookingWindowDays: 0,
  leadTimeDays: 0,
};

const reservation = (over: Partial<Reservation>): Reservation =>
  ({
    id: "r", propertyId: "p", code: "PV-1", status: "confirmed", source: "booking",
    checkIn: "2026-07-10", checkOut: "2026-07-14", nights: 4, guests: 2,
    guestName: null, guestEmail: null, guestPhone: null, currency: "EUR", totalCents: 0,
    originalTotalCents: null, discountCents: 0, couponCode: null, priceBreakdown: {},
    termsAcceptedAt: null, holdExpiresAt: null, externalUid: null, idempotencyKey: null,
    notes: null, createdAt: "", updatedAt: "", customerId: null, channelDetail: null,
    guestDocType: null, guestDocNumber: null, guestAddress: null, guestPostalCode: null,
    guestCity: null, guestProvince: null, guestCountry: null, externalLocator: null,
    invoiceNumber: null, paymentMethod: null, paymentState: "pending",
    ...over,
  }) as Reservation;

describe("monthNav", () => {
  it("wraps year boundaries", () => {
    expect(monthNav(2026, 1).prevMonth).toBe("2025-12");
    expect(monthNav(2026, 12).nextMonth).toBe("2027-01");
    expect(monthNav(2026, 7).label).toBe("julio 2026");
  });
});

describe("buildMonthGrid", () => {
  const grid = buildMonthGrid({
    year: 2026,
    month: 7,
    config,
    reservations: [reservation({})],
    blocks: [
      { id: "b", propertyId: "p", startDate: "2026-07-20", endDate: "2026-07-22", source: "manual", externalUid: null, summary: "Cerrado", createdAt: "", updatedAt: "" } as AvailabilityBlock,
    ],
    dayRates: [{ date: "2026-07-15", nightlyCents: 25000 }, { date: "2026-07-16", minNights: 5 }],
    today: "2026-07-01",
  });
  const cells = grid.weeks.flat();
  const cell = (d: string) => cells.find((c) => c.date === d)!;

  it("is 6 weeks of 7 days and starts on a Monday", () => {
    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks[0]).toHaveLength(7);
    expect(new Date(`${grid.weeks[0]![0]!.date}T00:00:00Z`).getUTCDay()).toBe(1);
  });

  it("marks reservation nights with their channel", () => {
    expect(cell("2026-07-10").reservation?.source).toBe("booking");
    expect(cell("2026-07-13").reservation?.source).toBe("booking");
    expect(cell("2026-07-14").reservation).toBeNull(); // checkout day is free
  });

  it("marks manual blocks", () => {
    expect(cell("2026-07-20").block?.source).toBe("manual");
    expect(cell("2026-07-22").block).toBeNull();
  });

  it("reflects per-date price and min-stay overrides", () => {
    expect(cell("2026-07-15").priceCents).toBe(25000);
    expect(cell("2026-07-15").overridePrice).toBe(true);
    expect(cell("2026-07-16").overrideMinNights).toBe(5);
    expect(cell("2026-07-17").priceCents).toBe(10000);
    expect(cell("2026-07-17").overridePrice).toBe(false);
  });

  it("flags past days and out-of-month days", () => {
    expect(cell("2026-07-01").past).toBe(false);
    expect(cells.find((c) => c.date === "2026-06-30")?.inMonth).toBe(false);
  });
});
