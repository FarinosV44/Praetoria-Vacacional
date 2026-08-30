import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility pass (issue #21). Serious/critical WCAG 2.1 A/AA
 * violations fail the build. The real assistive-technology pass is a separate
 * guided manual step.
 */
const pages = [
  { name: "home", path: "/" },
  { name: "home-en", path: "/en" },
  { name: "property", path: "/javalambre" },
  { name: "landing", path: "/valencia/apartamento-playa-valencia" },
  { name: "guide-hub", path: "/guias/valencia-playa" },
  { name: "guide", path: "/guias/valencia-playa/que-hacer-junto-al-mar-en-valencia" },
  { name: "blog", path: "/blog" },
  { name: "legal", path: "/legal/condiciones-reserva" },
  { name: "checkout", path: "/reservar/javalambre?checkIn=2027-01-10&checkOut=2027-01-14&guests=2" },
];

for (const p of pages) {
  test(`no serious a11y violations: ${p.name}`, async ({ page }) => {
    await page.goto(p.path);
    await page.waitForLoadState("networkidle");
    // Play any scroll-driven reveal animations so nothing is mid-fade during the scan.
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (serious.length) {
      console.log(
        serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} nodes`).join("\n"),
      );
    }
    expect(serious).toEqual([]);
  });
}
