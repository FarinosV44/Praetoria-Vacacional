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

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

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

  // iCal sync — token that authenticates our public export feeds
  ICAL_EXPORT_TOKEN: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA4_ID: z.string().optional(),

  // Reservation hold window (minutes) while the guest pays
  RESERVATION_HOLD_MINUTES: z.coerce.number().int().positive().default(30),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Shape errors are real misconfiguration (e.g. a malformed URL) — fail loudly.
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const raw = parsed.data;

export const env = {
  ...raw,
  supabaseConfigured:
    isReal(raw.NEXT_PUBLIC_SUPABASE_URL) &&
    isReal(raw.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    isReal(raw.SUPABASE_SERVICE_ROLE_KEY),
  stripeConfigured: isReal(raw.STRIPE_SECRET_KEY) && isReal(raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  stripeWebhookConfigured: isReal(raw.STRIPE_WEBHOOK_SECRET),
  emailConfigured: isReal(raw.RESEND_API_KEY),
  icalExportConfigured: isReal(raw.ICAL_EXPORT_TOKEN),
  adminConfigured: isReal(raw.ADMIN_PASSWORD),
  analyticsConfigured: isReal(raw.NEXT_PUBLIC_GA4_ID),
  adminEmails: raw.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
} as const;

/** DEMO mode: no database — the in-memory repository backs every read/write. */
export const DEMO_MODE = !env.supabaseConfigured;

export const publicEnv = {
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  siteName: env.NEXT_PUBLIC_SITE_NAME,
  ga4Id: env.analyticsConfigured ? env.NEXT_PUBLIC_GA4_ID : undefined,
  stripePublishableKey: env.stripeConfigured ? env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : undefined,
} as const;
