import { expect, test } from "@playwright/test";

/**
 * What AI agents and crawlers read from the site: real 404s, robots.txt signals,
 * llms.txt, Markdown negotiation, Link headers and WebMCP tools.
 */

test.describe("missing pages return a real 404", () => {
  for (const path of ["/no-existe-esta-pagina", "/reservar/no-existe-este-alojamiento"]) {
    test(path, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }

  test("known properties and their booking pages still work", async ({ request }) => {
    expect((await request.get("/valencia")).status()).toBe(200);
    expect((await request.get("/javalambre")).status()).toBe(200);
    expect((await request.get("/reservar/valencia")).status()).toBe(200);
  });
});

test("robots.txt is plain text and declares a Content-Signal", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  expect(await res.text()).toMatch(/^Content-Signal: search=yes/m);
});

test("llms.txt is served as plain text, not the catch-all page", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  expect((await res.text()).startsWith("# ")).toBe(true);
});

test.describe("home content negotiation", () => {
  test("an agent asking for Markdown gets Markdown that no CDN may store", async ({ request }) => {
    const res = await request.get("/", { headers: { Accept: "text/markdown" } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/markdown");
    expect(res.headers()["cache-control"]).toContain("no-store");
    expect((await res.text()).startsWith("# ")).toBe(true);
  });

  test("a browser still gets HTML, with the Link header advertising the rest", async ({ request }) => {
    const res = await request.get("/", { headers: { Accept: "text/html,*/*;q=0.8" } });
    expect(res.headers()["content-type"]).toContain("text/html");
    const link = res.headers().link ?? "";
    expect(link).toContain('</llms.txt>; rel="describedby"');
    expect(link).toContain('</index.md>; rel="alternate"; type="text/markdown"');
  });
});

test("the home links the about, contact and legal pages", async ({ page }) => {
  await page.goto("/");
  for (const href of ["/sobre-nosotros", "/contacto", "/legal/aviso-legal"]) {
    await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
  }
});

test("the home structured data carries sameAs in its own Organization block", async ({ page }) => {
  await page.goto("/");
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => JSON.parse(el.textContent ?? "null")));
  const org = blocks.find((b) => b["@type"] === "Organization");
  expect(org.sameAs.length).toBeGreaterThan(0);
});

test("WebMCP: the availability tool is registered and answers", async ({ page }) => {
  await page.addInitScript(() => {
    const tools: unknown[] = [];
    Object.assign(window, { __tools: tools });
    Object.defineProperty(navigator, "modelContext", {
      value: { registerTool: (tool: unknown) => tools.push(tool) },
    });
  });
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __tools: unknown[] }).__tools.length > 0);

  const result = await page.evaluate(async () => {
    const [tool] = (
      window as unknown as {
        __tools: { name: string; execute: (input: unknown) => Promise<{ content: { text: string }[] }> }[];
      }
    ).__tools;
    const year = new Date().getFullYear() + 1;
    const output = await tool!.execute({
      checkIn: `${year}-05-10`,
      checkOut: `${year}-05-13`,
      guests: 2,
    });
    return { name: tool!.name, data: JSON.parse(output.content[0]!.text) };
  });

  expect(result.name).toBe("search_availability");
  expect(result.data.results).toHaveLength(2);
});
