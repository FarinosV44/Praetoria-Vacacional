import { test, expect } from "@playwright/test";

/**
 * Issue #97 — the WhatsApp concierge button. Renders only when
 * NEXT_PUBLIC_WHATSAPP_NUMBER is set; opens wa.me with a prefilled message;
 * hidden on admin.
 */
test.describe("WhatsApp concierge", () => {
  test.skip(!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "needs NEXT_PUBLIC_WHATSAPP_NUMBER");

  test("floating button links to wa.me with a prefilled message", async ({ page }) => {
    await page.goto("/valencia");
    await page.waitForLoadState("load");
    const wa = page.getByRole("link", { name: /whatsapp/i });
    await expect(wa).toBeVisible();
    const href = await wa.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(await wa.getAttribute("target")).toBe("_blank");

    await page.goto("/admin/login");
    await expect(page.getByRole("link", { name: /whatsapp/i })).toHaveCount(0);
  });
});
