import { describe, expect, it } from "vitest";
import { buildCustomerProfile } from "./profile";
import type { Customer } from "./types";
import type { Reservation } from "@/domains/booking/types";

const customer: Customer = {
  id: "c1",
  firstName: "Ana",
  lastName: "López",
  email: "ana@example.com",
  phone: null,
  whatsapp: null,
  docType: null,
  docNumber: null,
  address: null,
  postalCode: null,
  city: null,
  province: null,
  country: null,
  language: null,
  channelOrigin: "direct",
  marketingConsent: false,
  marketingConsentAt: null,
  marketingConsentSource: null,
  notes: null,
  mergedInto: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const res = (over: Partial<Reservation>): Reservation =>
  ({
    id: "r",
    propertyId: "jav",
    code: "PV-1",
    status: "confirmed",
    source: "direct",
    checkIn: "2026-02-01",
    checkOut: "2026-02-05",
    nights: 4,
    guests: 2,
    guestName: "Ana López",
    guestEmail: "ana@example.com",
    guestPhone: null,
    currency: "EUR",
    totalCents: 40000,
    originalTotalCents: null,
    discountCents: 0,
    couponCode: null,
    priceBreakdown: {},
    termsAcceptedAt: null,
    holdExpiresAt: null,
    externalUid: null,
    idempotencyKey: null,
    notes: null,
    createdAt: "",
    updatedAt: "",
    customerId: "c1",
    channelDetail: null,
    guestDocType: null,
    guestDocNumber: null,
    guestAddress: null,
    guestPostalCode: null,
    guestCity: null,
    guestProvince: null,
    guestCountry: null,
    externalLocator: null,
    invoiceNumber: null,
    paymentMethod: null,
    paymentState: "paid",
    ...over,
  }) as Reservation;

describe("buildCustomerProfile", () => {
  it("aggregates only confirmed reservations for spend + properties", () => {
    const profile = buildCustomerProfile(customer, [
      res({ id: "r1", propertyId: "jav", totalCents: 40000, checkIn: "2026-02-01" }),
      res({ id: "r2", propertyId: "vlc", totalCents: 30000, checkIn: "2026-07-10" }),
      res({ id: "r3", propertyId: "jav", totalCents: 99999, status: "cancelled", checkIn: "2026-09-01" }),
      res({ id: "rX", customerId: "other", totalCents: 12345 }),
    ]);
    expect(profile.reservationCount).toBe(3);
    expect(profile.confirmedCount).toBe(2);
    expect(profile.totalSpentCents).toBe(70000);
    expect(profile.propertiesVisited.sort()).toEqual(["jav", "vlc"]);
    expect(profile.lastStay).toBe("2026-07-10");
    expect(profile.firstStay).toBe("2026-02-01");
    expect(profile.lastPropertyId).toBe("vlc");
  });

  it("collects coupons and channels across all linked reservations", () => {
    const profile = buildCustomerProfile(customer, [
      res({ id: "r1", couponCode: "10PRAETORIA10", source: "direct" }),
      res({ id: "r2", couponCode: null, source: "booking", status: "pending" }),
    ]);
    expect(profile.couponsUsed).toEqual(["10PRAETORIA10"]);
    expect(profile.channels.sort()).toEqual(["booking", "direct"]);
  });
});
