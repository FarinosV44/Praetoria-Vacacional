import { test, expect, type Page } from "@playwright/test";

/**
 * Issue #60 — Admin V2 shell: the compact sidebar with the new information
 * architecture, active-state, the "Acciones" quick menu and the Alojamientos hub.
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

const NAV = [
  "Resumen", "Calendario", "Reservas", "Precios y reglas", "Alojamientos",
  "Clientes", "Facturas", "Promociones", "Marketing", "Integraciones", "Configuración",
];

test.describe("admin V2 shell", () => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD");

  test("sidebar exposes the full navigation and marks the active item", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    const sidebar = page.locator(".admin-sidebar");
    for (const label of NAV) {
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(sidebar.getByRole("link", { name: "Resumen", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await sidebar.getByRole("link", { name: "Reservas", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/reservas$/);
    await expect(sidebar.getByRole("link", { name: "Reservas", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("the Acciones menu links to the key operations", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: /acciones/i }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: /nueva reserva/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /bloquear o abrir fechas/i })).toBeVisible();
    await menu.getByRole("menuitem", { name: /cambiar precios/i }).click();
    await expect(page).toHaveURL(/\/admin\/precios$/);
  });

  test("dashboard V2 shows the operative widgets", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    for (const w of ["Alojados ahora", "Entradas (7 días)", "Salidas (7 días)", "Huecos difíciles de vender", "Ocupación 30 / 60 / 90"]) {
      await expect(page.getByText(w, { exact: true }).first()).toBeVisible();
    }
  });

  test("reservations V2 has quick-filter chips that drive the query", async ({ page }) => {
    await login(page);
    await page.goto("/admin/reservas");
    await expect(page.getByRole("columnheader", { name: "Noches" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Estancia" })).toBeVisible();
    await page.getByRole("link", { name: "Booking", exact: true }).click();
    await expect(page).toHaveURL(/channel=booking/);
    await page.getByRole("link", { name: "Próximas", exact: true }).click();
    await expect(page).toHaveURL(/range=upcoming/);
  });

  test("the Alojamientos hub shows both properties with operational shortcuts", async ({ page }) => {
    await login(page);
    await page.goto("/admin/alojamientos");
    await expect(page.getByRole("heading", { name: "Javalambre Mountain SuperSki" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Valencia Frente al Mar" })).toBeVisible();
    await expect(page.getByText("6 huéspedes").first()).toBeVisible();
  });
});
