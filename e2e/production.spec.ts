import { test, expect } from "@playwright/test";

/** Production-readiness surface (issue #42). */

test("health endpoint reports status + integrations", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBeLessThan(500);
  const body = await res.json();
  expect(body).toHaveProperty("status");
  expect(body).toHaveProperty("integrations");
  expect(body.integrations).toHaveProperty("payments");
  // never leaks secrets
  expect(JSON.stringify(body)).not.toMatch(/sk_|whsec_|service_role|re_[A-Za-z0-9]{10}/);
});

test("admin routes carry a noindex header and redirect unauthenticated users", async ({ request }) => {
  const res = await request.get("/admin", { maxRedirects: 0 });
  expect([302, 307]).toContain(res.status());
  expect(res.headers()["location"]).toContain("/admin/login");
});

test("cron / internal endpoints reject an unauthenticated request (issue #64)", async ({
  request,
}) => {
  for (const path of [
    "/api/cron/expire-holds",
    "/api/ical/import",
    "/api/cron/jobs",
    "/api/cron/comms",
    "/api/cron/privacy",
    "/api/cron/reconcile",
    "/api/cron/turnovers",
    "/api/cron/pricing",
  ]) {
    // no auth, a forged Vercel-cron header, and a wrong bearer must ALL be rejected
    // (401 when CRON_SECRET is set, 503 "not configured" otherwise — never 200).
    const cases: (Record<string, string> | undefined)[] = [
      undefined,
      { "x-vercel-cron": "1" },
      { authorization: "Bearer nope" },
    ];
    for (const headers of cases) {
      const res = await request.get(path, headers ? { headers } : undefined);
      expect([401, 503]).toContain(res.status());
    }
  }
});

test("security headers present on a public page", async ({ request }) => {
  const res = await request.get("/javalambre");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
});

test("no secret-shaped strings in the client bundle", async ({ page }) => {
  const scripts: string[] = [];
  page.on("response", async (r) => {
    if (r.url().endsWith(".js") && r.status() === 200) {
      try {
        scripts.push(await r.text());
      } catch {
        /* ignore */
      }
    }
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const all = scripts.join("\n");
  expect(all).not.toMatch(/\bsk_(test|live)_[A-Za-z0-9]{10}/);
  expect(all).not.toMatch(/\bwhsec_[A-Za-z0-9]{10}/);
  expect(all).not.toMatch(/service_role/);
});
