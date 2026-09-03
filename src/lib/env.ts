import { z } from "zod";

/**
 * Typed environment access.
 *
 * The platform must build and run before real credentials exist (decision D-003).
 * Strategy: every integration variable is optional at the schema level; a set of
 * `*Configured` booleans tells the rest of the app which capabilities are live.
 * When Supabase is not configured the app runs in DEMO mode against an in-memory
 * repository seeded from `src/content` — useful for local QA and previews.
 *
 * Nothing here is exposed to the client except values already prefixed `NEXT_PUBLIC_`.
 */

const PLACEHOLDER = /^(|changeme|placeholder|your-.*|xxx+|todo)$/i;
const isReal = (v: string | undefined): v is string => !!v && !PLACEHOLDER.test(v.trim());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Kept permissive on purpose — a typo in the site URL must not 503 the whole
  // site (cf. PRODUCTION_STRICT tolerance). It is normalised in `normalizeUrl`.
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().default("Praetoria Vacacional"),

  // Supabase — both the legacy (JWT anon / service_role) and the new
  // (sb_publishable_… / sb_secret_…) key names are accepted; whichever is set
  // wins. The `@supabase/supabase-js` client treats them interchangeably.
  //
  // IMPORTANT: `NEXT_PUBLIC_*` values are inlined into the bundle at BUILD time,
  // so setting them in a hosting panel without a rebuild leaves the app in DEMO
  // mode. `SUPABASE_URL` (no prefix) is read at RUNTIME and is all the server
  // needs — the publishable/anon key is only for the not-yet-live browser client
  // (D-005). Prefer `SUPABASE_URL` + `SUPABASE_SECRET_KEY` on Hostinger.
  SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Praetoria Vacacional <reservas@example.com>"),
  EMAIL_REPLY_TO: z.string().optional(),
  /** Optional separate From for marketing campaigns (issue #73). */
  MARKETING_FROM: z.string().optional(),
  /** Resend webhook signing secret for bounce/complaint suppression (issue #73). */
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // Admin
  ADMIN_EMAILS: z.string().default(""),
  /** Password for the admin panel. Required to use /admin in DEMO mode; in
   *  Supabase mode it is an additional gate on top of Supabase Auth. */
  ADMIN_PASSWORD: z.string().optional(),
  /** Secret used to sign the admin session cookie. */
  ADMIN_SESSION_SECRET: z.string().optional(),
  /** Role of the single admin login (issue #56 §10). Architecture is
   *  ready for admin / gestion / lectura; today there is one login. */
  ADMIN_ROLE: z.enum(["admin", "gestion", "lectura"]).default("admin"),
  /** Opt in to per-user Supabase Auth for /admin (email + password, MFA,
   *  revocable sessions — issue #65). OFF by default: the panel then uses the
   *  single `ADMIN_PASSWORD` cookie login and the sign-in form asks for the
   *  password only. Set to a truthy value once Supabase Auth users exist. */
  ADMIN_SUPABASE_AUTH: z.string().optional(),

  // Distributed rate limiting (issue #62). Optional — without it the limiter
  // uses an in-memory store (correct for a single instance). Upstash Redis REST,
  // or the KV_REST_API_* aliases a Vercel KV / Upstash integration injects.
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // iCal sync — token that authenticates our public export feeds
  ICAL_EXPORT_TOKEN: z.string().optional(),
  /** Shared secret for cron / internal service-to-service calls (issue #64).
   *  Vercel Cron sends it automatically as `Authorization: Bearer <value>`. */
  CRON_SECRET: z.string().optional(),

  // Analytics / Search Console (optional)
  NEXT_PUBLIC_GA4_ID: z.string().optional(),
  NEXT_PUBLIC_GSC_VERIFICATION: z.string().optional(),

  // Observability (issue #66) — all optional; structured logging is always on.
  // `SENTRY_DSN` turns on server-side error forwarding (no SDK, see
  // src/lib/observability). `NEXT_PUBLIC_SENTRY_DSN` lets the browser report
  // unhandled errors through /api/observability/client-error.
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  OBSERVABILITY_ENV: z.string().optional(),
  OBSERVABILITY_RELEASE: z.string().optional(),

  // SES.HOSPEDAJES — Spain traveller registry (issue #72). Obtain from the
  // Guardia Civil / Policía Nacional portal. Absent → the parte is generated and
  // the owner submits it manually on the official portal.
  SES_HOSPEDAJES_USER: z.string().optional(),
  SES_HOSPEDAJES_PASSWORD: z.string().optional(),
  SES_HOSPEDAJES_ESTABLISHMENT: z.string().optional(),

  // WhatsApp concierge (issue #97) — E.164 digits only, e.g. 34600111222.
  // Absent → the floating WhatsApp button does not render.
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),

  // Reservation hold window (minutes) while the guest pays
  RESERVATION_HOLD_MINUTES: z.coerce.number().int().positive().default(30),

  /**
   * Fail-closed production (issue #63). When truthy and NODE_ENV=production, the
   * server refuses to boot if a critical integration is missing (no Supabase =
   * DEMO mode, no Stripe, no admin session secret, no CRON_SECRET). Default off
   * so a staging / preview deploy can still run degraded; the owner flips it on
   * for the real launch (see docs/launch-checklist.md).
   *
   * Accepts any common spelling (`true`/`1`/`yes`/`on`, case-insensitive); any
   * other value — including a typo — is treated as OFF and never crashes the
   * boot, so a mistyped flag can't take the whole site down.
   */
  PRODUCTION_STRICT: z.string().optional(),
});

