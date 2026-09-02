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

  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_NAME: z.string().default("Praetoria Vacacional"),

  // Supabase — both the legacy (JWT anon / service_role) and the new
  // (sb_publishable_… / sb_secret_…) key names are accepted; whichever is set
  // wins. The `@supabase/supabase-js` client treats them interchangeably.
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

// Resolve the Supabase keys once, preferring the new sb_publishable_/sb_secret_
// names and falling back to the legacy anon/service_role names.
const supabaseUrl = isReal(raw.NEXT_PUBLIC_SUPABASE_URL) ? raw.NEXT_PUBLIC_SUPABASE_URL : undefined;
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
  /** URL of the Supabase project (or undefined in DEMO mode). */
  supabaseUrl,
  /** Publishable / anon key — RLS-gated, safe on the client. */
  supabasePublishableKey,
  /** Secret / service-role key — bypasses RLS, server-only. */
  supabaseSecretKey,
  supabaseConfigured: !!supabaseUrl && !!supabasePublishableKey && !!supabaseSecretKey,
  stripeConfigured: isReal(raw.STRIPE_SECRET_KEY) && isReal(raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  stripeWebhookConfigured: isReal(raw.STRIPE_WEBHOOK_SECRET),
  emailConfigured: isReal(raw.RESEND_API_KEY),
  icalExportConfigured: isReal(raw.ICAL_EXPORT_TOKEN),
  CRON_SECRET: isReal(raw.CRON_SECRET) ? raw.CRON_SECRET : undefined,
  adminConfigured: isReal(raw.ADMIN_PASSWORD),
  analyticsConfigured: isReal(raw.NEXT_PUBLIC_GA4_ID),
  observabilityConfigured: isReal(raw.SENTRY_DSN),
  rateLimitRedisUrl,
  rateLimitRedisToken,
  rateLimitDistributed: !!rateLimitRedisUrl && !!rateLimitRedisToken,
  whatsappConfigured: isReal(raw.NEXT_PUBLIC_WHATSAPP_NUMBER),
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
