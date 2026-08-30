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
- ⬜ 60-E (stay rules + gap exceptions), 60-F (per-property tabbed fiche +
  season editor), 60-G-detail (reservation timeline), 60-H (mobile polish,
  undo, "afecta a N fechas" warnings, optimistic UI) — pending.