/** True only for an explicit truthy flag; a typo or unknown value → false. */
function isFlagOn(v: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test((v ?? "").trim());
}

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Shape errors are real misconfiguration (e.g. a malformed URL) — fail loudly.
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const raw = parsed.data;

/** Best-effort: accept "domain.com", "http://…", trailing slashes, spaces. A
 *  bad value logs a warning and falls back — it never throws. */
function normalizeSiteUrl(v: string | undefined): string {
  const fallback = "http://localhost:3000";
  const s = (v ?? "").trim().replace(/\/+$/, "");
  if (!s) return fallback;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    console.warn(`⚠ NEXT_PUBLIC_SITE_URL ("${v}") is not a valid URL — using ${fallback}`);
    return fallback;
  }
}
const siteUrl = normalizeSiteUrl(raw.NEXT_PUBLIC_SITE_URL);

// Resolve the Supabase config once. The runtime-only `SUPABASE_URL` wins over
// the build-time `NEXT_PUBLIC_SUPABASE_URL` so a hosting-panel value works
// without a rebuild.
const supabaseUrl = isReal(raw.SUPABASE_URL)
  ? raw.SUPABASE_URL
  : isReal(raw.NEXT_PUBLIC_SUPABASE_URL)
    ? raw.NEXT_PUBLIC_SUPABASE_URL
    : undefined;
