import { test, expect } from "@playwright/test";

/**
 * Final pre-production crawl (issue #51). Every URL in the sitemap must return
 * 200 with a unique <title>, a self-referential canonical, exactly one <h1> and
 * a meta description. Then a shallow internal-link crawl checks for dead links.
 */

async function sitemapUrls(request: import("@playwright/test").APIRequestContext) {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1]!.replace(/^https?:\/\/[^/]+/, ""),
  );
}

test("every sitemap URL is 200 with unique title, canonical, one h1, meta", async ({
  page,
  request,
}) => {
  const urls = await sitemapUrls(request);
  expect(urls.length).toBeGreaterThan(15);
  const titles = new Map<string, string>();

  for (const url of urls) {
    const res = await page.goto(url, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `${url} status`).toBe(200);

    const title = (await page.title()).trim();
    expect(title, `${url} has a title`).not.toBe("");
    if (titles.has(title)) {
      throw new Error(`Duplicate <title> "${title}" on ${url} and ${titles.get(title)}`);
    }
    titles.set(title, url);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, `${url} canonical`).toBeTruthy();
    expect(canonical!.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "")).toBe(
      url.replace(/\/$/, ""),
    );

    const h1Count = await page.locator("h1").count();
    expect(h1Count, `${url} h1 count`).toBe(1);

    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc, `${url} meta description`).toBeTruthy();

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots, `${url} indexable`).toMatch(/index/);
    expect(robots, `${url} not noindex`).not.toMatch(/noindex/);
  }
});

test("no broken internal links from the main entry pages", async ({ page, request }) => {
  const seeds = ["/", "/valencia", "/javalambre", "/guias", "/guias/valencia-playa"];
  const checked = new Set<string>();

  for (const seed of seeds) {
    await page.goto(seed, { waitUntil: "domcontentloaded" });
    const hrefs = await page.$$eval("a[href^='/']", (as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!).filter(Boolean),
    );
    for (const href of hrefs) {
      const path = href.split("#")[0]!;
      if (!path || checked.has(path) || path.startsWith("/api")) continue;
      checked.add(path);
      const res = await request.get(path, { maxRedirects: 0 });
      expect([200, 301, 308], `${path} from ${seed}`).toContain(res.status());
    }
  }
  expect(checked.size).toBeGreaterThan(10);
});
