import { test, expect } from "@playwright/test";

/**
 * Issue #56 — the management intranet. Every intranet route is private and
 * non-indexable. The full operational chain (reserva → cliente → factura →
 * documento → calendario → historial → segmento) is exercised end to end in
 * `src/domains/invoicing/chain.test.ts` against the repository; here we only
 * assert the security surface, which is what an unauthenticated request sees.
 */

const PRIVATE_ROUTES = [
  "/admin",
  "/admin/reservas",
  "/admin/reservas/nuevo",
  "/admin/clientes",
  "/admin/clientes/nuevo",
  "/admin/facturas",
  "/admin/facturas/ajustes",
  "/admin/calendario",
  "/admin/marketing",
  "/admin/marketing/bajas",
  "/admin/actividad",
];

test("every intranet route redirects an unauthenticated visitor to the login", async ({ request }) => {
  for (const route of PRIVATE_ROUTES) {
    const res = await request.get(route, { maxRedirects: 0 });
    expect([302, 307], `${route} should redirect`).toContain(res.status());
    expect(res.headers()["location"] ?? "", route).toContain("/admin/login");
  }
});

test("private export + invoice-document endpoints reject without a session", async ({ request }) => {
  for (const route of [
    "/admin/clientes/export",
    "/admin/reservas/export",
    "/admin/facturas/export",
    "/admin/marketing/export",
  ]) {
    const res = await request.get(route, { maxRedirects: 0 });
    expect([401, 302, 307], route).toContain(res.status());
  }
});
