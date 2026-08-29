import { test, expect, type Page } from "@playwright/test";

/**
 * Regression for the Booking iCal admin persistence bug: a saved URL must
 * survive a full page reload (and, by construction, redeploys / browser
 * restarts, since it is written to the database — here the DEMO store on a
 * writable filesystem). Requires ADMIN_PASSWORD (see .env.local).
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "pv-local-test-pass";

const JAV_URL = "https://ical.booking.com/v1/export?t=11111111-2222-3333-4444-555555555555";
const VLC_URL = "https://ical.booking.com/v1/export?t=66666666-7777-8888-9999-000000000000";

async function login(page: Page) {
  await page.goto("/admin/login");
  const pwd = page.getByLabel(/contraseña/i);
  if (await pwd.isVisible().catch(() => false)) {
    await pwd.fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    // Wait until the client-side redirect has left /admin/login.
    await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 15_000 });
    await page.waitForLoadState("domcontentloaded");
  }
}

function section(page: Page, property: "javalambre" | "valencia") {
  const text = property === "javalambre" ? "Javalambre" : "Valencia Frente al Mar";
  return page.locator("section").filter({ hasText: text });
}

/** The Booking.com feed form inside a property's section. */
function bookingForm(page: Page, property: "javalambre" | "valencia") {
  return section(page, property)
    .locator("form")
    .filter({ has: page.locator('input[name="channel"][value="booking"]') });
}
function feedInput(page: Page, property: "javalambre" | "valencia") {
  return bookingForm(page, property).locator('input[name="url"]');
}
function saveButton(page: Page, property: "javalambre" | "valencia") {
  return bookingForm(page, property).getByRole("button", { name: /guardar|actualizar/i });
}

test.describe.configure({ mode: "serial" });

test("saved Booking iCal URLs persist across a full reload, per property", async ({ page }) => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD (.env.local) to reach the admin panel");
  await login(page);
  await page.goto("/admin/sincronizacion");

  // --- Save Javalambre ---
  await feedInput(page, "javalambre").fill(JAV_URL);
  await saveButton(page, "javalambre").click();
  await expect(
    bookingForm(page, "javalambre").getByText(/guardado y verificado/i),
  ).toBeVisible({ timeout: 10_000 });

  // --- Save Valencia ---
  await feedInput(page, "valencia").fill(VLC_URL);
  await saveButton(page, "valencia").click();
  await expect(
    bookingForm(page, "valencia").getByText(/guardado y verificado/i),
  ).toBeVisible({ timeout: 10_000 });

  // --- FULL RELOAD ---
  await page.goto("/admin/sincronizacion", { waitUntil: "domcontentloaded" });

  await expect(feedInput(page, "javalambre")).toHaveValue(JAV_URL);
  await expect(feedInput(page, "valencia")).toHaveValue(VLC_URL);

  // Status badge per property reads "Configurado".
  await expect(section(page, "javalambre").getByText(/^Configurado$/).first()).toBeVisible();
  await expect(section(page, "valencia").getByText(/^Configurado$/).first()).toBeVisible();

  // --- Clearing one must not touch the other ---
  await feedInput(page, "javalambre").fill("");
  await saveButton(page, "javalambre").click();
  await expect(
    bookingForm(page, "javalambre").getByText(/guardado y verificado/i),
  ).toBeVisible({ timeout: 10_000 });
  await page.goto("/admin/sincronizacion", { waitUntil: "domcontentloaded" });
  await expect(feedInput(page, "javalambre")).toHaveValue("");
  await expect(feedInput(page, "valencia")).toHaveValue(VLC_URL);

  // restore Javalambre for the sync test that follows
  await feedInput(page, "javalambre").fill(JAV_URL);
  await saveButton(page, "javalambre").click();
  await expect(
    bookingForm(page, "javalambre").getByText(/guardado y verificado/i),
  ).toBeVisible({ timeout: 10_000 });
});

test("'Sincronizar ahora' uses the persisted value and never wipes it", async ({ page }) => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD (.env.local) to reach the admin panel");
  await login(page);
  await page.goto("/admin/sincronizacion", { waitUntil: "domcontentloaded" });

  // pre-condition: both URLs are present from the previous test
  await expect(feedInput(page, "javalambre")).toHaveValue(JAV_URL);

  const javSection = section(page, "javalambre");
  await javSection.getByRole("button", { name: /sincronizar ahora/i }).click();

  // The Booking token is fake → the BOOKING line reports an HTTP error, NOT
  // "sin URL configurada" — which proves the run read the persisted URL.
  const bookingLine = javSection.getByText(/^booking:/i);
  await expect(bookingLine).toBeVisible({ timeout: 20_000 });
  await expect(bookingLine).not.toContainText(/sin URL configurada/i);
  await expect(bookingLine).toContainText(/error/i);

  // and the URL is still there after the sync
  await page.goto("/admin/sincronizacion", { waitUntil: "domcontentloaded" });
  await expect(feedInput(page, "javalambre")).toHaveValue(JAV_URL);
});
