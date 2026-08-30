# Launch checklist — Praetoria Vacacional (issue #42)

`market-ready` = a person on their phone can pick either property, check real
availability, see the total price, pay, get confirmation, and have the dates
blocked — with no technical intervention.

A missing external credential may leave a service `not_configured` (shown in
`/admin/configuracion`); it must never mean missing code.

---

## 0 · Infra

- [ ] Vercel project created, connected to `main`.
- [ ] Custom domain + HTTPS active; `NEXT_PUBLIC_SITE_URL=https://<domain>`.
- [ ] All env vars from `.env.example` set in Vercel (Production + Preview).
- [ ] `GET /api/health` returns `200` with `demoMode: false`, `checks.repository: "ok"`.
- [ ] Boot log (Vercel → Runtime Logs) shows the config banner with no `⚠ ERROR`.
- [ ] `vercel.json` cron jobs active: `expire-holds` (5 min), `ical/import` (3 h).

## 1 · Database (Supabase)

- [ ] Production project; `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `_ANON_KEY`) and
      `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) set.
- [ ] `supabase db push` applied **every** migration in `supabase/migrations/`
      (through `20260831120000_availability_rpc`). Verify:
      `select proname from pg_proc where proname = 'property_busy_ranges';`
      returns a row, `properties` has 2 rows.
- [ ] `supabase db execute --file supabase/tests/property_busy_ranges.test.sql`
      prints `ALL ASSERTIONS PASSED`.
- [ ] Overlap protection verified: try to insert two overlapping `pending`
      reservations for one property → the second is rejected
      (`reservations_no_overlap`).
- [ ] No demo/seed reservations visible. `seed_properties.sql` only inserts the
      two real properties + empty `calendar_syncs` rows.
- [ ] **Backups**: Supabase → Database → Backups. On the Pro plan daily backups +
      PITR are automatic — confirm the plan and the retention. Document the
      restore procedure with the team (Supabase dashboard → Restore, or
      `pg_restore` from a downloaded backup). Test a restore into a scratch project once.

## 2 · Stripe

- [ ] **Test first**: `sk_test_… / pk_test_…`, `stripe listen` → `whsec_…`.
  - [ ] Complete a real test booking for **Javalambre** end to end.
  - [ ] Complete a real test booking for **Valencia Frente al Mar** end to end.
  - [ ] Webhook received (`checkout.session.completed`), reservation `confirmed`,
        dates blocked, `payments` row `succeeded` with the payment-intent id.
  - [ ] Refresh / back during checkout does **not** create duplicate holds or charges.
  - [ ] Fail a payment (`4000000000000002`) → reservation stays `pending`, then
        `expired` after the hold window; `expire-holds` cron frees it.
  - [ ] Replay a webhook (Stripe CLI `--resend`) → no double confirmation.
- [ ] **Go live**: swap to `sk_live_… / pk_live_…`, create the live webhook
      endpoint (`/api/webhooks/stripe`, same 4 events), set `STRIPE_WEBHOOK_SECRET`
      to the live signing secret. Record the switch date in `docs/decisions.md`.

## 3 · Emails (Resend)

- [ ] `RESEND_API_KEY` set; sending domain verified; `EMAIL_FROM` / `EMAIL_REPLY_TO` set.
- [ ] `ADMIN_EMAILS` set (first entry receives the internal "nueva reserva" notice).
- [ ] Confirmed test booking → guest gets the branded confirmation; operator gets
      the internal notice; both rows appear `sent` in `/admin/pagos` → Emails.
- [ ] Temporarily break the API key → booking still completes, email row shows
      `failed`, reservation stays `confirmed`.

## 4 · Booking / iCal

- [ ] `ICAL_EXPORT_TOKEN` set (long random).
- [ ] In `/admin/sincronizacion`, paste each property's Booking.com iCal export
      URL; "Sincronizar ahora" runs without error and `Última ejecución` updates.
- [ ] In Booking.com, subscribe each property to
      `https://<domain>/api/ical/<slug>/<ICAL_EXPORT_TOKEN>.ics`
- [ ] A block from Booking on Javalambre appears only on Javalambre; same for Valencia.
- [ ] Re-run the import → no duplicated events (dedupe by property+source+uid).
- [ ] Not configured → the row shows "Aún no configurado", the feature stays present.

## 5 · Admin

- [ ] `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` set (production only, never committed).
- [ ] `/admin` redirects to `/admin/login` when logged out; login works; cookie is
      `Secure` + `HttpOnly` in production.
- [ ] Reservations, Pagos y emails, Calendario/bloqueos, Precios, Sincronización,
      SEO and Configuración all load and show real data.
- [ ] Editing a price in `/admin/precios` changes the price shown on the public
      property page and in checkout immediately.
- [ ] Cancelling a reservation / deleting a block asks for confirmation and frees
      the dates on the public site.

## 6 · SEO & performance

- [ ] `sitemap.xml` + `robots.txt` correct on the real domain; `noindex` on
      `/admin`, `/reservar`, `/reserva`, `/api`.
- [ ] Rich Results Test passes for the home + both property pages (Organization,
      WebSite, VacationRental, BreadcrumbList, FAQPage).
- [ ] `hreflang` ES↔EN correct on `/`, `/javalambre`, `/valencia`.
- [ ] Lighthouse (mobile) on `/`, `/javalambre`, `/valencia`, one landing, one
      guide: **SEO ≥ 95**, **Accessibility ≥ 90**, **Performance ≥ 90** where
      reasonable. Record scores in `docs/seo/pre-launch-audit.md`; fix regressions.
- [ ] `NEXT_PUBLIC_GSC_VERIFICATION` set; property verified in Search Console;
      sitemap submitted.
- [ ] No critical console errors on the deployed site; no secret-shaped strings
      in the JS bundle (guarded by `e2e/production.spec.ts`).

## 7 · Security

- [ ] CSP + `X-Frame-Options: DENY` + HSTS present (checked by e2e).
- [ ] Rate limiting active on the public POST routes.
- [ ] All critical inputs validated server-side (Zod).
- [ ] `/admin` protected server-side (middleware + layout `requireAdmin`).
- [ ] Stripe webhook signature verified; unsigned/malformed → 400.

---

## Final gate (both properties)

| Step | Javalambre | Valencia |
|---|---|---|
| Public page with real photos & copy | ☐ | ☐ |
| Real, configurable price | ☐ | ☐ |
| Real availability | ☐ | ☐ |
| Test booking completed on mobile | ☐ | ☐ |
| Stripe payment (test then live) | ☐ | ☐ |
| Webhook received, reservation confirmed | ☐ | ☐ |
| Dates blocked automatically | ☐ | ☐ |
| Guest email sent (or failure visible in admin) | ☐ | ☐ |
| Internal notification received | ☐ | ☐ |
| Reservation visible in `/admin` | ☐ | ☐ |
| Booking/iCal block reflected | ☐ | ☐ |

When every box is ticked, close **#42** and **#22**.