const supabasePublishableKey = isReal(raw.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ? raw.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  : isReal(raw.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? raw.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : undefined;
const supabaseSecretKey = isReal(raw.SUPABASE_SECRET_KEY)
  ? raw.SUPABASE_SECRET_KEY
  : isReal(raw.SUPABASE_SERVICE_ROLE_KEY)
    ? raw.SUPABASE_SERVICE_ROLE_KEY
    : undefined;

const rateLimitRedisUrl = isReal(raw.UPSTASH_REDIS_REST_URL)
  ? raw.UPSTASH_REDIS_REST_URL
  : isReal(raw.KV_REST_API_URL)
    ? raw.KV_REST_API_URL
    : undefined;
const rateLimitRedisToken = isReal(raw.UPSTASH_REDIS_REST_TOKEN)
  ? raw.UPSTASH_REDIS_REST_TOKEN
  : isReal(raw.KV_REST_API_TOKEN)
    ? raw.KV_REST_API_TOKEN
    : undefined;

export const env = {
  ...raw,
  /** Always a valid absolute origin, no trailing slash (see `normalizeSiteUrl`). */
  NEXT_PUBLIC_SITE_URL: siteUrl,
  /** URL of the Supabase project (or undefined in DEMO mode). */
  supabaseUrl,
  /** Publishable / anon key — RLS-gated, safe on the client. */
  supabasePublishableKey,
  /** Secret / service-role key — bypasses RLS, server-only. */
  supabaseSecretKey,
  // The server repository only needs the URL + secret key (D-005 — the browser
  // client / publishable key has no live read path yet). Requiring the
  // publishable key here would silently drop the app to DEMO when only the
  // build-time NEXT_PUBLIC value is missing.
  supabaseConfigured: !!supabaseUrl && !!supabaseSecretKey,
  /** True only when the browser SSR client (Supabase Auth, #65) can be built. */
  supabaseBrowserConfigured: !!supabaseUrl && !!supabasePublishableKey,
  /** /admin uses per-user Supabase Auth (email + password). Opt-in AND the
   *  browser client must be buildable; otherwise /admin is password-only. */
  adminSupabaseAuth: isFlagOn(raw.ADMIN_SUPABASE_AUTH) && !!supabaseUrl && !!supabasePublishableKey,
  stripeConfigured: isReal(raw.STRIPE_SECRET_KEY) && isReal(raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  stripeWebhookConfigured: isReal(raw.STRIPE_WEBHOOK_SECRET),
  emailConfigured: isReal(raw.RESEND_API_KEY),
  MARKETING_FROM: isReal(raw.MARKETING_FROM) ? raw.MARKETING_FROM : undefined,
  RESEND_WEBHOOK_SECRET: isReal(raw.RESEND_WEBHOOK_SECRET) ? raw.RESEND_WEBHOOK_SECRET : undefined,
  icalExportConfigured: isReal(raw.ICAL_EXPORT_TOKEN),
  CRON_SECRET: isReal(raw.CRON_SECRET) ? raw.CRON_SECRET : undefined,
  adminConfigured: isReal(raw.ADMIN_PASSWORD),
  analyticsConfigured: isReal(raw.NEXT_PUBLIC_GA4_ID),
  observabilityConfigured: isReal(raw.SENTRY_DSN),
  rateLimitRedisUrl,
  rateLimitRedisToken,
  rateLimitDistributed: !!rateLimitRedisUrl && !!rateLimitRedisToken,
  whatsappConfigured: isReal(raw.NEXT_PUBLIC_WHATSAPP_NUMBER),
  SES_HOSPEDAJES_USER: isReal(raw.SES_HOSPEDAJES_USER) ? raw.SES_HOSPEDAJES_USER : undefined,
  SES_HOSPEDAJES_PASSWORD: isReal(raw.SES_HOSPEDAJES_PASSWORD) ? raw.SES_HOSPEDAJES_PASSWORD : undefined,
  SES_HOSPEDAJES_ESTABLISHMENT: isReal(raw.SES_HOSPEDAJES_ESTABLISHMENT)
    ? raw.SES_HOSPEDAJES_ESTABLISHMENT
    : undefined,
  adminEmails: raw.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
  adminRole: raw.ADMIN_ROLE,
  /** Resolved boolean — see `isFlagOn`. Overrides the raw string from `...raw`. */
  PRODUCTION_STRICT: isFlagOn(raw.PRODUCTION_STRICT),
} as const;

/** DEMO mode: no database — the in-memory repository backs every read/write. */
export const DEMO_MODE = !env.supabaseConfigured;

export const publicEnv = {
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  siteName: env.NEXT_PUBLIC_SITE_NAME,
  whatsappNumber: isReal(raw.NEXT_PUBLIC_WHATSAPP_NUMBER)
    ? raw.NEXT_PUBLIC_WHATSAPP_NUMBER!.replace(/[^\d]/g, "")
    : undefined,
  ga4Id: env.analyticsConfigured ? env.NEXT_PUBLIC_GA4_ID : undefined,
  gscVerification: isReal(raw.NEXT_PUBLIC_GSC_VERIFICATION)
    ? raw.NEXT_PUBLIC_GSC_VERIFICATION
    : undefined,
  sentryDsn: isReal(raw.NEXT_PUBLIC_SENTRY_DSN) ? raw.NEXT_PUBLIC_SENTRY_DSN : undefined,
  stripePublishableKey: env.stripeConfigured ? env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : undefined,
} as const;
