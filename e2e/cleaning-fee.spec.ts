import { test, expect } from "@playwright/test";

/**
 * Issue #58 — with no cleaning charge configured (the default), the guest sees
 * NO "Limpieza" line anywhere in the price breakdown and no "0 €" placeholder.
 */

function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const OFFSET = 40 + (Math.floor(Date.now() / 1000) % 30);

for (const property of ["javalambre", "valencia"] as const) {
  test(`no cleaning line at checkout for ${property} (default: disabled)`, async ({ page }) => {
    const checkIn = futureDate(OFFSET + (property === "valencia" ? 5 : 0));
    const checkOut = futureDate(OFFSET + (property === "valencia" ? 8 : 3));

    await page.goto(`/reservar/${property}?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
    await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();

    const summary = page.locator("dl").first();
    await expect(summary).toBeVisible();
    await expect(summary).not.toContainText(/Limpieza/i);
    await expect(page.locator("body")).not.toContainText("Limpieza");
  });
}
