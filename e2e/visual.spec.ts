import { test, expect } from "@playwright/test";

/**
 * Visual regression for the Design System V4 (issue #77).
 *
 * Full-page screenshots of every public template at a phone and a desktop
 * width. Baselines live in e2e/__screenshots__/ and are regenerated with
 * `npx playwright test visual --update-snapshots` after an intended visual
 * change. A diff over maxDiffPixelRatio (playwright.config.ts) fails the run.
 *
 * DEMO data is deterministic (seeded from src/content), so these pages render
 * identically build to build. Only runs on the chromium project.
 */

test.describe("visual · design system", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "baseline on chromium only");

  const pages: [name: string, path: string][] = [
    ["home", "/"],
    ["property-valencia", "/valencia"],
    ["property-javalambre", "/javalambre"],
    ["guides-hub", "/guias"],
    ["guide-hub-page", "/guias/valencia-playa"],
    ["blog-index", "/blog"],
    ["offer", "/ofertas/escapada-de-ultima-hora-a-la-playa-de-valencia"],
    ["direct-booking", "/ventajas-reserva-directa"],
    ["contact", "/contacto"],
    ["legal", "/legal/aviso-legal"],
  ];

  for (const width of [390, 1280] as const) {
    for (const [name, path] of pages) {
      test(`${name} @ ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        // settle lazy images and the scroll-reveal timeline
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(150);
        await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
