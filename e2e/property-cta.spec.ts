import { test, expect } from "@playwright/test";

/**
 * Availability / booking CTAs on a property page (issue #55).
 *
 * The bug: those CTAs pointed at `#contenido`, an id also carried by the
 * `<main>` landmark, so the browser jumped to the FIRST match — the top of the
 * page. They must now land on the property's own booking module
 * (`#reserva-<slug>`), keep the right property, and never scroll to the top.
 */

for (const slug of ["javalambre", "valencia"]) {
  test(`${slug}: the closing CTA lands on the booking module, not the top`, async ({ page }) => {
    await page.goto(`/${slug}`);
    await page.waitForLoadState("networkidle");

    const cta = page.getByRole("link", { name: /ver fechas y precio/i });
    await expect(cta).toHaveAttribute("href", `#reserva-${slug}`);

    // scroll down first so a broken "#contenido" jump-to-top would be visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await cta.click();

    await expect(page).toHaveURL(new RegExp(`#reserva-${slug}$`));
    const module = page.locator(`#reserva-${slug}`);
    await expect(module).toBeInViewport();
    await expect(module.getByText(/consulta tus fechas/i)).toBeVisible();
    // the whole point of the issue: the CTA must not send the user to the top
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(50);
  });

  test(`${slug}: the sticky mobile CTA targets the same booking module`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`/${slug}`);
    await page.waitForLoadState("networkidle");

    const sticky = page.getByRole("link", { name: /consultar fechas y reservar/i });
    await expect(sticky).toHaveAttribute("href", `#reserva-${slug}`);

    await sticky.click();

    await expect(page).toHaveURL(new RegExp(`#reserva-${slug}$`));
    const module = page.locator(`#reserva-${slug}`);
    await expect(module).toBeInViewport();
    // the module that scrolled into view is this property's own booking widget
    await expect(module.getByText(/consulta tus fechas/i)).toBeVisible();
  });
}

test("no booking CTA on a property page points at an empty or shared anchor", async ({ page }) => {
  await page.goto("/javalambre");
  const bad = await page
    .locator('a[href="#"], a[href="#contenido"], a[href="/"]')
    .filter({ hasText: /fecha|disponibilidad|reserv/i })
    .count();
  expect(bad).toBe(0);
});
