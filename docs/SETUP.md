# Setup — connecting the real services

The platform runs fully in **DEMO mode** with `.env.example` copied verbatim to
`.env.local`. This guide switches each integration to real infrastructure. Do
them in any order; each is independent.

---

## 1. Supabase (database + admin auth)

1. Create a project at supabase.com.
2. **Project Settings → API** — copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server only)
3. Apply the schema. With the Supabase CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # applies supabase/migrations/*
   ```
   Or paste each file in `supabase/migrations/` into the SQL editor in order.
4. The seed migration creates both properties with the UUIDs the app expects.
5. Restart `npm run dev`. DEMO mode turns off automatically; availability, holds
   and reservations now persist in Postgres. Overlap prevention is enforced by a
   Postgres exclusion constraint + trigger, not just app code.

## 2. Stripe (payments)

1. Get **test** keys from dashboard.stripe.com (`sk_test_…`, `pk_test_…`):
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Webhook secret — local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   copy the `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
   Production: create an endpoint for `https://<domain>/api/webhooks/stripe`
   listening to `checkout.session.completed`, `payment_intent.succeeded`,
   `payment_intent.payment_failed`, `checkout.session.expired`.
3. Once configured, the demo simulator (`/reserva/simular`) is disabled and the
   real Stripe Checkout redirect is used. A reservation is **only** confirmed by
   the signed webhook, never by the success URL.
4. Go live: swap in `sk_live_…` / `pk_live_…` and the live webhook secret.

## 3. Resend (email)

1. Create an API key at resend.com → `RESEND_API_KEY`.
2. Verify your sending domain, then set `EMAIL_FROM` (e.g.
   `Praetoria Vacacional <reservas@tudominio.com>`) and `EMAIL_REPLY_TO`.
3. Until configured, confirmation emails are logged to the server console and the
   reservation still completes (email failure never blocks a booking).

## 4. Admin panel

- `ADMIN_PASSWORD` — required to sign in at `/admin`.
- `ADMIN_SESSION_SECRET` — long random string signing the session cookie.
- `ADMIN_EMAILS` — reserved for the optional Supabase-Auth-backed admin; also
  used as the actor on the audit log (`/admin/actividad`).
- `ADMIN_ROLE` — `admin` (default) / `gestion` / `lectura`. The single login's
  role; `gestion` cannot change configuration, `lectura` cannot write. The
  capability matrix is ready for a future multi-user system (issue #56 §10).

The full management intranet (reservations, CRM, invoicing + PDF, operational
calendar + pricing, marketing, roles, audit log) lives under `/admin` — see
`docs/intranet.md`. Its migrations are `supabase/migrations/2026083*.sql`.

## 5. iCal channel sync (Booking.com + Airbnb)

1. `ICAL_EXPORT_TOKEN` — long random string. Guards the export feeds and the
   import/cron endpoints.
2. In `/admin/sincronizacion`, paste each property's Booking.com **and/or**
   Airbnb calendar-export URL (or set `icalImportUrls[].url` in
   `src/content/properties/<slug>.ts`).
3. In Booking.com → Calendar → Sync calendars (and Airbnb → Calendar → Import),
   subscribe to `https://<domain>/api/ical/<slug>.ics?token=<ICAL_EXPORT_TOKEN>`.
4. Schedule the import: `vercel.json` runs `GET /api/ical/import` on a cron;
   or call it manually with `Authorization: Bearer <ICAL_EXPORT_TOKEN>`.
   Each import also mirrors the imported bookings as internal `external`
   reservation records (visible in Reservas + calendar).

### Campaign sending

The marketing module (segments, CSV export, campaign preparation, consent +
unsubscribe) is fully built; **bulk email/WhatsApp sending is not wired** — it
stays "Aún no configurado" (`/admin/configuracion` → `campaigns`). Choose a
provider (e.g. Resend Broadcasts) and wire `markCampaignSent` when ready.

## 6. Analytics (optional)

- `NEXT_PUBLIC_GA4_ID` — GA4 measurement id. Consent defaults to denied; wire a
  CMP before enabling analytics storage. No PII is ever sent.

## 7. Content

Property photos and content are **already real** (extracted from the owner's
Booking listings — see `photo-manifest.json`). Re-run
`node scripts/fetch-property-photos.mjs` if Booking rotates the signed image URLs.
Still to fill by the owner: the `operator` block in `src/content/legal.ts`
(company name / NIF / registered address) — the tourist-registry numbers are
already in.

## 8. Health & monitoring (issue #42)

- `GET /api/health` — JSON status (200 healthy, 503 if the DB is unreachable).
  Shows `demoMode`, per-integration state and the deployed commit. No secrets.
  Point an uptime monitor (UptimeRobot, Betterstack, Vercel Monitoring) at it.
- On server start the app logs a config banner and, in production without
  Supabase, a loud warning — check Vercel → Runtime Logs after each deploy.
- `/admin/configuracion` is the operator-facing view of the same status.
- `/admin/pagos` shows every payment (with Stripe ids/status) and every
  transactional email attempt (`sent` / `failed` / `skipped`).

## 9. Backups & recovery (Supabase)

- Supabase **Pro** plan: daily automated backups + Point-in-Time Recovery.
  Confirm the plan and retention in Database → Backups.
- **Restore**: Supabase dashboard → Database → Backups → Restore (or download a
  backup and `pg_restore` into a fresh project). Run one restore drill into a
  scratch project so the procedure is known before it's needed.
- The app holds no other durable state: uploaded property photos live in the
  repo (`public/images/properties/`), env vars in Vercel.

## Production env checklist

Set in the Vercel project: everything in `.env.example` with real values, plus
`NEXT_PUBLIC_SITE_URL=https://<domain>`. Then work through
`docs/launch-checklist.md` — both properties, end to end, on a phone.
