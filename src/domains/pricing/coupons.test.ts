import { describe, expect, it } from "vitest";
import {
  checkCoupon,
  normalizeCode,
  PRAETORIA10_CODE,
  PRAETORIA10_COUPON,
  type Coupon,
  type CouponContext,
} from "./coupons";

const base: Coupon = {
  id: "c1",
  code: "VERANO25",
  kind: "percent",
  value: 15,
  propertySlug: null,
  startsOn: null,
  endsOn: null,
  minNights: 0,
  minTotalCents: 0,
  maxUses: null,
  usesCount: 0,
  maxUsesPerEmail: null,
  autoApply: false,
  active: true,
  description: null,
};

const ctx: CouponContext = {
  propertySlug: "valencia",
  nights: 4,
  baseTotalCents: 40000,
  now: "2026-07-15",
};

describe("checkCoupon", () => {
  it("applies a percentage discount", () => {
    const r = checkCoupon(base, ctx);
    expect(r.ok).toBe(true);
    expect(r.discountCents).toBe(6000);
    expect(r.label).toContain("VERANO25");
  });

  it("applies a fixed discount, capped at the total", () => {
    expect(checkCoupon({ ...base, kind: "fixed", value: 5000 }, ctx).discountCents).toBe(5000);
    expect(checkCoupon({ ...base, kind: "fixed", value: 999999 }, ctx).discountCents).toBe(40000);
  });

  it("rejects an inactive / expired / not-started code", () => {
    expect(checkCoupon({ ...base, active: false }, ctx).rejection).toBe("inactive");
    expect(checkCoupon({ ...base, endsOn: "2026-07-01" }, ctx).rejection).toBe("expired");
    expect(checkCoupon({ ...base, startsOn: "2026-08-01" }, ctx).rejection).toBe("not_started");
  });

  it("respects property scope", () => {
    expect(checkCoupon({ ...base, propertySlug: "javalambre" }, ctx).rejection).toBe("wrong_property");
    expect(checkCoupon({ ...base, propertySlug: "valencia" }, ctx).ok).toBe(true);
  });

  it("respects min nights, min total and total-use limit", () => {
    expect(checkCoupon({ ...base, minNights: 7 }, ctx).rejection).toBe("min_nights");
    expect(checkCoupon({ ...base, minTotalCents: 50000 }, ctx).rejection).toBe("min_total");
    expect(checkCoupon({ ...base, maxUses: 3, usesCount: 3 }, ctx).rejection).toBe("exhausted");
  });

  it("respects a per-email limit when the count is known", () => {
    const c = { ...base, maxUsesPerEmail: 1 };
    expect(checkCoupon(c, { ...ctx, emailUses: 1 }).rejection).toBe("per_email_limit");
    expect(checkCoupon(c, { ...ctx, emailUses: 0 }).ok).toBe(true);
  });

  it("never returns a negative or oversized discount", () => {
    const r = checkCoupon({ ...base, kind: "percent", value: 100 }, ctx);
    expect(r.discountCents).toBe(40000);
  });
});

describe("10PRAETORIA10 (issue #54)", () => {
  const coupon: Coupon = { ...PRAETORIA10_COUPON, id: "praetoria10" };

  it("applies exactly 10% on both properties", () => {
    for (const propertySlug of ["javalambre", "valencia"]) {
      const r = checkCoupon(coupon, { ...ctx, propertySlug, baseTotalCents: 50000 });
      expect(r.ok).toBe(true);
      expect(r.discountCents).toBe(5000); // 500 € → -50 €
      expect(r.label).toContain(PRAETORIA10_CODE);
    }
  });

  it("has no expiry, no usage limit and is active", () => {
    expect(coupon.active).toBe(true);
    expect(coupon.endsOn).toBeNull();
    expect(coupon.startsOn).toBeNull();
    expect(coupon.maxUses).toBeNull();
    expect(coupon.maxUsesPerEmail).toBeNull();
    expect(checkCoupon(coupon, { ...ctx, now: "2030-01-01" }).ok).toBe(true);
  });

  it("normalizes user input to the stored code", () => {
    expect(normalizeCode(" 10praetoria10 ")).toBe(PRAETORIA10_CODE);
  });

  it("a code that isn't found gets no discount", () => {
    // an unknown / mistyped code: the repository lookup returns null
    const r = checkCoupon(null, ctx);
    expect(r.ok).toBe(false);
    expect(r.discountCents).toBe(0);
  });

  it("the discount is a function of the server total only — no client-supplied amount", () => {
    // CouponContext carries only server-computed figures (baseTotalCents); the
    // percentage comes from the stored coupon, never from the request.
    const r = checkCoupon(coupon, { ...ctx, baseTotalCents: 12345 });
    expect(r.discountCents).toBe(Math.round(12345 * 0.1));
  });
});

describe("normalizeCode", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizeCode("  verano 25 ")).toBe("VERANO25");
  });
});
