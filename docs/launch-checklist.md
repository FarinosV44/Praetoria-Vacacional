# GO-LIVE — Praetoria Vacacional

**Goal:** a person on their phone picks either apartment, checks real
availability, sees the total price, pays, gets a confirmation, and the dates are
blocked — with no technical intervention.

Everything that can be done without your credentials is done. What is left is
below: it is **all account setup and configuration in your own panels.** No more
code changes are needed to launch.

Hosting target: **Hostinger** (Node.js app, `npm run build` then `npm run
start`, Node ≥ 20). `vercel.json` is ignored on Hostinger — its cron jobs must be
recreated as OS/scheduler cron (step 5).

---

## 1 · Pending database migrations (`supabase db push`)

The production Supabase project has **never** had migrations applied (the site
runs in DEMO mode today). So **all 17** migrations in `supabase/migrations/` are
pending and apply in order:

```
20260827090000_init                       20260829120000_invoicing
20260827091000_booking_rpc                20260829130000_daily_rates
20260827092000_seed_properties            20260829140000_marketing
20260827093000_production                 20260830090000_channel_feeds
20260827094000_coupons                    20260831120000_availability_rpc
20260827160000_content_overrides          20260831130000_rls_hardening
20260828120000_coupon_10praetoria10       20260901120000_jobs
20260829100000_intranet_crm               20260902120000_guest_comms
20260829110000_reservation_external_status
```

`supabase db push` reads `supabase_migrations.schema_migrations` and applies only
what is missing — on a fresh project that is all 17. It is safe to re-run; every
migration is idempotent or tracked. (Or paste `supabase/apply-all-migrations.sql`
into the SQL Editor.)

**Verify after push:**

```sql
select proname from pg_proc where proname in ('property_busy_ranges','is_stay_available');  -- 2 rows
select count(*) from properties;   -- 2  (Javalambre, Valencia — no demo data)
select relname, relrowsecurity, relforcerowsecurity from pg_class
  where relname = 'content_overrides';   -- rowsecurity = t, forcerowsecurity = t
```

Then run the SQL test files (they roll back / write nothing):

```
psql "$SUPABASE_DB_URL" -f supabase/tests/property_busy_ranges.test.sql   # → ALL ASSERTIONS PASSED
psql "$SUPABASE_DB_URL" -f supabase/tests/rls_hardening.test.sql          # → RLS HARDENING — ALL ASSERTIONS PASSED
```

---

## 2 · Environment variables

Set these in the **Hostinger** panel (Node app → Environment variables), except
where noted. `NEXT_PUBLIC_*` are compiled into the client bundle, so a **rebuild
is required** after changing any of them.

Status legend: **SET** = a real value already exists somewhere · **MISSING** =
you must add it · **OPTIONAL** = launch works without it.

> I cannot read your Hostinger panel. Production runs in DEMO mode today, which
> proves that on Hostinger **none** of Supabase / Stripe / Resend / CRON_SECRET
> hold real values yet. Your local `.env.local` (dev only — not deployed) has
> `ICAL_EXPORT_TOKEN` and `ADMIN_PASSWORD`. Treat the whole table as MISSING on
> production and tick each row as you add it.

### 2a · Hostinger / production (site)

