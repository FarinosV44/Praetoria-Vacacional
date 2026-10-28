import { test, expect } from "@playwright/test";

/**
 * Owner acquisition page (/propietarios): reachable from the header, footer and
 * home, indexable, and the lead form validates and confirms.
 */
test.describe("propietarios · captación de propietarios", () => {
  test("page is linked from the home and footer and is indexable", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/propietarios"]').first()).toBeAttached();
    await expect(page.locator('footer a[href="/propietarios"]')).toHaveCount(1);

    await page.goto("/propietarios");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("gestionado de principio a fin");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/propietarios$/);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "index").not.toContain("noindex");
  });

  test("form shows errors, then confirms a valid lead", async ({ page }) => {
    await page.goto("/propietarios#propuesta");
    const form = page.locator("#propuesta form");
    await form.getByRole("button", { name: "Quiero mi propuesta" }).click();
    await expect(form.locator("[aria-invalid=true]").first()).toBeVisible();

    await form.locator('input[name="name"]').fill("Propietaria de Prueba");
    await form.locator('input[name="phone"]').fill("+34 600 000 000");
    await form.locator('input[name="email"]').fill("propietaria@example.com");
    await form.locator('select[name="zone"]').selectOption("llastra-palmeres");
    await form.locator('select[name="location"]').selectOption("primera-linea");
    await form.locator('input[name="bedrooms"]').fill("3");
    await form.locator('select[name="licence"]').selectOption("no-se");
    await form.locator('input[name="consent"]').check();
    await form.getByRole("button", { name: "Quiero mi propuesta" }).click();

    await expect(page.getByRole("status")).toContainText("Hemos recibido tu solicitud");
  });

  test("the guest booking bar is not shown to owners", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/propietarios");
    await expect(page.getByRole("button", { name: "Ver fechas" })).toHaveCount(0);
  });
});
