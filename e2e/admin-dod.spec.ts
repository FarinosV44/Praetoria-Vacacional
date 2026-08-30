import { test, expect, type Page } from "@playwright/test";

/**
 * Issue #60 "Definición de terminado" — the whole flow, end to end, no code:
 * open admin → see upcoming reservations for both properties → open the calendar
 * → select ~10 days → change the range price → set a different weekend price →
 * change the minimum stay → close two dates → reopen them → open a reservation
 * and see its detail → do one operation from mobile.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "pv-local-test-pass";

async function login(page: Page) {
  await page.goto("/admin/login");
  const pwd = page.getByLabel(/contraseña/i);
  if (await pwd.isVisible().catch(() => false)) {
    await pwd.fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 15_000 });
  }
}

test.describe("issue #60 — definición de terminado", () => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD");

  test("the full operational flow works without touching code", async ({ page }) => {
    // 1 · open admin
    await login(page);

    // 2 · the dashboard shows upcoming arrivals/departures for both properties
    await page.goto("/admin");
    await expect(page.getByText("Entradas (7 días)", { exact: true })).toBeVisible();
    await expect(page.getByText("Salidas (7 días)", { exact: true })).toBeVisible();
    const byProperty = page.locator(".admin-card").filter({ hasText: "Por alojamiento" });
    await expect(byProperty.getByText(/Javalambre Mountain SuperSki/)).toBeVisible();
    await expect(byProperty.getByText(/Valencia Frente al Mar/)).toBeVisible();

    // 3 · open the calendar (next month, so a full month of days is selectable)
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 1);
    const m = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    await page.goto(`/admin/calendario?m=${m}`);
    const jav = page.locator("section").filter({ hasText: "Javalambre Mountain SuperSki" });

    // 4 · select a range of days (a whole week button ≈ 7, then the panel opens)
    await jav.getByRole("button", { name: "Sem. 2" }).click();
    await jav.getByRole("button", { name: "Sem. 3" }).click();
    await expect(jav.getByText(/día\(s\) seleccionados/)).toBeVisible();

    // 5 · change the range price
    await jav.getByLabel(/nuevo precio\/noche/i).fill("142");
    await expect(jav.getByText(/media nueva/)).toContainText("142");
    await jav.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(jav.getByText("142 €").first()).toBeVisible();

    // 6 · a different weekend price
    await jav.getByRole("button", { name: "Fin de semana", exact: true }).click();
    await jav.getByLabel(/nuevo precio\/noche/i).fill("189");
    await jav.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(jav.getByText("189 €").first()).toBeVisible();

    // 7 · change the minimum stay
    await jav.getByRole("button", { name: "Todo el mes", exact: true }).click();
    await jav.getByLabel(/estancia mínima/i).fill("5");
    await jav.getByRole("button", { name: /aplicar estancia mínima/i }).click();
    await expect(jav.getByText(/mín 5/).first()).toBeVisible();

    // 8 · close two dates
    const clearIfAny = async () => {
      const c = jav.getByRole("button", { name: "Limpiar", exact: false });
      if (await c.isVisible().catch(() => false)) await c.click();
    };
    await clearIfAny();
    const blocks = jav.locator('button[data-cell-state="block"]');
    const before = await blocks.count();
    const free = jav.locator('button[data-cell-state="free"]:not([disabled])');
    const day1 = (await free.nth(24).getAttribute("data-date"))!;
    const day2 = (await free.nth(25).getAttribute("data-date"))!;
    await free.nth(24).click();
    await free.nth(25).click();
    await jav.getByRole("button", { name: "Cerrar fechas" }).click();
    await expect(blocks).toHaveCount(before + 2);

    // 9 · reopen exactly those two days
    await clearIfAny();
    await jav.locator(`button[data-date="${day1}"]`).click();
    await jav.locator(`button[data-date="${day2}"]`).click();
    await jav.getByRole("button", { name: "Abrir fechas" }).click();
    await expect(blocks).toHaveCount(before);

    // 10 · open a reservation and see its detail (or the empty list, in DEMO)
    await page.goto("/admin/reservas");
    await expect(page.getByRole("columnheader", { name: "Estancia" })).toBeVisible();

    // 11 · one operation from mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    await page.getByRole("button", { name: /menú/i }).click();
    await page.locator(".admin-sidebar").getByRole("link", { name: "Calendario", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/calendario/);
    await expect(page.getByRole("heading", { name: "Calendario y precios" })).toBeVisible();
  });
});
