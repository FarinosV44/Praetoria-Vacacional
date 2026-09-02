# Decisions — Praetoria Vacacional

Append-only. The assistant never re-opens a decision on its own; an explicit user request
that contradicts one supersedes it as a new entry.

---

## D-001 — Stack
**Date:** 2026-08-27
Next.js 15 App Router + TypeScript + Tailwind v4 + Supabase (Postgres/Auth) + Stripe + Resend, deploy Vercel.
Chosen by the user in the build brief. Server-side validation everywhere; secrets never reach the client bundle.

## D-002 — The 33 issues are the functional spec
**Date:** 2026-08-27
We do not run Keel Phases 1–3 as separate ceremony. The GitHub issues define flows, scope
and acceptance criteria. Keel's cross-cutting discipline still applies in full (state files,
git flow, confidential-data gate, `web-app` security profile, accessibility, test-first for
pure logic, public-surface docs). Sprints map to issue clusters (see PROGRESS.md).
**Why:** the spec already exists and is detailed; re-deriving it would burn the budget without adding value.

## D-003 — External services on placeholder keys
**Date:** 2026-08-27 · user choice (batched setup question)
Supabase / Stripe / Resend are wired through a typed env layer. `.env.example` ships
example values; `docs/SETUP.md` is the step-by-step. The app builds, runs and the flows are
exercised with local/test doubles where possible. Live payment + email delivery is marked
`VERIFY` until real keys are added.
**Why:** user does not have the accounts provisioned yet and asked to keep building.

## D-004 — Property content is configurable placeholder data
**Date:** 2026-08-27 · user choice (batched setup question)
Each property = a DB row + a content config file in `src/content/properties/<slug>.ts`.
Placeholder text is clearly marked (`PLACEHOLDER:` prefix in copy fields is avoided in
production rendering by a `contentStatus` flag). No invented amenity, review, rating,
distance or legal fact is ever rendered as real. Reviews block renders empty-safe.
**Why:** the real Booking listings/photos were not provided; user asked to keep building.

## D-005 — Auth: admin only (no guest accounts)
**Date:** 2026-08-27
Issue #23 requires "no registration to book". Guests never authenticate. Supabase Auth is
used exclusively for the admin panel (email+password, single admin role to start, RLS-guarded).
Public booking data is written only through server actions / route handlers using the
service role key, never from the browser.

## D-006 — Money handling
**Date:** 2026-08-27
All money stored and computed as integer cents (`bigint`/`number` of cents), currency EUR.
Pricing is computed and re-validated server-side on every quote and again at checkout and
again in the Stripe webhook. The browser never supplies a price.

## D-008 — Issue #53: brand repositioning "Del Mediterráneo a la nieve, desde Valencia"
**Date:** 2026-08-28 · user choice (batched question on issue #53)
Issue #53 reframes the two properties as one year-round Valencia story (sea + city +
snow) and corrects two location facts the owner supplied as real:
- **Valencia Frente al Mar** is marketed as **playa de la Llastra** (entre Les Palmeres
  y El Perelló, litoral sur de Valencia, municipio de Sueca), **a pie de playa (~5 m de
  la arena)** with **frontal sea views**. "Mareny de Barraquetes" and "Les Palmeretes"
  are removed from all commercial copy.
- **Javalambre**: the drive to the slopes is **~10 min**, not ~20 min — corrected in
  every surface (copy, metadata, JSON-LD via `headlineDistance`/`nearby`, FAQs, photo
  alt text, and the paraphrased Booking review that stated "20 min").
**Scope chosen by the user:** *copy only* — geo coordinates, street address, postal
code and the legal tourist-registry line (`legal.ts`, which legally references Sueca /
Mareny de Barraquetes) are **kept unchanged**. `location.city` stays "Mareny de
Barraquetes" as structured data only: it now feeds JSON-LD `addressLocality` but is no
longer rendered — `PropertyPageView`/`PropertyCard` show `location.area · region`
instead, and `location.area` becomes the positioning label ("playa de la Llastra" /
"Camarena de la Sierra"). New editorial cluster pages proposed in the issue are
**deferred** to a follow-up (avoid thin content).
**Why:** the owner authored the corrected facts; without verified new coordinates/
address we do not invent structured location data (cf. D-004).

## D-007 — Availability source of truth
**Date:** 2026-08-27
`reservations` (status in confirmed/pending-not-expired) + `availability_blocks` together
define occupancy per property. Overlap prevention enforced in Postgres with an exclusion
constraint on a `daterange` (GiST), not only in application code. iCal imports land as
`availability_blocks` with `source='booking'`.

