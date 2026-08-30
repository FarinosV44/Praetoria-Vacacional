import { test, expect, type Page } from "@playwright/test";

/**
 * Issue #59 — a day occupied by another guest's ARRIVAL must still be selectable
 * as a check-OUT date (half-open `[check-in, check-out)` model), and it must be
 * drawn as a departure-only cell rather than fully disabled.
 */

function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Far-future starting point; the seed step walks it forward until it finds an
// unbooked window (the DEMO store is persistent across runs).
const START = 150 + (Math.floor(Date.now() / 1000) % 90);

/** Page the two-month calendar forward until `label` is on screen. */
async function revealDay(page: Page, label: string) {
  const cell = page.locator(`button[aria-label*="${label}"]`).first();
  for (let i = 0; i < 10; i++) {
    if (await cell.count()) return cell;
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await page.waitForTimeout(120);
  }
  return cell;
}

test("an occupied arrival day can be picked as check-out", async ({ page, request }) => {
  // Find a free window and seed a hold whose ARRIVAL day we will later pick as
  // a check-out from an earlier stay.
  let base = START;
  let arrival = "";
  let depart = "";
  for (let attempt = 0; attempt < 12; attempt++) {
    arrival = futureDate(base + 6);
    depart = futureDate(base + 9);
    const seeded = await request.post("/api/checkout", {
      data: {
        property: "javalambre",
        checkIn: arrival,
        checkOut: depart,
        guests: 2,
        idempotencyKey: crypto.randomUUID(),
      },
    });
    if (seeded.ok()) break;
    base += 15;
    expect(attempt, "no free window found to seed").toBeLessThan(11);
  }

  await page.goto("/javalambre");
  await expect(page.getByText("Selecciona entrada y salida")).toBeVisible();

  const checkInDay = futureDate(base + 3);
  await (await revealDay(page, checkInDay)).click();

  const arrivalCell = await revealDay(page, arrival);
  await expect(arrivalCell).toHaveAttribute("data-role", "exit-only");
  await expect(arrivalCell).toBeEnabled();
  await arrivalCell.click();

  // The widget now has a complete, priceable 3-night range.
  await expect(page.getByText("Elige la fecha de salida")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^reservar$/i })).toBeEnabled({ timeout: 10_000 });
});
