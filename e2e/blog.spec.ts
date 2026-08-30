import { test, expect, type Page } from "@playwright/test";

/**
 * Blog / Actualidad (issue #57).
 *
 * Public surface is always checked. The admin CRUD round-trip runs only when
 * ADMIN_PASSWORD is available (.env.local), same pattern as the other admin e2e.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "pv-local-test-pass";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/contraseña/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /entrar|acceder|iniciar/i }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 15_000 });
}

test.describe.configure({ mode: "serial" });

test("public blog index is reachable and indexable", async ({ page }) => {
  const res = await page.goto("/blog");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/blog/i);
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});

test("an unknown article slug is a 404", async ({ page }) => {
  const res = await page.goto("/blog/no-existe-este-articulo");
  expect(res?.status()).toBe(404);
});

test("the admin blog panel is private", async ({ page }) => {
  await page.goto("/admin/blog");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin can create, publish, unpublish and delete an article", async ({ page }) => {
  test.skip(!process.env.ADMIN_PASSWORD, "needs ADMIN_PASSWORD (.env.local)");

  await login(page);
  await page.goto("/admin/blog/nuevo");

  const stamp = Date.now();
  const title = `Artículo de prueba ${stamp}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await page
    .getByRole("textbox", { name: /^Contenido/ })
    .fill("## Un subtítulo\n\nUn párrafo de prueba con **negrita**.");
  await page.getByLabel("Estado").selectOption("published");
  await page.getByLabel("Destino relacionado").selectOption("javalambre");
  await page.getByRole("button", { name: /Crear artículo/ }).click();

  // Redirected to the editor of the new post.
  await page.waitForURL(/\/admin\/blog\/[0-9a-f-]{36}$/, { timeout: 15_000 });
  const editorUrl = page.url();

  // Published → visible publicly with the Article schema and the CTA.
  const slug = `articulo-de-prueba-${stamp}`;
  const pub = await page.goto(`/blog/${slug}`);
  expect(pub?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  expect(await page.content()).toContain('"@type":"Article"');
  await expect(page.getByText(/Buscas alojamiento cerca de las pistas/)).toBeVisible();

  // Back to draft → 404 for the public.
  await page.goto(editorUrl);
  await page.getByLabel("Estado").selectOption("draft");
  await page.getByRole("button", { name: /Guardar cambios/ }).click();
  await expect(page.getByText(/Guardado/)).toBeVisible({ timeout: 15_000 });

  const draft = await page.goto(`/blog/${slug}`);
  expect(draft?.status()).toBe(404);

  // Clean up.
  await page.goto(editorUrl);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Eliminar/ }).click();
  await page.waitForURL(/\/admin\/blog$/, { timeout: 15_000 });
});