## D-009 — Issue #56: legal data + management intranet (epic)
**Date:** 2026-08-29 · user choice (batched questions on issue #56)
Issue #56 is worked as an epic split into sprints on `develop`; `develop → main`
merge happens only when the full `reserva → cliente → factura → PDF → calendario →
historial → segmento marketing` chain works end to end and persists correctly
(DEMO/in-memory + production migrations ready).
- **Part A (legal):** PRAETORIA, S.L. corporate data centralised in
  `src/content/company.ts` (single source). `legal.ts`, footer, contact page,
  Organization JSON-LD and transactional-email footer all read from it. The four
  legal docs stay separate (aviso-legal / privacidad / cookies / condiciones-reserva).
  Tourist-registry licence lines and property geo/address are unchanged (cf. D-008).
- **Invoice PDF model:** no owner PDF was provided → we build a clean, professional
  per-property invoice layout following the structure described in the issue
  (Javalambre / Valencia branding, emisor PRAETORIA S.L., descripción/cantidad/
  precio/coste table, total, configurable IVA-exemption text art. 20.Uno.23º LIVA).
  Owner refines visuals later.
- **Email campaigns:** the marketing module (segments, saved lists, CSV export of
  emails/phones/WhatsApp, campaign + promo-code scaffolding, consent + unsubscribe)
  is fully implemented; real bulk sending stays in `Aún no configurado` state with
  a double-confirmation step, to prevent accidental mass sends.

## D-010 — Issue #56: invoice document = branded HTML + print-to-PDF
**Date:** 2026-08-29
The invoice "PDF" is a deterministic, per-property-branded HTML document rendered
server-side at `/admin/facturas/[id]/documento` (behind `requireAdmin`, so it also
satisfies §10 "protección contra acceso directo a PDFs privados"). It has full
`@media print` styling and a "Descargar / Imprimir" button that calls
`window.print()` — every browser's "Save as PDF" produces the file.
- **Immutability / "no regenerar silenciosamente":** once issued, the invoice
  row and its line items are frozen by DB triggers (`invoices_immutability_guard`,
  `invoice_items_immutability_guard`); the document renderer is pure, so it always
  produces the identical output from the frozen data. An error is corrected by
  **anular + emitir una nueva**, never by editing.
- Binary PDF archival to object storage (a stored `.pdf` file per invoice) needs
  a storage bucket — recorded as a future option, not built now. The frozen row +
  deterministic renderer are the "copia/registro de cada factura emitida".
- Tax logic is configurable per property in `invoice_settings` (rate, exempt
  flag, note) — default is exempt with the art. 20.Uno.23º LIVA text; nothing is
  hardcoded irreversibly.
**Why:** no owner PDF was provided (D-009); a headless-browser or `@react-pdf`
dependency is heavier and more fragile than print-CSS for a document the owner
will restyle anyway.

## D-011 — Channel iCal feed URL: config, stored apart from sync telemetry
**Date:** 2026-08-30 · bugfix
The Booking/Airbnb iCal import URL used to live in `calendar_syncs.feed_url` —
the same row `recordSyncRun()` upserts after every sync. Any run that did not
re-pass the URL (the "not configured" path especially, and any transient DB read
failure) overwrote it with `NULL`, so the admin fields went blank after a refresh
and the cron kept wiping it.
- New table **`channel_feeds` (property_id, channel) → url** (migration
  `20260830090000`) is the single, authoritative store for the URL. Backfilled
  from `calendar_syncs.feed_url`.
- `recordSyncRun()` (both repos) **no longer writes `feed_url`** — it is telemetry
  only. `calendar_syncs.feed_url` is now vestigial.
- `setImportFeedUrl()` does a **read-after-write verification** and throws a
  descriptive error on any failure; the server action maps it to a user-visible
  message. "Guardado" is shown only on a confirmed DB write (`{ ok: true }`).
- In DEMO mode a write that cannot be persisted (read-only serverless FS) throws
  `PersistenceUnavailableError` instead of faking success.
- `/admin/sincronizacion` shows per-property, per-channel status: configured /
  not configured / error + last run + last status/error + events imported.
- Verified end-to-end (`e2e/admin-ical-feeds.spec.ts` + a manual run with the
  owner's real Booking URLs: saved, survived a full reload, "Sincronizar ahora"
  imported 9 reservations from the persisted value and did not wipe it).
**Why:** configuration and runtime telemetry must never share a write path.

## D-012 — iCal export feed: maximal Booking.com compatibility
**Date:** 2026-08-30 · bugfix
Booking.com rejected the export URL as "not a valid iCal URL" though the browser
downloaded a working `.ics`. Fixes:
- **Clean tokenized path** `/api/ical/<slug>/<token>.ics` (no query string).
  Legacy `/api/ical/<slug>.ics?token=` still works.
- Response: **200 directly, no redirect**, `Content-Type: text/calendar;
  charset=utf-8`, explicit `Content-Length`, **no `Content-Disposition`** (an
  `attachment` made validators treat it as a file download, not a live feed).
- Body (`generateIcs`): starts `BEGIN:VCALENDAR`, ends `END:VCALENDAR\r\n`, CRLF
  throughout, **every line folded to ≤75 octets** (RFC 5545 §3.1), TEXT values
  escaped (§3.3.11), `VERSION:2.0` + short fixed `PRODID` + `CALSCALE` + VEVENTs
  with `UID@domain` / `DTSTAMP` / `DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE` /
  `SUMMARY` / `STATUS` / `TRANSP`. Dropped `METHOD:PUBLISH` (Booking's own
  exports omit it; some importers reject it).
- **Never empty:** a feed with no bookings still emits one inert VEVENT (a
  fixed year-2000 all-day marker). Booking rejects a VCALENDAR with zero VEVENT.
- Export telemetry (`recordSyncRun`) is `.catch()`-ed so it can never 500 the feed.
- `/admin/sincronizacion` shows the exact clean HTTPS URL per property to paste.
**Verified:** `e2e/ical-export.spec.ts` (200/no-redirect, headers, RFC checks,
403/404, legacy path) + a raw `curl` inspection. **Not** verified inside
Booking's own extranet — no access to the owner's Booking account; the owner
must add both URLs and confirm acceptance.

## D-013 — Issue #57: Valencia Frente al Mar capacity = 6 guests / 3 bedrooms
**Date:** 2026-08-30 · user clarification on issue #57
Issue #57 asked to correct Valencia's capacity to "6 plazas, mantener 2
habitaciones". Asked to confirm the bed layout, the owner clarified in
conversation: **"son 3 habitaciones, una con cama doble y dos con literas"** —
so it is **3 bedrooms**, not 2. This supersedes the "2 habitaciones" line in the
issue. Applied: `valencia.ts` `capacity.guests` 4 → **6**, `bedrooms` stays
**3**, `bedConfig` → "1 dormitorio con cama doble extragrande · 2 dormitorios
con literas". All ES + EN copy that said "hasta 4 personas" / "up to 4 people"
updated to 6 (property file highlights/sections/FAQ, `landings/index.ts` FAQ +
body). JSON-LD (`occupancy.maxValue`, `numberOfRooms`), the quick-facts table
and `BookingWidget maxGuests` all derive from `capacity.*` so they follow
automatically. Javalambre was already 6 / 2 everywhere — confirmed, no change.
Capacity is not persisted in the DB (`properties` has no capacity columns), so
this is a content-file change only.

## D-014 — Issue #57: blog architecture (KV-backed, in-house Markdown, no migration)
**Date:** 2026-08-30 · user request (issue #57)
The blog/Actualidad CMS stores each article as a `blog:post:<id>` document in
the existing `content_overrides` KV rather than a dedicated `blog_posts` table.
- **Why:** reuses the whole light-CMS persistence (memory + Supabase +
  DEMO-safe, issue #50), needs **no migration**, and therefore works on the
  current production deployment, which runs in DEMO mode with no Supabase
  (`/api/health` → `demoMode: true`). A vacation-rental blog is dozens of posts,
  not thousands — DB indexes/constraints are not needed. `src/domains/blog/store.ts`
  validates every document with zod on read and ignores malformed ones.
- **Markdown:** a small in-house renderer (`src/domains/blog/markdown.ts`) — a
  fixed subset (h2–h4, p, ul/ol/li, blockquote, a, strong, em, code, hr), every
  link URL validated (`safeHref`), all other HTML escaped. No `marked`/`remark`
  dependency added.
- **Featured images:** pasted as a URL (no upload pipeline). `img-src` in the
  CSP widened from `https://*.supabase.co` to `https:` so external images load;
  script/style/connect stay locked to the allow-list.
- **Public architecture:** `/blog` + `/blog/[slug]` (`dynamicParams`, SSG from
  published posts, ISR 1h). `/guias` stays the evergreen hub; the blog is dated
  news/editorial. Both link to each other. Draft + scheduled posts (future
  `publishedAt`) 404 publicly and stay out of the sitemap.
- **Route resilience:** `/[property]` and `/en/[property]` switched from
  `dynamicParams = false` to `true`. Known slugs still prerender; a valid slug a
  build somehow omits now renders on demand instead of being baked as a
  permanent 404 (unknown slugs still 404 via the `getPropertyBySlug` guard).
  This is the durable fix for the production `/valencia` 404 (see below).
- **Seed:** two real starter articles seeded in DEMO mode as **drafts**
  (Camarena de la Sierra; arroces cerca de la playa de la Llastra) — nothing
  auto-publishes; the owner edits and publishes them.
**Production `/valencia` 404 (praetoriavacacional.es):** reproduced only on the
deployed site (Hostinger), never in a clean local build of `main`. `/javalambre`
and `/valencia/<landing>` work; only `/valencia` and `/en/valencia` return a
prerendered 404 — consistent with a build where the property route baked those
paths as 404 under `dynamicParams = false`. Fixed structurally by the route
change above; needs a fresh redeploy of `main` (clean `.next`) to take effect.

## D-015 — Public availability calendar: timezone-safe cell dates (bugfix)
**Date:** 2026-08-30
`AvailabilityCalendar.tsx` built each cell date with
`new Date(year, month, day).toISOString().slice(0,10)` — the Date is LOCAL
midnight and `toISOString()` formats in UTC, so in Spain (UTC+1/+2) day 1 of a
month came out as the **last day of the previous month**: the June grid started
with "31" (May 31), July with "30" (June 30), etc.
- New pure module `src/lib/calendar-cells.ts` (`monthCells`, `ymd`,
  `firstWeekdayIndex`, `daysInMonth`) builds cells purely from strings / UTC.
  7 unit tests, including a regression assert that every non-null cell is inside
  the requested month.
- `AvailabilityCalendar` uses it; `rangeClear` iterates by `YYYY-MM-DD` string
  (`nextDay`) instead of local `Date.setDate`; "past" compares against a UTC
  `todayStr()`. `AvailabilitySearch.todayPlus` switched to `setUTCDate`.
- The admin calendar (`buildMonthGrid`) was already correct — it uses the
  UTC-based helpers in `src/lib/dates.ts`.

## D-016 — iCal import URL: env-var fallback so it survives redeploys
**Date:** 2026-08-30
Production runs in DEMO mode (no Supabase), so an admin-entered Booking/Airbnb
import URL is written to `.data/demo.json` on the server disk — and a redeploy
replaces that directory, wiping it (the owner had to re-enter it every deploy).
- New `src/domains/integrations/feed-config.ts` → `envImportUrl(slug, channel)`
  reads `ICAL_IMPORT_<SLUG>_<CHANNEL>` (e.g. `ICAL_IMPORT_VALENCIA_BOOKING`).
  Env vars in the hosting panel survive every redeploy.
- Resolution order everywhere (`sync.ts` import + `sync-status.ts` panel):
  **admin-saved value (`channel_feeds` / `.data`) → env var → content-file
  default**. Saving from `/admin/sincronizacion` still wins while a DB exists.
- `/admin/sincronizacion` shows "(definido por variable de entorno — sobrevive a
  los redespliegues)" and the DEMO banner now tells the owner to set the env var.
- `.env.example` documents the four vars. 4 unit tests.
- The real fix remains connecting Supabase; this is the durable floor until then.

## D-017 — Issue #59: public calendar honours the half-open stay model
**Date:** 2026-08-30
The booking engine, the pricing engine's min-nights (`nights = nightsBetween`),
the iCal parser (DTEND exclusive) and the Postgres exclusion constraints
(`daterange(..., '[)')`) were ALL already correct half-open `[check-in,
check-out)`. The bug reported in #59 lived only in the public
`AvailabilityCalendar` component: it disabled every `busy` day, so a day that is
`busy` only because another guest ARRIVES then (its previous night free) could
not be picked as a check-out.
- New pure module `src/domains/booking/calendar-select.ts` (`isDaySelectable`,
  `applyDayClick`, `dayRole`, `nightsClear`, `stayNights`) — 15 unit tests
  covering the 8 mandatory cases from the issue. The check-out day's own state
  is irrelevant; only the nights strictly between check-in and check-out must be
  free.
- `AvailabilityCalendar` rewritten onto that module. A departure-only day
  (`data-role="exit-only"`) stays clickable and is drawn with a diagonal
  half-fill + explicit `aria-label` ("disponible solo como fecha de salida");
  a legend explains libre / solo salida / no disponible. Min-stay is shown by
  real nights and turns red when the selected range is below `minNightsHint`.
- `e2e/calendar-checkout.spec.ts`: seeds a hold, then verifies its arrival day
  is `exit-only`, enabled, and completes a 3-night range as the check-out.
- Fixed a latent `tsc` error in `e2e/home-faq-spacing.spec.ts` (pre-existing,
  non-null assertion on `rows[rows.length - 1]`).

## D-018 — Issue #58: optional configurable per-stay charges (`fees`)
**Date:** 2026-08-30
The single always-on `cleaningFeeCents` is replaced by a configurable list of
`StayFee` (`key`, `label`, `enabled`, `amountCents`, optional `description` /
`taxable`) on `RateConfig.fees`. Only `enabled && amountCents > 0` charges are
resolved (`src/domains/pricing/fees.ts`, pure, 24 tests incl. the engine). A
disabled charge is invisible everywhere: no checkout line, no "0 €", nothing in
emails, invoices or Stripe (Stripe already bills a single line at
`reservation.totalCents`; the invoice draft is a single stay line at the total).
- **Default = OFF.** `src/content/rates/index.ts` ships
  `fees: [{ key: "cleaning", …, enabled: false }]` and `cleaningFeeCents: 0` for
  both properties. The owner turns cleaning on (and sets the amount) from
  **Admin → Precios y reglas → Cargos opcionales** — no redeploy.
- **Legacy fallback:** a stored override with `cleaningFeeCents > 0` and no
  `fees` still bills one "cleaning" charge, so old data never silently changes.
- **Snapshot:** the applied `fees` land in the reservation's `priceBreakdown`
  JSON, so the amount charged at booking time is preserved even if the config
  changes later.
- **i18n:** `feeLabel()` maps the built-in keys to English for the EN checkout;
  unknown keys show their configured label.
- Consumers updated: `BookingWidget`, `CheckoutFlow`, `CheckoutPageView`,
  `RatesForm` + `updateRatesAction`. `Quote.cleaningFeeCents` removed in favour
  of `Quote.fees` / `Quote.feesCents` — no stale 0 € rendering possible.
- Public "precio con limpieza incluida" copy softened to "precio total, sin
  cargos ocultos / todos los cargos desglosados" (`site.ts`, `legal.ts`,
  `landings/index.ts`, ES+EN) since cleaning is no longer folded in by default.
- `e2e/cleaning-fee.spec.ts`: both properties show no "Limpieza" line at checkout
  with the default config.

## D-019 — Valencia rate `maxGuests` raised 4 → 6 (aligns with D-013)
**Date:** 2026-08-30
`src/content/rates/index.ts` still capped Valencia at `maxGuests: 4` while
issue #57 / D-013 set the property to 6 guests. The pricing engine's
`max_guests` violation and the widget's guest selector derive from the rate
config, so a 5–6-guest Valencia booking was being rejected despite the property
page advertising 6. Raised to 6; `includedGuests` stays 2 (guests 3–6 pay the
existing per-night surcharge). The owner can tune both from the admin.

## D-020 — Issue #60: Admin V2 built in-code, own visual system, no design handoff
**Date:** 2026-08-30 · user choice (batched question on #58/#59/#60)
Issue #60 (premium admin redesign) is built directly in code — no Keel Phase 3
design handoff — consistent with D-002 (the issues are the spec) and the rest of
the project. Worked as an epic on branch `feat/60-admin-v2`, sprints 60-A…60-H;
merged `develop → main` only on the user's explicit instruction when the
"definición de terminado" flow in the issue passes end to end.
- **60-A (shell):** `src/app/admin/(panel)/admin.css` — a self-contained visual
  system scoped to `.admin-shell` (own neutral palette, denser scale, one
  restrained accent, `@layer components` so Tailwind utilities always win;
  heading font override unlayered to beat the site's `@layer base` serif rule).
  `AdminNav` (compact left sidebar, the issue's exact 11-item IA + a "Más" group,
  active state, mobile drawer + scrim). `AdminTopbar` (page-context label, the
  "Acciones" quick menu → nueva reserva / bloquear fechas / cambiar precios /
  crear promoción / sincronizar, "Ver web"). New `/admin/alojamientos` hub (the
  tabbed per-property fiche of §6 lands in 60-F). `SiteChrome` — a thin client
  gate in the root layout that drops the public `SiteHeader`/`SiteFooter` (and
  the `<main id="contenido">` wrapper) under `/admin`, so the admin is no longer
  wrapped in public chrome. `e2e/admin-shell.spec.ts`.
- **60-B (dashboard):** `src/app/admin/(panel)/page.tsx` rebuilt onto `.admin-*`
  with the §2 widgets — entradas/salidas 7d, alojados ahora, ocupación
  30/60/90, huecos difíciles de vender (new pure `src/domains/calendar/gaps.ts`
  `findHardGaps`, 5 tests), pagos con incidencia, canal con mini-barras.
- **60-C/D (calendar + price editing):** `CalendarMonth` rebuilt. Selection:
  mes / entre semana (dom–jue) / fin de semana (vie–sáb) / semana / narrow.
  Price modes: fixed € **or** percentage — `applyDayPricePercentAction` scales
  each day's effective price (`resolveRateConfig` + `nightlyRateCents`).
  **Preview** from the grid cells (N noches · media actual → media nueva).
  `e2e/admin-calendar.spec.ts`. Season/discount editing stays JSON until 60-F.
- **60-G (reservations):** `.admin-table`, quick-filter chips (Hoy / Próximas /
  Este mes / JV / VLC / Directa / Booking / Pagada / Pendiente / Canceladas —
  toggle + merge onto the query; date chips → repo `from`/`to`), columns incl.
  noches + estado estancia.
- **60-E (stay rules):** `RateConfig.sellExactGaps` (default on). Pure
  `src/domains/booking/gap-fill.ts` `fillsGapExactly` (7 tests); `buildQuote`
  gains `opts.skipMinNights`; `service.ts` computes it from `getBusyRanges`.
  A stay that exactly fills a gap between two occupied spans is now bookable
  below the season/base minimum. Toggle in RatesForm "Reglas de estancia".
  `e2e/gap-fill.spec.ts`.
- **60-F (per-property fiche):** `/admin/alojamientos/[slug]?tab=…` with tabs
  General (capacidad read-only per D-013 + operative summary), Precios y cargos
  (embedded `RatesForm`), Calendario, Contenido y SEO, Políticas, Integraciones
  (per-property iCal forms via `getImportFeedStatus` + `ImportFeedForm`). Hub
  cards link into it.
- **60-G-detail:** `reservas/[id]/page.tsx` restyled + status timeline.
- **60-H:** calendar "✓ Guardado" + "afecta a muchas fechas" (>14 días);
  whole-admin harmonisation by remapping the public tokens (`--color-line`,
  `--accent-*`, `--radius-card`, …) on `.admin-shell` so the ~11 legacy pages
  pick up the V2 look with zero per-file edits. Undo / deeper optimistic UI /
  per-page mobile audit deferred as follow-ups (not in the issue's DoD).
- **`e2e/admin-dod.spec.ts`** drives the issue's whole "definición de terminado"
  flow end to end (no manual steps) — passes. Merged `feat/60-admin-v2` →
  `develop` → `main` on the user's standing instruction ("when finish push to
  main").

## D-021 — Supabase build failure: RPC deploy + availability out of the prerender path
**Date:** 2026-08-31
**Symptom:** `next build` failed — `public.property_busy_ranges` "is not found in
the Supabase schema cache" during static prerendering of `/[property]` and
`/en/[property]`.

**Root cause (two independent faults):**
1. **The RPC was never deployed.** `property_busy_ranges` / `is_stay_available`
   are defined in `20260827091000_booking_rpc.sql`, but that migration set was
   never applied to the production Supabase project (it ran in DEMO mode until
   now). PostgREST's schema cache therefore has no such function.
2. **Live availability was read during the build.** `<AvailabilityNote>` (the
   issue-#49 "filling up" signal) was an async **server** component. On the
   ISR-prerendered property page the build called
   `getAvailabilityInsight → repo.getBusyRanges → rpc('property_busy_ranges')`,
   so the production build depended on the current database state — wrong even
   once the RPC exists (the signal would be baked up to 1 h stale).

**Fix:**
- **Migration `20260831120000_availability_rpc.sql`** (idempotent):
  `create or replace` both read RPCs with `security definer` +
  `set search_path = public, pg_temp`, explicit half-open `[check_in,
  check_out)` semantics, consolidating occupying reservations (`pending` /
  `confirmed`; `external` excluded — its iCal block holds the dates) and every
  `availability_blocks` row (manual + imported iCal/Booking/Airbnb). `grant
  execute` on the two PII-free read functions to `anon` / `authenticated` /
  `service_role`; `revoke` the mutating RPCs from `public` (service role only);
  `notify pgrst, 'reload schema'`.
- **`<AvailabilityNote>` is now a client component** that fetches the new
  `dynamic = 'force-dynamic'` route `/api/properties/[property]/availability-
  insight` after hydration. The property page is fully static/ISR again with no
  DB dependency; the note is progressive enhancement (hides itself on failure or
  low occupancy — it is a soft signal, not the calendar).
- **The calendar route stays strict:** `/api/properties/[property]/calendar`
  and `getPropertyCalendar` still throw / 500 on RPC failure — never an empty
  calendar (task point 9).
- **New Supabase key names:** `env.ts` resolves `supabaseUrl` /
  `supabasePublishableKey` / `supabaseSecretKey`, preferring
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` and falling
  back to the legacy `*_ANON_KEY` / `*_SERVICE_ROLE_KEY`. `supabaseAdmin()` /
  `supabaseServer()` use the resolved values.
- **Parity:** the DEMO repo's `busyRangesFor` and the SQL RPC now share one
  contract via the pure `src/domains/booking/busy-ranges.ts`
  (`consolidateBusyRanges`, `statusOccupies`).

**Tests:** `src/domains/booking/busy-ranges.test.ts` (14 — adjacent bookings,
same-day turnover, direct/manual/iCal blocks, external de-dup, cancelled/expired
ignored, no phantom checkout day, `buildCalendar` over the consolidated ranges).
`supabase/tests/property_busy_ranges.test.sql` (runnable transaction, rolls
back). Verified: `next build` succeeds in DEMO **and** with Supabase configured
against an unreachable DB — `/[property]` stays `● SSG`.

## D-022 — V4 Phase 1 (conversion) — architecture of the shared pieces
**Date:** 2026-08-31 · master issue #98
V4 optimises direct-booking conversion; visible product first (#86–#93 before the
infra #61–#85). The reusable pieces, all real-data / no invented urgency:
- **#92 alternatives** — pure `src/domains/booking/alternatives.ts`
  (`rescueAlternatives` = shifted same-length windows, closest first, then
  weekend fallbacks). `checkProperty` prices them (empty when available). Cards
  in every search surface. `AvailabilityResult` grew `alternatives` + `rating`.
- **#89 Booking Bar** — `src/domains/booking/stay.ts` (a `useSyncExternalStore`
  store persisted to `sessionStorage`, SSR-safe) + `BookingBar` mounted in
  `SiteChrome`. Never a source of truth; the server always re-quotes.
  `<PreferProperty>` declares a page's property.
- **#90 RatingBadge** — `src/components/property/RatingBadge.tsx`, Booking's /10
  scale kept, renders nothing without data, per-property.
- **#91 direct booking** — `content/site.ts` `directBooking` (configurable promo
  + a factual comparison, no brand attacks, no fake struck prices).
  `<DirectBookingCompare>` / `<DirectBookingSaving>`.
- **#93** — `ResponsivePhoto.focal` → `object-position`; lightbox swipe. The
  commercial re-order is data on `photo-manifest.json`.
- **#86/#87/#88** — the hero and the shared `PropertyPageView` impact block are
  done; the per-property "wow" (Valencia sea-first hero, Javalambre weekend
  itinerary, MAR/NIEVE selector) is the remaining Phase-1 work.

## D-023 — Infra #61/#63/#64 — CI, fail-closed production, service auth
**Date:** 2026-08-31 · issues #61, #63, #64
- **#64 service-to-service auth** — `requireServiceAuth(req)` in `src/lib/api.ts`
  guards `/api/cron/expire-holds` and `/api/ical/import`. Constant-time bearer
  check against `CRON_SECRET` (Vercel Cron sends it automatically). When
  `CRON_SECRET` is unset: 503 "not configured" in production, `x-vercel-cron: 1`
  accepted only in non-production. Never 200 without proof. e2e in
  `production.spec.ts` asserts `[401, 503]` for no-auth / forged-header /
  wrong-bearer across both endpoints.
- **#63 fail-closed production** — `strictProductionBlockers()` in
  `src/domains/config-status/strict.ts`. Only active when
  `NODE_ENV=production` AND `PRODUCTION_STRICT` truthy; then `instrumentation.ts`
  `register()` throws (server refuses to boot) if Supabase / Stripe /
  `STRIPE_WEBHOOK_SECRET` / `CRON_SECRET` / an admin secret is missing. Default
  (unset) keeps the degraded-mode boot from #41. 4 unit tests via
  `vi.resetModules()` env swap.
- **#61 CI** — `.github/workflows/ci.yml`: `quality` (typecheck · lint · unit ·
  build with placeholder `NEXT_PUBLIC_SITE_URL`, no secrets, per D-021), `e2e`
  (chromium, `--workers=1`, `NEXT_PUBLIC_WHATSAPP_NUMBER` set so the build inlines
  it for `whatsapp.spec`), `security` (`npm audit --omit=dev --audit-level=high`).
  `concurrency` cancels superseded runs.
- **Owner follow-ups:** set `CRON_SECRET` on the host; decide `PRODUCTION_STRICT`
  (recommended `true` once Supabase + Stripe live keys are in).

## D-024 — Infra #75 — RLS + least-privilege consolidation
**Date:** 2026-08-31 · issue #75
Migration `20260831130000_rls_hardening.sql` (idempotent) makes the posture that
was set table-by-table explicit and closes the gaps:
- `content_overrides` had no RLS — now enabled.
- Every application table: RLS `enable` **and** `force` (owner-role connections
  respect it too) + `revoke all from anon, authenticated`.
- `alter default privileges in schema public revoke all ... from public, anon,
  authenticated` for tables/sequences/functions — a future `create table` is
  locked by default, not open by default.
- The D-021 availability read functions (`property_busy_ranges`,
  `is_stay_available`) are tightened to `service_role` only. Nothing connects
  with the anon key — `supabaseServer()` is unused, reserved for #65. If a
  public anon read is ever reintroduced, restore the grant in that migration.
- Model unchanged: RLS on + zero policies ⇒ only the secret/`service_role` key
  reaches the data, behind the app's own admin auth (D-005).
`supabase/tests/rls_hardening.test.sql` asserts the posture (RLS forced on all
tables, zero anon grants, no anon-exposing policy, no anon RPC grants).
**Owner:** `supabase db push` to apply; no app redeploy needed.

## D-025 — Infra #83 + #84 — repo contract + channel-sync resilience
**Date:** 2026-08-31 · issues #83, #84
- **#83** — `src/lib/repository/contract.ts` `runRepositoryContract(harness)`:
  one behavioural spec (half-open availability, idempotent hold, overlap
  rejection, hold→confirm, cancel frees, manual block, `expireStaleHolds`) that
  any `Repository` must satisfy. `contract.memory.test.ts` runs it against the
  in-memory store + a **static parity check** (`memoryRepository` and
  `supabaseRepository` expose the identical method surface — catches an
  accidental `as any`). A Supabase runner can reuse `runRepositoryContract`
  when a throwaway DB URL exists.
- **#84** — two pure additions, both unit-tested:
  - `feed-health.ts` `assessFeedHealth()` → `healthy | stale | failing | never`
    from `lastRunAt` + `lastStatus` + `lastError` (threshold 26 h = daily cron +
    margin). Wired into `sync-status.ts` (`ChannelFeedStatus.health` /
    `needsAttention`) and shown on `/admin/sincronizacion`.
  - `conflicts.ts` `detectChannelConflicts(feedBlocks, directReservations)` —
    a feed night that overlaps a `pending`/`confirmed` DIRECT booking (not the
    block's own mirror). `sync.ts` computes it per import, adds `conflicts` to
    `ImportReport`, `console.warn`s, and `RunSyncButton` shows "⚠ N choques".
  - No schema change; `CalendarSyncRow` already carries enough. Adapters were
    scoped out — two channels with the same iCal shape don't justify the layer.

## D-026 — Product #82 — Business Intelligence
**Date:** 2026-08-31 · issue #82
Pure `src/domains/analytics/kpis.ts` — `computePeriodKpis({from,to,propertyCount,
reservations})` → occupancy, ADR, RevPAR, revenue, bookings, avg lead time, avg
stay, cancellation rate, direct-nights share, channel mix. `trailingMonths(n)` +
`pctChange`. Bases are stated in the module doc and on the page: a night counts
in the month of its date; revenue is attributed to the check-in month;
`confirmed`/`pending`/`external` occupy, `cancelled`/`expired` don't.
`/admin/analitica` (SECONDARY nav) shows a 12-month table + 4 headline cards with
MoM deltas + a channel-mix bar, filterable per property. 12 unit tests. Reuses
the reservation data already in the repo — no schema, works in DEMO and Supabase.
The live "now" dashboard at `/admin` is unchanged; this is the historical view.

## D-027 — #77 — Design System V4 + visual regression
**Date:** 2026-08-31 · issue #77
`src/app/globals.css` rebuilt as a real token system + component vocabulary:
- **Tokens** — full ink/paper/line ramp incl. `--color-mist` / `--color-ink-faint`;
  accent 50–800 (sea + ski, remapped by `data-experience`); semantic
  success/warning/danger; radii `sm|md|lg|xl|pill`; elevation `xs|sm|md|lg`;
  fluid type scale (`--text-display-1..3`, `--text-title`); section rhythm
  (`--space-section*`); motion (`--ease-out`, `--dur-fast|mid`). All legacy
  names (`--color-line`, `--accent-600`, `--radius-card`, `--shadow-card`,
  `container-page`, `eyebrow`) still resolve.
- **`@utility`** — `display-1|2|3`, `lede`, `section-y`, `section-y-tight`.
- **`@layer components`** — `.pv-btn` (+ `--primary|secondary|ghost|ondark|
  ondark-ghost`, `--sm|lg`, `--block`), `.pv-card` (+ `--pad|soft|interactive|
  accent`), `.pv-input|select|textarea|label|hint|error`, `.pv-chip`, `.pv-badge`,
  `.pv-note` (info|warn|error), `.pv-faq`, `.pv-hairline`.
- **React primitives** — `components/ui/Button.tsx` (rebuilt on `.pv-btn`,
  gained `size="sm"`, `block`, `ondark`), `Card.tsx` (`Card` / `CardLink`),
  `Field.tsx` (`Field` / `Input` / `Select` / `Textarea`), `SectionHeading.tsx`.
- **Sweep** — header, footer, mobile menu, hero, availability search, booking
  widget, booking bar, experience selector, property page (headings · impact
  block · ideal-para chips · "más" links · closing CTA · sticky bar), property
  card, direct-booking, rating badge, reviews, FAQ, guide layout, checkout flow +
  page, coupon field, availability note/calendar, and every standalone page
  (blog, guías, ofertas, contacto, legal, reserva, ventajas, landings). ~45
  hand-rolled button/card strings replaced with the vocabulary. Header height
  14→16 (`top-16` in MobileMenu).
- **#87 side-effect** — property pages now embed an OpenStreetMap location frame
  ("zona aproximada", exact address after booking); `frame-src` in
  `next.config.ts` gains `https://www.openstreetmap.org`.
- **Visual regression** — `e2e/visual.spec.ts`: full-page screenshots of 10
  templates × {390, 1280} on chromium; baselines in `e2e/__screenshots__/`,
  `maxDiffPixelRatio 0.02`, `animations: "disabled"`. Regenerate with
  `npx playwright test visual --update-snapshots` after an intended change.
- The admin (`admin.css`) keeps its own deliberately denser system (private
  tool, not a marketing surface) — untouched.

## D-028 — #86/#87/#88/#93 — photo curation + copy accuracy
**Date:** 2026-08-31 · issues #86, #87, #88, #93 (owner delegated the photo/order/crop calls)
- **Photo order** (`photo-manifest.json`), from the existing real photos only:
  - Valencia: `salon-vista-mar` (hero/OG — table at the sea window) → `vista-mar`
    (terrace, frontal beach) → bright living rooms → `atardecer-playa` (sun over
    sea) → `paseo-maritimo` (building on the seafront promenade) → rooms →
    `entorno`.
  - Javalambre: `salon-comedor` (hero/OG — warm, fireplace, valley view) →
    living rooms → `dormitorio-1` (mountain-view window) → kitchens → `bano` →
    `invierno` (snowy village) → `pistas-esqui` → `edificio`.
- **`vistas-montana` removed from the Javalambre manifest** — it is a
  climbing-route topo poster, not a window view, and its alt text
  ("vistas … desde el apartamento") misrepresented it. The image files stay in
  `/public` (orphaned, harmless); `scripts/fetch-property-photos.mjs` still lists
  it.
- **`focal`** (`object-position`) added on the wide-crop shots so the sea /
  fireplace / building stays framed on mobile; **`category`** tags added
  (vistas/salon/cocina/dormitorio/bano/exterior/entorno/nieve) for future use —
  no new gallery UI built.
- **Copy** — one claim softened: the single Valencia bedroom photo shows no sea
  view, so "te duermes y te despiertas con el Mediterráneo delante" →
  "vistas frontales al mar desde el salón y la terraza; las mañanas empiezan con
  la playa delante" (ES + EN); section heading "Dormir prácticamente sobre el
  Mediterráneo" → "En primera línea de la playa de la Llastra"; amenity "Balcón
  con vistas frontales al mar" → "Terraza con vistas frontales al mar". Every
  other content claim is photo- or data-backed and untouched. "Qué hacer si no
  esquías" for Javalambre was already covered by a source-backed section.
- **`HomeView`** — the story image and the MAR/NIEVE selector photo are picked
  by base name (`vista-mar` / `atardecer-playa` / `invierno`), not a brittle
  index.
- Visual regression baselines regenerated; `e2e/visual.spec.ts` now waits for
  `<img>` decode before the snapshot (a cold-capture flake fix).

## D-029 — #76 — durable jobs + transactional outbox
**Date:** 2026-09-02 · issue #76
- **One table, provider-agnostic.** `jobs` (migration `20260901120000_jobs.sql`)
  backs every kind of critical async work. No queue vendor — business logic
  never imports a provider, only `enqueueJob()` / the repository. A real broker
  can back the same `Repository` methods later without touching callers.
- **Transactional outbox.** `finalizeReservation` (and `markPaymentFailed`)
  enqueue the confirmation / internal-notice / payment-failed emails right after
  `confirmReservation`, with a deterministic `idempotency_key`
  (`email.reservation_confirmation:<reservationId>`). The intention is now
  persisted; a crash before the send cannot lose it. Enqueue failure still never
  rolls back the reservation (`enqueueBestEffort` swallows). After enqueuing, the
  request drains the queue inline (`drainJobsSafely`) so the guest still gets the
  mail immediately — the durable job is the guarantee if that inline pass dies.
- **Leased workers, idempotent handlers.** `claimJobs(worker, batch, lease)` is
  atomic — Postgres `claim_jobs` RPC uses `FOR UPDATE SKIP LOCKED`; the in-memory
  version runs its claim body synchronously. Two workers never take the same job.
  `attempts` is incremented at lease time, so a crashed worker's job is retried
  once its lease elapses (crash recovery), and `maxAttempts` is still honoured.
- **State machine (pure).** `decideNext(job, outcome, now)` → succeeded /
  retrying (exponential backoff, `DEFAULT_BACKOFF` 30 s × 4, cap 6 h, 20 % floor
  jitter) / `dead_letter`. `retryable: false` from a handler (e.g. reservation
  deleted) skips straight to dead-letter.
- **Admin.** `/admin/procesos` — queue depth, oldest-pending age, error rate,
  dead-letter count; filter by status; "Reintentar" (dead-letter → queued) and
  "Cancelar", both `settings.write` + audit-logged; "Procesar ahora" runs a
  batch. `/api/cron/jobs` (`CRON_SECRET`, every 2 min in `vercel.json`) is the
  only scheduled processor — the scheduler encola, the worker procesa.
- **Not migrated yet:** Stripe refund reconciliation (#67) and campaign bulk
  send (#73) are owner-gated; they plug into the same queue when their providers
  are chosen. iCal import + hold expiry keep their existing dedicated cron
  endpoints *and* are registered job types, so they can move to the queue later
  with no new code.

## D-030 — #69 — guest communications lifecycle
**Date:** 2026-09-02 · issue #69
- **Transactional, not marketing.** The pre-arrival / check-in / check-out /
  review messages execute the booking, so they are *not* consent-gated (that
  gate stays on `segments`/`campaigns`). They reuse the #12 Resend pipeline —
  **no new email/WhatsApp provider**, so the issue's "owner input" blocker
  didn't actually apply to a first version.
- **Pure planner + repository reconcile.** `planReservationComms(reservation,
  rules, now)` returns the desired message set; `scheduled_messages` holds one
  row per `(reservation, kind)` and `syncReservationMessages` upserts by kind,
  re-times still-`planned` rows and retires the rest. Re-running after a date
  change re-plans with no duplicates; a cancellation retires every `planned`
  row. Called from `finalizeReservation` (best-effort, never un-confirms a
  reservation) and an admin "re-planificar".
- **24-hour minimum lead.** A message under 24 h away is dropped, not fired
  late — a last-minute booking simply misses the pre-stay sequence.
- **Per-property rules + notes.** `CommRule[]` (enabled / anchor / offsetDays /
  hour) overridable per property at `/admin/comunicaciones/ajustes`, plus
  free-text arrival/departure notes. Templates invent no access details
  (L-008): without an owner note they point the guest at the real contact
  channels. ES/EN by guest country.
- **Worker.** `/api/cron/comms` (`CRON_SECRET`, every 15 min in `vercel.json`)
  sends due messages; idempotent (status flips off `planned`), 4 attempts with
  30-min backoff, then `failed` and visible at `/admin/comunicaciones`.

## D-031 — #66 — observability without an SDK
**Date:** 2026-09-02 · issue #66
- **Structured logs always on.** `src/lib/observability/logger.ts` emits one JSON
  object per line in production (parsed by any drain), pretty text in dev.
  `scrubFields` redacts sensitive keys (email/phone/token/…) as a defensive
  last pass — callers still shouldn't log PII.
- **Sentry by DSN, no `@sentry/nextjs`.** The SDK's build footprint isn't worth
  it for a two-property site. `sentry.ts` is pure: `parseDsn` → ingest URL,
  `buildEnvelope` → the 3-line `type:event` envelope. `report.ts` POSTs it
  fire-and-forget with a 2.5 s abort; a monitoring outage never reaches the
  request path. Kept free of `node:*` so it bundles for the edge runtime that
  `onRequestError` can run in.
- **Every error path covered.** `instrumentation.ts` `onRequestError` (server) +
  the route/global error boundaries → `/api/observability/client-error`
  (rate-limited, tiny schema, browser stack is context only) + explicit
  `reportError` in the Stripe webhook catch.
- **No new required env.** Absent DSN → logs only; the app is unchanged.

## D-032 — #62 — distributed rate limiting + anti-abuse
**Date:** 2026-09-02 · issue #62
- **Pluggable store behind pure math.** `windowBucket` / `evaluate` are pure and
  tested; the store is `memory` (a Map — correct for one instance) or `redis`
  (Upstash REST `/pipeline`: `INCR` + `PEXPIRE NX`). Redis is picked up from
  `UPSTASH_REDIS_REST_*` or the `KV_REST_API_*` aliases.
- **Fail open for limiting, safe for denylist.** A Redis timeout falls back to
  the in-memory store rather than 500-ing or locking users out; an unknown
  denylist lookup returns "not denied".
- **Escalation.** `enforceRateLimit` counts over-limit breaches per IP; ≥25 in
  5 min → a 15-minute denylist flag, reported to observability (#66). Every 429
  carries `Retry-After`.
- **Not required for launch.** One Hostinger node → the in-memory limiter is
  correct; Redis only matters when the deployment scales horizontally.

## D-033 — #65 — admin multi-user on Supabase Auth
**Date:** 2026-09-02 · issue #65 · user choice ("Full Supabase Auth now")
- **Layered, degrades gracefully.** `getAdminContext()` (memoised per request)
  resolves the operator from a Supabase Auth session + an `admin_users` row when
  Supabase is configured; otherwise the existing signed password cookie, with a
  synthetic `ADMIN_ROLE` context when there are no rows (DEMO / first boot). The
  password path is untouched, so nothing breaks before the owner enables Auth.
- **Per-user RBAC.** `assertCapability` became async and reads the context's
  role. `MFA_GATED` caps (`settings.write`, `invoices.write`) additionally
  require an AAL2 session when the user has `mfa_required`.
- **Revocation is a watermark.** `sessions_valid_from` on the row; a "close all
  sessions" bumps it to now and (Supabase mode) also calls
  `auth.admin.signOut(id, 'global')`. `active=false` locks the user out on the
  next request even with a live JWT.
- **Invites.** `/admin/usuarios` → `auth.admin.inviteUserByEmail` + a pending
  `admin_users` row (invite-token hash); first confirmed sign-in auto-activates
  it. A bootstrap promotes any `ADMIN_EMAILS` address to `admin` on first visit.
- **MFA** is Supabase Auth TOTP — enroll/manage at `/admin/seguridad`, and a
  `MfaGate` replaces the panel body until the challenge is met.
- **Live verification is the owner's** — no Supabase project/creds this session;
  build + typecheck + unit + route-privacy e2e are green.

## D-034 — #79 — privacy lifecycle / GDPR operational
**Date:** 2026-09-02 · issue #79
- **Pure verdicts, thin application.** `retention.ts` decides keep/anonymise/
  delete per record; `erasure.ts` plans a data-subject erasure. Both are pure
  and unit-tested; a monthly sweep and the admin console just apply the result.
- **Legal holds win.** `planErasure` never deletes an invoice inside the
  6-year Spanish fiscal window (art. 30 CdC / art. 66 LGT) or a reservation
  linked to one — it anonymises the contact fields and keeps the accounting
  row, and surfaces the reason. An active/future booking blocks erasure of that
  reservation entirely.
- **Anonymise in place, no schema change.** PII columns are overwritten with
  tombstones (`guest_name = '[borrado a petición]'`, contact fields null). The
  customer row is kept (referential integrity) but blanked.
- **Retention windows** (`DEFAULT_RETENTION`): abandoned holds 7 d, cancelled
  reservations 1 y, completed-stay contact 6 y, finished lifecycle messages
  180 d, audit log 3 y. Owner reviews with the DPO.
- **Accountability.** Export and erasure are audit-logged with a salted-short
  hash of the email, not the address itself.

## D-035 — #67 — cancellation / refund / Stripe reconciliation
**Date:** 2026-09-02 · issue #67 · user choice ("tiered by lead time")
- **Policy.** 100 % refund ≥30 days before check-in, 50 % from 29 to 7 days,
  0 % inside 7 days. Encoded in each property's `cancellationPolicy.tiers`;
  pure `computeRefund` picks the first tier whose `daysBefore` ≤ the actual
  lead time.
- **One operation.** `cancelWithRefund` computes the amount (or takes an
  override), issues the Stripe refund on the captured PaymentIntent
  (idempotency key `refund_<reservationId>` so a retry is safe), updates the
  payment row + `paymentState`, retires the guest lifecycle messages and emails
  the guest. The reservation is always cancelled even if the refund call throws
  — the amount is then picked up by reconciliation.
- **Reconciliation cycle.** The webhook handles `charge.refunded` (catches
  dashboard refunds). `/api/cron/reconcile` (every 6 h) walks recent
  PaymentIntents that carry our `reservation_id` metadata and aligns our
  payment/reservation state with Stripe — covering anything the webhook missed.
- **No dedicated refunds table.** The Stripe refund object is the system of
  record; we store its id/status on the `payments` row and in the reservation
  notes.

## D-036 — #81 — media library
**Date:** 2026-09-02 · issue #81
- **Private bucket, signed URLs.** Files go to a Supabase Storage bucket `media`
  the owner creates as private; `media_assets` rows hold the metadata and the
  app mints short-lived signed URLs (batched via `createSignedUrls`) for the
  admin grid. No public bucket, no guessable paths.
- **Dimensions from the client.** No `sharp` in the build — the upload form
  reads `naturalWidth/Height` from an `Image()` and posts them; width/height
  stay optional.
- **Focal point reuses the existing model.** `focal_x`/`focal_y` are 0–1
  fractions → `object-position`, the same convention as `ResponsivePhoto`
  (#93). Click the preview to set it.
- **Optimisation** is left to `next/image` / Supabase's own render transforms
  at point of use rather than a build step here.
- **DEMO** keeps the metadata CRUD (so the UI renders) but blocks uploads —
  there's nowhere to put the bytes without Storage.

## D-037 — #68 — passwordless guest portal
**Date:** 2026-09-02 · issue #68
- **Stateless magic link.** `<reservationId>.<expiryMs>.<hmac>` (base64url),
  7-day TTL, keyed off an existing server secret. No `guest_portal_tokens`
  table — a leaked link dies on expiry and the guest self-serves a new one with
  code + email. The lookup requires the code AND the reservation's own email to
  match, and never reveals whether a pair matched (rate-limited 5 / 10 min).
- **What the guest can do:** see the stay + payment status, pay the outstanding
  balance (`total − Σ succeeded payments` via a fresh Stripe Checkout Session),
  download issued invoices, and submit an arrival time + requests (appended to
  the reservation notes + an email to the owner).
- **Invoice document extracted.** `<InvoiceDocument>` is now a shared pure
  component; the admin viewer and the token-guarded guest route both render it.
  The guest route checks the invoice belongs to that reservation and is issued.
- **noindex** via the middleware prefix list; linked from the footer and the
  confirmation email.

## D-038 — #70 + #71 — one operations board
**Date:** 2026-09-02 · issues #70, #71
- **Housekeeping and maintenance are the same shape** — a task on a property
  with a status, a priority, a due date and notes — so `operations_tasks` backs
  both, distinguished by `kind` (turnover / cleaning / maintenance / incident).
  Maintenance uses `cost_cents`; turnovers link `reservation_id`.
- **Turnovers are derived, not entered.** Pure `planTurnovers` creates one
  scheduled turnover per confirmed checkout inside a 45-day window; a stay that
  starts the same day another ends is flagged `urgent`. `reconcileTurnovers`
  (unique index on `reservation_id`) is idempotent and runs from
  `/api/cron/turnovers` daily and an admin button.
- **Photos** are just media-library URLs pasted onto a task — no separate
  upload path, reuses #81.
- **`operations.write`** capability, granted to admin + gestión (day-to-day
  work), not lectura.
- No owner workflow decision was needed for a first version — this is the
  obvious shape; the owner can tell us later if their real turnover process
  differs.

## D-039 — #73 — marketing in production over Resend
**Date:** 2026-09-02 · user choice (Resend, the existing email provider)
- **No new provider.** Campaigns send through the same Resend account as the
  transactional email. Not Resend Broadcasts/Audiences — we already own the
  segment engine, consent gate and suppression list (#56 §6), so `sendCampaign`
  just iterates the prepared recipients and calls `emails.send`.
- **Deliverability basics baked in.** RFC-8058 `List-Unsubscribe` +
  `List-Unsubscribe-Post: One-Click` headers, a visible unsubscribe link, an
  optional dedicated `MARKETING_FROM`, and a per-recipient suppression re-check
  at send time (not only at prepare time).
- **Stateless unsubscribe.** HMAC token of the email → `/baja` (human) and
  `/api/marketing/unsubscribe` (mail-client one-click POST). No expiry.
- **Bounces & complaints.** `/api/webhooks/resend` verifies the Svix signature
  and adds `email.bounced` / `email.complained` / `email.failed` recipients to
  the suppression list.
- WhatsApp bulk send is still unconfigured — that channel keeps the
  intent-only `markCampaignSent` path.

## D-040 — #74 — explainable dynamic pricing
**Date:** 2026-09-02 · user choice ("auto-apply within guardrails")
- **Nudge the natural price, don't compound.** `suggestNightlyRate` starts from
  what the static rate config (seasons + weekend) would charge — never the
  resolved config with existing `daily_rates` — so running it daily converges
  instead of ratcheting.
- **Named factors, always shown.** Lead time, window demand (real occupancy),
  orphan nights. Each carries a label + signed % + a plain reason; the admin
  screen prints the full breakdown per date.
- **Hard guardrails.** The recommendation is clamped to ±`bandPct` (default 25)
  of the natural price and then floored at `floorCents` (default 60% of base).
  The clamp reason is surfaced.
- **"Auto-apply" = the cron writes without a click**, but only for a property
  whose owner has ticked `enabled` (default off). `/api/cron/pricing` runs
  daily; `applyDynamicPricing(slug, {force:true})` is the manual "apply now".
  Everything is audit-logged.