| Variable | Status | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | MISSING | `https://<your-domain>` — no trailing slash. Used for canonical URLs, sitemap, OG tags, Stripe return URLs. |
| `NEXT_PUBLIC_SITE_NAME` | OPTIONAL | defaults to `Praetoria Vacacional`. |
| `NODE_ENV` | — | Hostinger sets `production` for a built app. Confirm it is `production` (fail-closed and secure cookies depend on it). |
| `PRODUCTION_STRICT` | MISSING | see §3 — set to `true` for launch. |
| `RESERVATION_HOLD_MINUTES` | OPTIONAL | defaults to `30`. |
| `ADMIN_PASSWORD` | MISSING | long random string — the /admin login password. |
| `ADMIN_SESSION_SECRET` | MISSING | a **different** long random string — signs the admin cookie. Recommended even though the panel works with only `ADMIN_PASSWORD`. |
| `ADMIN_EMAILS` | MISSING | your email(s), comma-separated. First entry receives the "nueva reserva" internal notice. |
| `ADMIN_ROLE` | OPTIONAL | defaults to `admin`. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | OPTIONAL | E.164 digits only, e.g. `34600111222`. Empty → the WhatsApp button does not render. |
| `NEXT_PUBLIC_GA4_ID` | OPTIONAL | GA4 measurement id. Empty → no analytics scripts load. |
| `NEXT_PUBLIC_GSC_VERIFICATION` | OPTIONAL | Search Console HTML-tag token. |

### 2b · Supabase (database)

| Variable | Status | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | MISSING | Project Settings → API → Project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | MISSING | the new `sb_publishable_…` key. (Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also accepted — set one.) |
| `SUPABASE_SECRET_KEY` | MISSING | the new `sb_secret_…` key — server-only, bypasses RLS. (Legacy `SUPABASE_SERVICE_ROLE_KEY` also accepted — set one.) |

All three must be present or the app stays in DEMO mode.

### 2c · Stripe (payments)

