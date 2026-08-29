import { describe, expect, it } from "vitest";
import { describeCriteria, evaluateSegment, matchSegment } from "./segments";
import type { CustomerProfile } from "@/domains/crm/types";

const profile = (over: Partial<CustomerProfile>): CustomerProfile =>
  ({
    id: "c",
    firstName: "A",
    lastName: "B",
    email: "a@b.com",
    phone: null,
    whatsapp: null,
    docType: null,
    docNumber: null,
    address: null,
    postalCode: null,
    city: null,
    province: null,
    country: "España",
    language: "es",
    channelOrigin: "direct",
    marketingConsent: true,
    marketingConsentAt: null,
    marketingConsentSource: null,
    notes: null,
    mergedInto: null,
    createdAt: "",
    updatedAt: "",
    fullName: "A B",
    reservationCount: 1,
    confirmedCount: 1,
    totalSpentCents: 40000,
    propertiesVisited: ["jav"],
    lastPropertyId: "jav",
    lastStay: "2026-02-10",
    firstStay: "2026-02-10",
    couponsUsed: [],
    channels: ["direct"],
    ...over,
  }) as CustomerProfile;

describe("matchSegment", () => {
  it("empty criteria matches everyone (except merged records)", () => {
    expect(matchSegment({}, profile({}))).toBe(true);
    expect(matchSegment({}, profile({ mergedInto: "x" }))).toBe(false);
  });

  it("property + repeater + spend criteria are AND-ed", () => {
    const p = profile({ propertiesVisited: ["jav", "vlc"], confirmedCount: 3, totalSpentCents: 90000 });
    expect(matchSegment({ properties: ["vlc"], repeatersOnly: true, minTotalSpentCents: 80000 }, p)).toBe(
      true,
    );
    expect(matchSegment({ properties: ["vlc"], minTotalSpentCents: 100000 }, p)).toBe(false);
    expect(matchSegment({ properties: ["other"] }, p)).toBe(false);
  });

  it("origin national vs foreign", () => {
    expect(matchSegment({ origin: "national" }, profile({ country: "España" }))).toBe(true);
    expect(matchSegment({ origin: "national" }, profile({ country: "France" }))).toBe(false);
    expect(matchSegment({ origin: "foreign" }, profile({ country: "France" }))).toBe(true);
    expect(matchSegment({ origin: "foreign" }, profile({ country: null }))).toBe(false);
  });

  it("win-back: last stay before a date", () => {
    expect(
      matchSegment({ lastStayBefore: "2026-06-01" }, profile({ lastStay: "2026-02-10" })),
    ).toBe(true);
    expect(
      matchSegment({ lastStayBefore: "2026-06-01" }, profile({ lastStay: "2026-08-01" })),
    ).toBe(false);
    expect(matchSegment({ lastStayBefore: "2026-06-01" }, profile({ lastStay: null }))).toBe(false);
  });

  it("consent + coupon filters", () => {
    expect(matchSegment({ consentOnly: true }, profile({ marketingConsent: false }))).toBe(false);
    expect(matchSegment({ couponUsed: true }, profile({ couponsUsed: [] }))).toBe(false);
    expect(matchSegment({ couponUsed: true }, profile({ couponsUsed: ["X"] }))).toBe(true);
  });

  it("channel matches origin or any reservation channel", () => {
    const p = profile({ channelOrigin: "direct", channels: ["direct", "booking"] });
    expect(matchSegment({ channels: ["booking"] }, p)).toBe(true);
    expect(matchSegment({ channels: ["airbnb"] }, p)).toBe(false);
  });
});

describe("evaluateSegment", () => {
  it("filters a list", () => {
    const all = [
      profile({ id: "1", confirmedCount: 3 }),
      profile({ id: "2", confirmedCount: 1 }),
      profile({ id: "3", confirmedCount: 4, mergedInto: "1" }),
    ];
    expect(evaluateSegment({ repeatersOnly: true }, all).map((p) => p.id)).toEqual(["1"]);
  });
});

describe("describeCriteria", () => {
  it("summarises to human phrases", () => {
    expect(describeCriteria({})).toEqual(["todos los clientes"]);
    expect(describeCriteria({ repeatersOnly: true, consentOnly: true })).toEqual([
      "repetidores",
      "con consentimiento",
    ]);
  });
});
