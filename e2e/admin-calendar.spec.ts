import { test, expect, type Page } from "@playwright/test";

/**
 * Issue #60 §4 — the calendar's price editing: range/weekday selection, a
 * preview before saving, and the change taking effect on save.
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

test.describe("admin calendar V2 — price editing", () => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD");

  test("range select → preview → apply a fixed price", async ({ page }) => {
    await login(page);
    // Next month so today's row doesn't shrink the selectable set.
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 1);
    const m = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    await page.goto(`/admin/calendario?m=${m}`);

    const jav = page.locator("section").filter({ hasText: "Javalambre Mountain SuperSki" });
    await jav.getByRole("button", { name: "Entre semana" }).click();
    await expect(jav.getByText(/día\(s\) seleccionados/)).toBeVisible();

    await jav.getByLabel(/nuevo precio\/noche/i).fill("123");
    await expect(jav.getByText(/media nueva/)).toContainText("123");

    await jav.getByRole("button", { name: "Aplicar", exact: true }).click();
    await page.waitForLoadState("networkidle");

    // A weekday cell now shows 123 € and the "precio ajustado" dot.
    await expect(jav.getByText("123 €").first()).toBeVisible();
  });

  test("percentage adjust is offered with its own preview", async ({ page }) => {
    await login(page);
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 2);
    const m = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    await page.goto(`/admin/calendario?m=${m}`);

    const vlc = page.locator("section").filter({ hasText: "Valencia Frente al Mar" });
    await vlc.getByRole("button", { name: "Fin de semana" }).click();
    await vlc.getByText("Ajuste porcentual (%)").click();
    await vlc.getByLabel(/variación/i).fill("10");
    await expect(vlc.getByText(/media nueva/)).toBeVisible();
  });
});
