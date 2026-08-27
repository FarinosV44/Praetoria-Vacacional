import { test, expect } from "@playwright/test";

/**
 * Critical-path E2E for issue #22, run in DEMO mode (no external services).
 * Exercises the same flow for BOTH properties: search → hold → guest → pay
 * (simulated) → confirmation → dates blocked.
 */

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Unique window per run so a re-run never hits dates a previous run booked
// in the persistent DEMO store.
const RUN_OFFSET = 60 + (Math.floor(Date.now() / 1000) % 200);

for (const property of ["javalambre", "valencia"] as const) {
  test(`booking flow completes for ${property}`, async ({ page }) => {
    const propOffset = property === "valencia" ? 6 : 0;
    const checkIn = futureDate(RUN_OFFSET + propOffset);
    const checkOut = futureDate(RUN_OFFSET + propOffset + 4);

    // Start from the checkout entry with explicit dates (deterministic).
    await page.goto(`/reservar/${property}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);

    await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Step 2 — guest details
    await page.getByLabel(/nombre y apellidos/i).fill("Test QA");
    await page.getByLabel(/^email$/i).fill(`qa-${property}@example.com`);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /ir al pago/i }).click();

    // Step 3 — pay
    await page.getByRole("button", { name: /pagar/i }).click();

    // DEMO simulator
    await expect(page.getByRole("heading", { name: /pasarela de pago/i })).toBeVisible();
    await page.getByRole("button", { name: /simular pago correcto/i }).click();

    // Confirmation
    await expect(page.getByRole("heading", { name: /reserva confirmada/i })).toBeVisible();
    const locator = await page.getByText(/PV-[A-Z0-9]{6}/).first().textContent();
    expect(locator).toMatch(/PV-/);

    // Those dates must now be unavailable for a fresh checkout — the entry page
    // shows the "cannot continue" branch instead of the flow.
    await page.goto(`/reservar/${property}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
    await expect(
      page.getByText(/no podemos continuar con estas fechas/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^continuar$/i })).toHaveCount(0);
  });
}

test("occupied dates on one property do not block the other", async ({ page, request }) => {
  const checkIn = futureDate(RUN_OFFSET + 40);
  const checkOut = futureDate(RUN_OFFSET + 44);

  // Occupy Javalambre via the API.
  const start = await request.post("/api/checkout", {
    data: {
      property: "javalambre",
      checkIn,
      checkOut,
      guests: 2,
      idempotencyKey: crypto.randomUUID(),
    },
  });
  expect(start.ok()).toBeTruthy();

  // Valencia must still be bookable for the same dates.
  await page.goto(`/reservar/valencia?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
  await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();
});
