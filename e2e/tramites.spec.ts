import { test, expect, type Page, type Browser } from "@playwright/test";

/**
 * Gestión de trámites (#173–#178), en modo demostración:
 * alta → verificación → pago simulado → reserva comunicada → el equipo la
 * presenta y sube el justificante → el cliente lo ve. Y aislamiento entre
 * clientes: nadie ve la carpeta de otro.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "pv-local-test-pass";

/** «YYYY-MM-DDTHH:mm» en hora de Madrid, desplazado `hours` desde ahora. */
function madridLocal(hours: number): string {
  const d = new Date(Date.now() + hours * 3600_000);
  const f = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return f.replace(" ", "T");
}

async function signUp(page: Page, email: string, alias: string) {
  await page.goto("/alta-tramites");
  await expect(page.getByText(/cómo quieres contratar/i)).toBeVisible();
  // En desarrollo el asistente tarda en hidratarse: reintenta hasta que avance.
  await expect(async () => {
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByLabel("Nombre corto")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  await page.getByLabel("Nombre corto").fill(alias);
  await page.getByLabel("Dirección", { exact: true }).fill("Calle Mayor 12, 3.º B");
  await page.getByLabel("Código postal").fill("46400");
  await page.getByLabel("Municipio").fill("Cullera");
  await page.getByLabel("Provincia").fill("Valencia");
  await page.getByLabel("¿Está dada de alta en SES.HOSPEDAJES?").selectOption("no");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: "Una reserva más" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel("Nombre y apellidos").fill("Prueba E2E Titular");
  await page.getByLabel("NIF o NIE").fill("12345678Z");
  await page.getByLabel("Persona de contacto").fill("Prueba E2E");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Teléfono").fill("600 000 000");
  await page.getByLabel("Dirección de facturación").fill("Calle Mayor 12, 46400 Cullera");
  await page.getByLabel(/crea una contraseña/i).fill("clave-prueba-2026");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel(/condiciones del servicio/i).check();
  await page.getByLabel(/política de privacidad/i).check();
  await page.getByLabel(/autorizo a praetoria/i).check();
  await page.getByRole("button", { name: /confirmar y continuar al pago/i }).click();

  await expect(page.getByRole("heading", { name: /revisa tu correo/i })).toBeVisible();
  await page.getByRole("link", { name: /confirmar correo ahora/i }).click();
  await page.waitForURL(/\/mi-cuenta\/tramites/);
}

async function adminLogin(page: Page, next: string) {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  const pwd = page.getByLabel(/contraseña/i);
  if (await pwd.isVisible().catch(() => false)) {
    await pwd.fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 15_000 });
  }
}

async function freshPage(browser: Browser) {
  const ctx = await browser.newContext();
  return ctx.newPage();
}

test.describe("gestión de trámites", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "flujo largo: solo en escritorio");
  test.setTimeout(180_000);

  test("landing y páginas privadas: indexación y caché", async ({ request }) => {
    const alta = await request.get("/alta-tramites");
    expect(alta.headers()["x-robots-tag"] ?? "").toContain("noindex");
    const carpeta = await request.get("/mi-cuenta/acceso");
    expect(carpeta.headers()["cache-control"] ?? "").toContain("no-store");
    const portal = await request.get("/mi-cuenta/tramites", { maxRedirects: 0 });
    expect([302, 303, 307]).toContain(portal.status());
  });

  test("del alta al justificante, y aislamiento entre clientes", async ({ page, browser }) => {
    const stamp = Date.now();
    const emailA = `tramites-a-${stamp}@example.com`;
    await signUp(page, emailA, "Ático E2E");

    // Pago pendiente → pago simulado.
    await page.goto("/mi-cuenta/tramites");
    await page
      .getByRole("link", { name: /pago pendiente/i })
      .first()
      .click();
    await page.getByRole("button", { name: /pagar .* con tarjeta/i }).click();
    await page.getByRole("button", { name: /simular pago correcto/i }).click();
    await expect(page.getByText(/pagado/i).first()).toBeVisible();

    // Comunicar una reserva hecha hace una hora, con entrada dentro de 5 días.
    await page.goto("/mi-cuenta/tramites/reservas/nueva");
    await page.getByLabel(/cuándo se hizo la reserva/i).fill(madridLocal(-1));
    const checkIn = madridLocal(24 * 5).slice(0, 10);
    const checkOut = madridLocal(24 * 7).slice(0, 10);
    await page
      .getByLabel(/entrada/i)
      .first()
      .fill(checkIn);
    await page
      .getByLabel(/salida/i)
      .first()
      .fill(checkOut);
    await page.getByRole("button", { name: /comunicar la reserva/i }).click();
    await page.waitForURL(/\/mi-cuenta\/tramites\/reservas\/[0-9a-f-]{36}/);
    const reportUrl = page.url();

    // El cliente B no puede abrir nada de A.
    const pageB = await freshPage(browser);
    await signUp(pageB, `tramites-b-${stamp}@example.com`, "Casa B");
    const resp = await pageB.goto(reportUrl);
    expect(resp?.status()).toBe(404);
    await expect(pageB.getByText("Ático E2E")).toHaveCount(0);
    await pageB.context().close();

    // El equipo lo ve en «Servicios a propietarios», lo presenta y sube el justificante.
    const admin = await freshPage(browser);
    await adminLogin(admin, "/admin/tramites");
    await admin.goto("/admin/tramites?q=Ático E2E");
    const row = admin
      .getByRole("row")
      .filter({ hasText: /comunicación|reserva/i })
      .first();
    await row.getByRole("link").first().click();
    await admin.waitForURL(/\/admin\/tramites\/expedientes\//);

    // Presentación manual de la reserva y, después, de la entrada.
    for (const [hecho, ref] of [
      ["reserva", "SES-E2E-R"],
      ["entrada", "SES-E2E-E"],
    ] as const) {
      await admin.getByLabel("Fecha y hora (Madrid)").fill(madridLocal(0));
      await admin.getByLabel("Hecho comunicado").selectOption(hecho);
      await admin.getByLabel(/código o número de operación/i).fill(ref);
      await admin.getByRole("button", { name: "Registrar" }).click();
      await expect(admin.getByText(/presentación registrada/i)).toBeVisible();
      await admin.reload();
    }
    await expect(admin.getByText("Presentado").first()).toBeVisible();

    await admin.getByText(/subir un documento o el justificante oficial/i).click();
    await admin.getByLabel(/es el justificante oficial/i).check();
    await admin.locator('input[type="file"][name="file"]').setInputFiles({
      name: "acuse-ses.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% justificante de prueba\n"),
    });
    await admin.getByRole("button", { name: "Subir" }).click();
    await expect(admin.getByText(/justificante oficial guardado/i)).toBeVisible();

    await admin.reload();
    await admin.locator('select[name="to"]').selectOption("finalizado");
    await admin.getByRole("button", { name: "Aplicar" }).click();
    await expect(admin.getByText("Expediente cerrado.")).toBeVisible();
    await expect(admin.getByText("Finalizado").first()).toBeVisible();
    await admin.context().close();

    // El cliente A ve el justificante en su carpeta.
    await page.goto("/mi-cuenta/tramites/documentos");
    await expect(page.getByText("acuse-ses.pdf")).toBeVisible();
  });
});
