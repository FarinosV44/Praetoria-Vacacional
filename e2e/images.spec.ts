import { test, expect } from "@playwright/test";

/**
 * Real property photos must actually load and lay out (issue #35/#38).
 * Guards against broken <picture>/next-image wiring that DOM inspection alone
 * can miss.
 */
const pages = [
  { name: "home", path: "/", minImages: 3 },
  { name: "property javalambre", path: "/javalambre", minImages: 5 },
  { name: "property valencia", path: "/valencia", minImages: 5 },
];

for (const p of pages) {
  test(`photos load and have size: ${p.name}`, async ({ page }) => {
    await page.goto(p.path);
    await page.waitForLoadState("load");
    // Nudge lazy images into view.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    // Wait until every property image has decoded (the Next optimiser can be
    // slow on a cold `next start`).
    await page
      .waitForFunction(
        () => {
          const imgs = [...document.querySelectorAll("img")].filter(
            (i: HTMLImageElement) =>
              (i.currentSrc || i.src).includes("/images/properties/") ||
              (i.currentSrc || i.src).includes("/_next/image"),
          );
          return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 1);
        },
        { timeout: 20_000 },
      )
      .catch(() => undefined);

    const stats = await page.evaluate(
      () => {
        const imgs = [...document.querySelectorAll("img")].filter(
          (i: HTMLImageElement) =>
            (i.currentSrc || i.src).includes("/images/properties/") ||
            (i.currentSrc || i.src).includes("/_next/image"),
        );
        return {
          total: imgs.length,
          loaded: imgs.filter((i) => i.complete && i.naturalWidth > 1).length,
          laidOut: imgs.filter((i) => i.getBoundingClientRect().width > 10).length,
        };
      },
    );

    expect(stats.total).toBeGreaterThanOrEqual(p.minImages);
    expect(stats.loaded).toBe(stats.total);
    expect(stats.laidOut).toBe(stats.total);
  });
}
