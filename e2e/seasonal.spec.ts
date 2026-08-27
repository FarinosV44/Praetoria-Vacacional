import { test, expect } from "@playwright/test";

/**
 * Seasonal SEO pages (issue #48). Published pages are indexable and in the
 * sitemap; draft pages render but are noindex and excluded from the sitemap.
 * No date/keyword combination creates new indexable URLs (dynamicParams=false).
 */

test("published seasonal page is indexable and in the sitemap", async ({ page, request }) => {
  await page.goto("/ofertas/verano-en-la-playa-de-valencia");
  await expect(page.locator("h1")).toContainText("Verano en la playa");
  const robots = page.locator('head meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /index/);
  await expect(robots).not.toHaveAttribute("content", /noindex/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/ofertas/verano-en-la-playa-de-valencia");
});

test("draft seasonal page is noindex and not in the sitemap", async ({ page, request }) => {
  const res = await page.goto("/ofertas/semana-santa-en-javalambre");
  expect(res?.status()).toBe(200);
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/ofertas/semana-santa-en-javalambre");
});

test("unknown seasonal slug 404s (no combinatorial URLs)", async ({ page }) => {
  const res = await page.goto("/ofertas/navidad-2099-oferta-random");
  expect(res?.status()).toBe(404);
});
