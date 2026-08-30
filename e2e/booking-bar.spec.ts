import { test, expect } from "@playwright/test";

/**
 * Issue #89 — a persistent booking bar on every commercial page: one tap to a
 * sheet with property / dates / guests, keeps the selection across navigation,
 * hidden on admin and checkout.
 */

function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

test("mobile: the bottom bar opens a sheet and books from a content page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guias/valencia-playa");
  await page.waitForLoadState("load");

  await page.getByRole("button", { name: /ver fechas/i }).click();
  const sheet = page.getByRole("dialog", { name: /consulta disponibilidad/i });
  await expect(sheet).toBeVisible();

  await sheet.getByLabel(/alojamiento/i).selectOption("valencia");
  await sheet.getByLabel(/entrada/i).fill(futureDate(200));
  await sheet.getByLabel(/salida/i).fill(futureDate(203));
  await sheet.getByRole("button", { name: /ver precio/i }).click();

  const book = sheet.getByRole("button", { name: /reservar/i });
  await expect(book).toBeVisible({ timeout: 10_000 });
  await book.click();
  await expect(page).toHaveURL(/\/reservar\/valencia/);
});

test("the bar keeps the selection across navigation and is hidden on checkout/admin", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guias/valencia-playa");
  await page.waitForLoadState("load");

  await page.getByRole("button", { name: /ver fechas/i }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel(/entrada/i).fill(futureDate(210));
  await sheet.getByLabel(/salida/i).fill(futureDate(213));
  await sheet.getByRole("button", { name: /ver precio/i }).click();
  await sheet.getByRole("button", { name: /cerrar/i }).click();

  // Navigate to another commercial page — the bar shows the kept date range.
  await page.goto("/blog");
  await page.waitForLoadState("load");
  await expect(page.locator(".fixed.inset-x-0.bottom-0").getByRole("button")).toContainText(
    futureDate(210).slice(8),
  );

  // Hidden on checkout and admin.
  await page.goto(`/reservar/valencia?checkIn=${futureDate(210)}&checkOut=${futureDate(213)}&guests=2`);
  await expect(page.getByRole("button", { name: /^ver fechas$/i })).toHaveCount(0);
  await page.goto("/admin/login");
  await expect(page.getByRole("button", { name: /ver fechas/i })).toHaveCount(0);
});
