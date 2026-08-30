import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Issue #92 — a search with no availability must never dead-end: it offers real
 * nearby free dates with a total price and a one-tap "Elegir estas fechas".
 */

function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed(request: APIRequestContext, property: string, checkIn: string, checkOut: string) {
  const res = await request.post("/api/checkout", {
    data: { property, checkIn, checkOut, guests: 2, idempotencyKey: crypto.randomUUID() },
  });
  return res.ok();
}

test("an unavailable property search offers priced nearby dates", async ({ page, request }) => {
  // Fill a window on Javalambre far out, then search for that exact window.
  let base = 120;
  let ci = "";
  let co = "";
  for (let i = 0; i < 10; i++) {
    ci = futureDate(base);
    co = futureDate(base + 3);
    if (await seed(request, "javalambre", ci, co)) break;
    base += 12;
  }

  await page.goto("/");
  await page.getByLabel(/entrada|check-in/i).fill(ci);
  await page.getByLabel(/salida|check-out/i).fill(co);
  await page.getByRole("button", { name: /ver disponibilidad|check availability/i }).click();

  const javCard = page.locator("li[data-experience]").filter({ hasText: "Javalambre" });
  await expect(javCard.getByText(/no disponible/i)).toBeVisible();
  await expect(javCard.getByText("Fechas cercanas libres")).toBeVisible();

  const firstAlt = javCard.getByRole("link", { name: "Elegir estas fechas" }).first();
  await expect(firstAlt).toBeVisible();

  // Its href carries different dates than the (taken) search and lands on checkout.
  const href = await firstAlt.getAttribute("href");
  expect(href).toContain("/reservar/javalambre");
  expect(href).not.toContain(`checkIn=${ci}`);
  await firstAlt.click();
  await expect(page).toHaveURL(/\/reservar\/javalambre/);
  await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();
});
