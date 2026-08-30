/**
 * Environment-variable fallback for a channel's iCal **import** URL.
 * (Consumed only from server modules — `sync.ts`, `sync-status.ts` — which carry
 * the `server-only` guard; kept import-free so it stays unit-testable.)
 *
 * Why this exists: production currently runs in DEMO mode (no Supabase), so an
 * admin-entered import URL lives in `.data/demo.json` on the server's disk — and
 * a redeploy replaces that directory, wiping the URL. An env var set in the
 * hosting panel survives every redeploy. Resolution order is always:
 *
 *   admin-saved value (channel_feeds / .data)  →  env var  →  content-file default
 *
 * so saving from `/admin/sincronizacion` still wins while there is a database,
 * and the env var is the durable floor when there is not.
 *
 * Variable name: `ICAL_IMPORT_<SLUG>_<CHANNEL>` (upper-case, non-alphanumerics
 * → `_`), e.g. `ICAL_IMPORT_VALENCIA_BOOKING`, `ICAL_IMPORT_JAVALAMBRE_AIRBNB`.
 */
export function envImportUrl(slug: string, channel: string): string | null {
  const key = `ICAL_IMPORT_${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${channel
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;
  const value = process.env[key]?.trim();
  return value && /^https?:\/\//i.test(value) ? value : null;
}
