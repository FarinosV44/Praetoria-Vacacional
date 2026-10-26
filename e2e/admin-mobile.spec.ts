import { test, expect, type Page } from "@playwright/test";

/**
 * Admin phone app: installable manifest + service worker, the /admin/movil
 * start screen, and quick price changes that the public quote picks up.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "pv-local-test-pass";

async function login(page: Page, next = "/admin/movil") {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  const pwd = page.getByLabel(/contraseña/i);
  if (await pwd.isVisible().catch(() => false)) {
    await pwd.fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 15_000 });
  }
}

test.describe("admin mobile app", () => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD");
  test.use({ viewport: { width: 390, height: 844 } });

  test("is installable: manifest, icons and a service worker scoped to /admin/", async ({ page, request }) => {
    const manifest = await (await request.get("/admin.webmanifest")).json();
    expect(manifest.start_url).toBe("/admin/movil");
    expect(manifest.scope).toBe("/admin/");
    expect(manifest.display).toBe("standalone");
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).ok()).toBe(true);
    }
    expect((await request.get("/admin-sw.js")).ok()).toBe(true);

    await login(page);
    await page.goto("/admin/movil");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/admin.webmanifest");
    await expect(page.getByRole("heading", { name: /avisos de reservas en el móvil/i })).toBeVisible();
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe("/admin/");
  });

  test("quick prices: +5 € on the base weekday price is saved and quoted on the site", async ({ page, request }) => {
    // A Tuesday→Thursday in May next year: no Valencia season, both weekday nights.
    const d = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 4, 5));
    while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
    const iso = (x: Date) => x.toISOString().slice(0, 10);
    const checkOut = new Date(d);
    checkOut.setUTCDate(d.getUTCDate() + 2);
    const body = { property: "valencia", checkIn: iso(d), checkOut: iso(checkOut), guests: 2 };
    const before = await (await request.post("/api/quote", { data: body })).json();

    await login(page, "/admin/movil/precios?alojamiento=valencia");
    await page.goto("/admin/movil/precios?alojamiento=valencia");
    const restOfYear = page.locator("section", { has: page.getByRole("heading", { name: "Resto del año" }) });
    await restOfYear.getByRole("button", { name: /subir 5 € resto del año, domingo a jueves/i }).click();
    await page.getByRole("button", { name: /guardar 1 cambio/i }).click();
    await expect(page.getByRole("status")).toContainText(/precios guardados/i);

    const after = await (await request.post("/api/quote", { data: body })).json();
    expect(after.quote.nightlySubtotalCents).toBe(before.quote.nightlySubtotalCents + 2 * 500);

    // Put it back so other specs see the default tariff.
    await restOfYear.getByRole("button", { name: /bajar 5 € resto del año, domingo a jueves/i }).click();
    await page.getByRole("button", { name: /guardar 1 cambio/i }).click();
    await expect(page.getByRole("status")).toContainText(/precios guardados/i);
  });
});