| Variable | Status | Value |
|---|---|---|
| `STRIPE_SECRET_KEY` | MISSING | `sk_test_…` for the test pass, then `sk_live_…`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | MISSING | `pk_test_…` then `pk_live_…`. |
| `STRIPE_WEBHOOK_SECRET` | MISSING | `whsec_…` from the webhook endpoint you create at `https://<domain>/api/webhooks/stripe` (events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired`). Use the `stripe listen` secret for the test pass, the live endpoint secret for go-live. |

Until all three are set, the pay step uses the **demo simulator** (no charge).
`PRODUCTION_STRICT=true` blocks boot until they are set, which is the point.

### 2d · Cron / internal auth

| Variable | Status | Value |
|---|---|---|
| `CRON_SECRET` | MISSING | long random string. Guards `/api/cron/jobs`, `/api/cron/comms`, `/api/cron/expire-holds` and `/api/ical/import`. Without it, in production those endpoints return **503** (they never run) — the durable job queue then only advances opportunistically on each confirmed booking, and scheduled guest messages (#69) are never sent. |

### 2e · iCal / Booking sync

| Variable | Status | Value |
|---|---|---|
| `ICAL_EXPORT_TOKEN` | MISSING on prod (exists in local `.env.local`) | long random string. Guards the export feeds Booking/Airbnb subscribe to. Without it the export feed returns 403. |
| `ICAL_IMPORT_VALENCIA_BOOKING` | OPTIONAL | Booking iCal **import** URL for Valencia. Preferred: paste it in `/admin/sincronizacion` (persists in the DB). This env var is the durable fallback if you are not using the admin screen. |
| `ICAL_IMPORT_JAVALAMBRE_BOOKING` | OPTIONAL | same, for Javalambre. |
| `ICAL_IMPORT_<SLUG>_AIRBNB` | OPTIONAL | only if you also list on Airbnb. |

### 2f · Email (Resend) — optional for launch, strongly recommended

| Variable | Status | Value |
|---|---|---|
| `RESEND_API_KEY` | MISSING | Resend → API Keys. |
| `EMAIL_FROM` | MISSING | e.g. `Praetoria Vacacional <reservas@tudominio.com>` — the domain must be verified in Resend. |
| `EMAIL_REPLY_TO` | OPTIONAL | e.g. `hola@tudominio.com`. |

If Resend is not configured, **a booking still completes and is confirmed** — the
guest just doesn't get an automatic email; every attempt is logged in
`/admin/pagos`. Configure it before real guests book.

---

## 3 · `PRODUCTION_STRICT` — the decision

**What it does.** When `NODE_ENV=production` **and** `PRODUCTION_STRICT` is
`true`/`1`, the server **refuses to start** if any of these is missing:

- Supabase (would run in DEMO mode — data not persisted)
- Stripe keys (would use the free demo simulator)
- `STRIPE_WEBHOOK_SECRET` (reservations would not auto-confirm)
- `CRON_SECRET` (scheduled tasks unprotected)
- an admin secret (`ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET`)

When it is unset/`false`, the server boots "degraded" — useful for a staging
deploy, dangerous for the real site.

**Recommendation: `PRODUCTION_STRICT=true` for the live site.** It is the single
switch that makes it impossible to accidentally serve the DEMO simulator, an
in-memory database, or an unconfirmed booking to a real guest.

**Order:** add every variable in §2b–2d first, deploy, confirm the site works,
**then** set `PRODUCTION_STRICT=true` and redeploy. If you set it first, the
build will boot-loop with a clear error listing what is missing (that is the
intended behaviour, just not the easiest way to debug).

---

## 4 · Fail-open / DEMO / mock audit — result

Checked every degraded path. With `PRODUCTION_STRICT=true` **none can occur in
production**; each is also individually fail-closed once its integration is set:

| Path | Behaviour |
|---|---|
| Payment simulator (`/reserva/simular`, `/api/checkout/simulate`) | Page redirects to `/` and the API returns **403** the moment Stripe is configured. `beginPayment` only routes there when Stripe is unset. |
| In-memory (DEMO) repository | Used only when Supabase is unconfigured. `PRODUCTION_STRICT` blocks that boot. |
| Stripe webhook | **503** if `STRIPE_WEBHOOK_SECRET` unset; **400** on missing/invalid signature; idempotent; a reservation is confirmed **only** here, never from the success URL. |
| Cron endpoints (`/api/cron/jobs`, `/api/cron/comms`, `expire-holds`, `/api/ical/import`) | `requireServiceAuth`: **503** in production without `CRON_SECRET`, **401** on a wrong bearer. The `x-vercel-cron` header is accepted **only outside production**. |
| iCal export feed | **403** without a matching `ICAL_EXPORT_TOKEN` (constant-time compare). |
| Admin login | `verifyPassword` returns false without `ADMIN_PASSWORD`; no session can be minted. HMAC-signed, 8 h, `Secure`+`HttpOnly` in production. |
| Email failure | By design never blocks a booking; logged to `/admin/pagos`. Not a security fail-open. |
| Rate limiting | In-memory, per process. Fine for a single Hostinger Node process. Distributed limiting (#62) is only needed on multi-instance serverless — not this deploy. |

No `TODO`, mock, or hard-coded credential remains on a runtime path.

---

## 5 · Your manual checklist to deploy

### A · Supabase
- [ ] Create the production project. Copy URL + publishable + secret keys.
- [ ] `supabase link` to it, then `supabase db push` (applies the 17 migrations).
- [ ] Run the two verify queries and the two `supabase/tests/*.sql` files (§1).
- [ ] Database → Backups: confirm the plan's backup/PITR retention; do one test restore into a scratch project.
- [ ] Add the 3 Supabase vars to Hostinger (§2b).

### B · Stripe (test first)
- [ ] Test keys + `stripe listen --forward-to https://<domain>/api/webhooks/stripe` → copy `whsec_…`. Add the 3 Stripe vars.
- [ ] Deploy. Book **Javalambre** end to end on a phone: pay with `4242…`, land on `/reserva/exito`, reservation shows `confirmed` in `/admin/reservas`, `payments` row `succeeded`, dates blocked on the public calendar.
- [ ] Repeat for **Valencia Frente al Mar**.
- [ ] Fail a payment (`4000 0000 0000 0002`) → reservation stays `pending`, then `expired` after 30 min once the `expire-holds` cron runs.
- [ ] Refresh/back mid-checkout → no duplicate hold or charge.
- [ ] Replay a webhook (`stripe … resend`) → no double confirmation.
- [ ] **Go live:** swap to `sk_live_…` / `pk_live_…`, create the live webhook endpoint (same 4 events), set `STRIPE_WEBHOOK_SECRET` to its signing secret. Note the switch date in `docs/decisions.md`.

### C · Email (Resend)
- [ ] Verify the sending domain in Resend. Set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ADMIN_EMAILS`.
- [ ] A confirmed test booking → guest gets the branded confirmation, you get the internal notice, both `sent` in `/admin/pagos` → Emails.
- [ ] Break the key once → booking still completes, row shows `failed`, reservation still `confirmed`. Restore the key.

### D · Booking / iCal
- [ ] Set `ICAL_EXPORT_TOKEN` (long random).
- [ ] `/admin/sincronizacion`: paste each apartment's Booking.com iCal **export** URL; "Sincronizar ahora" runs clean, `Última sincronización` updates.
- [ ] In Booking.com, subscribe each property to `https://<domain>/api/ical/<slug>/<ICAL_EXPORT_TOKEN>.ics` (slug = `javalambre` / `valencia`).
- [ ] Make a test block in Booking on Javalambre → after the next import it shows only on Javalambre. Re-import → no duplicates.

### E · Cron (Hostinger has no Vercel Cron)
- [ ] Create four scheduled jobs (Hostinger cron, cron-job.org, or a systemd timer):
  - every 2 min: `curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/jobs`
  - every 5 min: `curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/expire-holds`
  - every 15 min: `curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/comms`
  - every 3 h: `curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/ical/import`
- [ ] Confirm each returns `200` (a `401`/`503` means the header or `CRON_SECRET` is wrong).
- [ ] `/admin/procesos` shows an empty or all-`Completado` queue; no `Fallido (atascado)` rows.

### F · Site / admin / SEO
- [ ] `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_EMAILS` set. Optionally `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`.
- [ ] `git pull` on the server, `npm ci`, `npm run build`, restart the Node process (`NEXT_PUBLIC_*` are baked at build time — always rebuild after changing them).
- [ ] `GET https://<domain>/api/health` → `200`, `demoMode: false`, `checks.repository: "ok"`, `integrations.payments: "configured"`.
- [ ] Runtime log shows the config banner with **no `⚠ ERROR`** and no DEMO warning.
- [ ] `/admin` redirects to `/admin/login`; login works; cookie is `Secure`+`HttpOnly`.
- [ ] Edit a price in `/admin/precios` → it changes on the public property page and in checkout immediately.
- [ ] `sitemap.xml` + `robots.txt` correct on the real domain; `/admin`, `/reservar`, `/reserva`, `/api` are `noindex`.
- [ ] Google Rich Results Test passes for `/`, `/javalambre`, `/valencia` (Organization, WebSite, VacationRental, BreadcrumbList, FAQPage).
- [ ] Lighthouse mobile on `/`, `/javalambre`, `/valencia`, one landing, one guía: SEO ≥ 95, Accessibility ≥ 90, Performance ≥ 90 where reasonable.
- [ ] Verify the property in Search Console, submit the sitemap.

### G · Flip the switch
- [ ] With A–F green, set `PRODUCTION_STRICT=true`, rebuild, restart.
- [ ] `GET /api/health` still `200` / `demoMode: false`.
- [ ] Final: one real (small) live booking on each apartment, refunded from the Stripe dashboard afterwards.

When every box is ticked, close **#42** and **#22** on the forge.

---

## Deferred — genuinely not needed for direct-booking to work

`#62` distributed rate limiting (needs a KV provider — only for multi-instance
serverless), `#76` durable jobs/outbox, `#78` Lighthouse CI (needs the deployed
URL). `#65–#85` product items (guest portal, comms automation, housekeeping,
SES.HOSPEDAJES, marketing provider, revenue management, GDPR ops tooling, media
library, full i18n) each require a vendor, credentials, a legal decision or a
translation budget and are blocked on those — not on code.
