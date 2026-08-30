/**
 * Runs once when the Next.js server starts (issue #42 — env validated at boot).
 * It NEVER throws on a missing integration (the app must run degraded, per #41);
 * it logs a clear summary so a production deploy surfaces what is not configured.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env, DEMO_MODE } = await import("@/lib/env");
  const { getConfigFeatures } = await import("@/domains/config-status/registry");

  const features = getConfigFeatures();
  const pending = features.filter((f) => f.state === "not_configured");
  const errored = features.filter((f) => f.state === "error");

  const banner =
    `\n── Praetoria Vacacional · ${env.NODE_ENV} ──\n` +
    `  Site URL:  ${env.NEXT_PUBLIC_SITE_URL}\n` +
    `  Data:      ${DEMO_MODE ? "DEMO (in-memory, not for production)" : "Supabase"}\n` +
    `  Configured: ${features.filter((f) => f.state === "configured").map((f) => f.key).join(", ") || "none"}\n` +
    (pending.length ? `  Pending:    ${pending.map((f) => f.key).join(", ")}\n` : "") +
    (errored.length ? `  ⚠ ERROR:    ${errored.map((f) => f.key).join(", ")}\n` : "") +
    `────────────────────────────────────\n`;

  console.info(banner);

  if (env.NODE_ENV === "production") {
    if (DEMO_MODE) {
      console.warn(
        "⚠ Running in production WITHOUT Supabase — bookings will not persist. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or _ANON_KEY) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
      );
    }
    if (errored.length) {
      console.error(`⚠ Misconfigured integrations in production: ${errored.map((f) => f.statusLine).join(" | ")}`);
    }
  }
}
