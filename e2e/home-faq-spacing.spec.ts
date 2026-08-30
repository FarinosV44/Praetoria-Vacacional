import { test, expect } from "@playwright/test";

/**
 * Home FAQ → footer spacing (issue: excessive empty space below the accordion).
 * The FAQ section sizes to its content; the gap between the last FAQ row and the
 * footer must be ~64–96px on desktop and clearly less on mobile — with no
 * min-height, viewport-height spacer or oversized padding doing the work.
 */

async function faqToFooterGap(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const faq = document.querySelector("#faq-heading")!.closest("section")!;
    const rows = faq.querySelectorAll("details");
    const lastRow = rows[rows.length - 1]!.getBoundingClientRect();
    const footer = document.querySelector("footer")!.getBoundingClientRect();
    return {
      gap: Math.round(footer.top - lastRow.bottom),
      rowCount: rows.length,
      mainPadBottom: getComputedStyle(document.querySelector("main")!).paddingBottom,
      footerMarginTop: getComputedStyle(document.querySelector("footer")!).marginTop,
    };
  });
}

test("desktop: 64–96px between the last FAQ row and the footer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const m = await faqToFooterGap(page);
  expect(m.rowCount).toBe(7); // 5 original + 2 new general FAQs
  expect(m.mainPadBottom).toBe("0px");
  expect(m.footerMarginTop).toBe("0px");
  expect(m.gap, `gap was ${m.gap}px`).toBeGreaterThanOrEqual(60);
  expect(m.gap, `gap was ${m.gap}px`).toBeLessThanOrEqual(100);
});

test("mobile: the FAQ→footer gap is clearly tighter than desktop", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const m = await faqToFooterGap(page);
  expect(m.gap, `gap was ${m.gap}px`).toBeLessThanOrEqual(56);
});

test("the two new general FAQs are present and answered", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("¿Cómo funciona la reserva directa con Praetoria Vacacional?"),
  ).toBeVisible();
  await expect(
    page.getByText(/¿Qué diferencia hay entre reservar aquí y hacerlo a través de una plataforma\?/),
  ).toBeVisible();
  await page
    .getByRole("group")
    .filter({ hasText: "¿Cómo funciona la reserva directa" })
    .locator("summary")
    .click();
  await expect(page.getByText(/completa el pago seguro online/)).toBeVisible();
});
