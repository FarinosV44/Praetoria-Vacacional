import { test, expect } from "@playwright/test";

/**
 * Discount codes (issue #45). DEMO mode seeds a `DEMO10` = 10% coupon.
 * Verifies the server applies it, rejects an invalid one, and that the
 * discounted total is what carries into the booking.
 */
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test("valid coupon reduces the total server-side; invalid is rejected", async ({ request }) => {
  const body = {
    property: "valencia",
    checkIn: futureDate(50),
    checkOut: futureDate(54),
    guests: 2,
  };

  const plain = await (await request.post("/api/quote", { data: body })).json();
  expect(plain.available).toBe(true);
  const baseTotal = plain.quote.totalCents;

  const withCoupon = await (
    await request.post("/api/quote", { data: { ...body, coupon: "DEMO10" } })
  ).json();
  expect(withCoupon.quote.coupon.applied).toBe(true);
  expect(withCoupon.quote.coupon.discountCents).toBe(Math.round(baseTotal * 0.1));
  expect(withCoupon.quote.totalCents).toBe(baseTotal - withCoupon.quote.coupon.discountCents);

  const bad = await (
    await request.post("/api/quote", { data: { ...body, coupon: "NOPE123" } })
  ).json();
  expect(bad.quote.coupon.applied).toBe(false);
  expect(bad.quote.coupon.message).toBeTruthy();
  expect(bad.quote.totalCents).toBe(baseTotal);
});

test("checkout persists the discounted total for a valid coupon", async ({ request }) => {
  // Far-future window the DEMO seed never touches, plus a random offset, so a
  // persisted .data/demo.json from an earlier run can't collide with this hold.
  const off = 430 + Math.floor(Math.random() * 100);
  const dates = { checkIn: futureDate(off), checkOut: futureDate(off + 4), guests: 2 };

  const quote = await (
    await request.post("/api/quote", { data: { property: "javalambre", ...dates, coupon: "DEMO10" } })
  ).json();
  expect(quote.quote.coupon.applied).toBe(true);

  const start = await request.post("/api/checkout", {
    data: { property: "javalambre", ...dates, coupon: "DEMO10", idempotencyKey: crypto.randomUUID() },
  });
  expect(start.ok()).toBeTruthy();
  const data = await start.json();

  expect(data.totalCents).toBe(quote.quote.totalCents);
  expect(data.totalCents).toBeLessThan(quote.quote.subtotalBeforeCouponCents);
});
