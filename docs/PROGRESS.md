# PROGRESS — Praetoria Vacacional V1

> Living state. Updated at the moment of every change, not at phase ends.
> A fresh chat resumes from this file — never from re-scanning code.

## Project card

- **Project:** Praetoria Vacacional — multi-property direct-booking platform (beach + ski)
- **Type:** Web app (Next.js App Router, hosted service) + heavy technical/local SEO
- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth) · Stripe · Resend (email) · Vercel (target)
- **Repo:** https://github.com/FarinosV44/Praetoria-Vacacional (public)
- **Durability:** Git repo with remote `origin` on GitHub — satisfied.
- **Autonomy:** automatic — `.claude/settings.local.json` written (`acceptEdits`). Keel commits and pushes to `develop` without asking; `develop → main` merge is the user's. (If the user wants zero bash prompts too, Shift+Tab to `bypassPermissions` for the session.)
- **Notify:** terminal only. All blocks listed in this file's "Open items".
- **Issue tracking:** comment on GitHub issues at sprint close when a fix lands; never close issues from code reading. Issue capture: off (tracker holds the V1 plan).
- **Client budget:** no.
- **Test-first policy:** pure-logic — pricing, availability/overlap, iCal parse, validation schemas get failing tests before code. Markup/glue exempt. Every bug fix starts from a failing reproduction test.
- **i18n:** ES principal; EN for priority commercial pages + property pages (issue #29). Architecture locale-ready from day one; EN content is a later sprint.
- **Output language:** product base ES (target market is Spain); docs & Keel artifacts in English (token economy).
- **Keel baseline:** v5.19.0

## Working method (decision D-002)

The 33 GitHub issues ARE the functional spec. We do not run Keel Phases 1–3 as ceremony.
We work issues in dependency order as sprints, keeping Keel's discipline: state files,
git flow, per-commit confidential-data check, security profile (`web-app`), accessibility,
test-first for pure logic, docs for every public surface.

## Sprint plan (dependency order)

Legend: ✅ acceptance criteria met & verified · 🟡 functional, needs polish/VERIFY · ⬜ not started

| Sprint | Issues | Status | Notes |
|--------|--------|--------|-------|
| S1 · Technical base | #1 | ✅ | scaffold, typed env, domain separation, lint+typecheck+build+34 tests green |
| S2 · Data model | #6 | ✅ | migrations (exclusion constraint + trigger + RPCs), seed, TS types, repository abstraction (supabase + in-memory) |
| S3 · Availability + calendars | #7 | ✅ | pure engine + tests; `/api/availability/search`, `/api/properties/[p]/calendar`; double-booking → 409 verified in DEMO |
| S4 · Pricing engine | #8 | ✅ | server-only engine (seasons/weekend/min-stay/LOS discount/extra guest), 11 tests, browser never sends price |
| S5 · Design system + branding | #2, #24 | 🟡 | tokens + ski/sea theming, LogoMark, editorial hero + cards, storytelling sections, scroll-reveal, full-screen gallery lightbox. Deeper micro-interaction/skeleton pass remains |
| S6 · Home + search | #3 | 🟡 | split hero, Playa/Nieve selector, live global search with per-property price+CTA, sticky mobile CTA, FAQ+JSON-LD |
| S7 · Property pages | #4, #5 | 🟡 | full functional pages via shared PropertyPageView (ES+EN). Content = placeholder (D-004) |
| S8 · Galleries + reviews | #17, #18, #27 | 🟡 | Gallery lightbox (LCP hero eager, rest lazy), empty-safe ReviewsBlock w/ source attribution. Needs real photos + WebP pipeline |
| S9 · Checkout (3 steps) | #10, #23 | 🟡 | 3-step flow, server re-quote + re-check, pending hold w/ expiry, idempotency key (refresh/back safe), success/error pages. E2E verified both properties |
| S10 · Stripe + webhooks | #11 | 🟡 VERIFY | Checkout Session w/ metadata, signed idempotent webhook, confirm only via webhook. Needs real test keys |
| S11 · Emails | #12 | 🟡 VERIFY | Resend module, per-property confirmation + payment-failed templates, 3× retry, email failure never changes reservation state |
| S12 · Admin panel | #13 | 🟡 | auth, dashboard, reservations (filter/cancel w/ confirm), manual blocks, **price & rules editor → live on site**, sync health |
| S13 · iCal sync | #9 | 🟡 | parser+generator (7 tests, idempotent), per-property export feed (token), import endpoint+cron, dedup by (property,source,uid). Needs real Booking feed URLs to VERIFY |
| S14 · Technical SEO | #14, #28, #32 | 🟡 | dynamic sitemap/robots, per-locale canonical, OG, JSON-LD (Org/WebSite/VacationRental/Breadcrumb/FAQ), noindex, breadcrumbs, **bidirectional hreflang + x-default** |
| S15 · Keyword arch + SEO landings | #15, #16, #25, #26, #31 | ✅ (content) | 6 transactional landings + 12 destination guides (hub & spoke), all real copy, distinct intent. `docs/seo/keyword-map.md` formalised. #26 local schema could go deeper |
| S16 · Analytics + Search Console | #19, #33 | 🟡 | GA4 loader (consent-default-denied), typed event wrapper w/ PII filter, events wired, GSC verification meta, experiment dimension. Needs GA4 id + live GSC + evolution dashboard (#33) |
| S17 · Legal pages | #20 | 🟡 | 4 configurable legal docs, `[[PENDIENTE]]` markers, checkout terms checkbox, per-property cancellation policy |
| S18 · i18n ES/EN | #29 | ✅ | ES root + `/en` for home, property pages AND full checkout; dictionaries, bidirectional hreflang + x-default, per-locale canonical, LanguageSwitcher, reviewed EN copy. Booking language preserved end-to-end (E2E verified). EN landings/guides = later expansion |
| S19 · CRO | #30 | 🟡 | direct-booking block near CTA, total price up front, trust signals, no false urgency. **A/B experiment scaffolding built** (3 prepared, disabled); `docs/cro/experiments.md` |
| S20 · Perf/a11y/security hardening | #21 | 🟡 | CSP + security headers, rate limiting, server validation (zod), skip-link, focus styles, reduced-motion. **axe-core over 7 pages: 0 serious/critical; AA contrast**. Lighthouse run pending a deploy |
| S21 · Final E2E QA | #22 | 🟡 | Playwright: booking flow both properties + EN flow + property independence, all green (DEMO). Full checklist w/ real services + remaining security scenarios pending |

### V2 batch (issues #34–#41) — redesign + real content

| Sprint | Issues | Status | Notes |
|--------|--------|--------|-------|
| V2a · Config-status + graceful degradation | #41 | ✅ | `config-status/registry` (4 states), `/admin/configuracion`, dashboard banner, checkout demo-mode notice. Every feature implemented; only activation pending |
| V2b · Real Booking content | #35 | ✅ | 21 real photos → AVIF+WebP ×4 widths (served via next/image), real address/capacity/amenities/distances/reviews/rating/licence for BOTH properties. `photo-manifest.json`. `scripts/fetch-property-photos.mjs` (signed URLs). No placeholders left. e2e/images.spec.ts guards it |
| V2c · Home V2 (desire-first) | #34, #37 | ✅ | emotional hero (real split photos, short headline, 1-line sub, two "Descubrir X", NO form), separate `Reserva tu escapada` module, editorial #37 cards (photo + rating + headline distance + capacity + feature) |
| V2d · Booking module V2 | #36 | ✅ | property selector JV/VLC/Cualquiera, live stay summary, "free at the other one" prompt keeping dates, sticky mobile CTA |
| V2e · Property pages V2 (boutique) | #38 | 🟡 | rebuilt: high-impact gallery + lightbox, sticky booking card, quick facts, categorised amenities, getting-there + "Qué tienes cerca" (crawlable), stay info, real breadcrumbs/schema. **No map embed** (needs a maps key; address+geo+distance table cover it for now) |
| V2f · SEO V2 | #39 | ✅ | keyword map + all landings/guides corrected to real locations (Camarena de la Sierra; Mareny de Barraquetes / Les Palmeretes / southern coast), entity signals (VacationRental w/ geo+floorSize+aggregateRating), Camarena keyword targeted |
| V2g · Final visual polish | #40 | 🟡 | lighter header, hero gradient, palette AA, tactile buttons, skeletons, consistent radii/rhythm. Full manual breakpoint review (375→1920) pending — the screenshot tool was unreliable this session; e2e image-layout test added instead |
| V2h · Production-ready | #42 | ✅ (code) | `/api/health` (status + integrations, no secrets), boot config banner (`instrumentation.ts`), `error.tsx` + `global-error.tsx`, email log persisted + shown in `/admin/pagos` (payments + emails), internal reservation notification, branded email templates, admin form to set Booking iCal import URLs + "Sincronizar ahora", `/api/admin/sync`. `docs/launch-checklist.md` + backup/recovery in SETUP.md. e2e/production.spec.ts (health, headers, no-secrets-in-bundle). **Ticking the launch checklist needs real credentials + a deploy.** |

### V3 batch (issues #43–#52) — conversion + editorial depth

| Sprint | Issues | Status | Notes |
|--------|--------|--------|-------|
| V3 · Discount codes | #45 | ✅ | pure `checkCoupon` (8 tests) + `applyCoupon`; server computes final total (client never sends price/discount); coupon persisted only if server applied it; redeemed exactly once on first confirmation, redemption failure never un-confirms; migration (coupons + redemptions + reservation cols + `redeem_coupon` RPC); memory + supabase repos; `CouponField` on widget & checkout; `/admin/promociones` CRUD; e2e/coupons.spec.ts |
| V3 · Home premium | #43 | ✅ | continuous narrative: cinematic hero + double CTA → trust microblock → availability module → editorial "elige tu escapada" cards → per-destination story woven with **real property-specific advantages** (new `highlights` field, source-backed, ES+EN) → real Booking reviews strip → featured destination guides → direct-booking closing argument + contact CTA. Alternating white/accent backgrounds. Build + a11y (home, home-en) green |
| V3 · Fichas V3 | #44 | 🟡 | "Lo mejor de este alojamiento" (real `highlights`) on property page; `#opiniones` anchor; coupon field already in sticky card (#45); guide links now hub-aware. Remaining: deeper per-property editorial identity pass |
| V3 · SEO transaccional | #47 | ✅ | Landing model: primary `keyword` + `secondaryKeywords`; template rebuilt as a real commercial page (keyword hero + photo + advantages + availability first, then distances table, deep copy, reviews, specific FAQ + FAQPage/Breadcrumb JSON-LD, guide links). `docs/seo/canonical-map.md` (self-canonical everywhere, cannibalization watch-list, ≤3-click depth) |
| V3 · Auditoría final | #51 | ✅ | `e2e/audit.spec.ts`: crawls all 26 sitemap URLs — 200, unique title, self-canonical, 1×h1, meta desc, indexable; + no-broken-internal-links crawl. axe 0 serious on 8 pages. `docs/audits/final-audit.md` (Lighthouse on deployed URL is the remaining manual gate) |
| V3 · Mobile-first | #52 | ✅ | rebuilt mobile header (`MobileMenu` panel, truncating logo, CTA in panel); footer + lang switcher + coupon toggle tap targets ≥ ~32–40px; **0px horizontal overflow** at 320/360/375/390/414/768 on 6 page types (`e2e/mobile.spec.ts`, 36 assertions + menu + CTA). `docs/audits/mobile-audit.md`. WebKit e2e skipped (bundled WebKit doesn't load Tailwind v4 here — real Safari fine; manual iPhone pass on checklist) |
| V3 · CMS ligero | #50 | ✅ | `content_overrides` KV (memory + supabase + migration); `/admin/contenido` edits property SEO/tagline/intro/highlights/nearby/FAQ (with live Google SERP preview + char counts) and guide title/excerpt/lead/**status draft↔published**/order — no deploy. Pure merge in `merge.ts` files (11 unit tests). All content routes ISR 1h + `revalidatePath` on save. Drafts: noindex + out of sitemap + unlinked + preview banner. Slugs immutable (no dup risk). `docs/cms.md` |
| V3 · CRO avanzado | #49 | ✅ | checkout summary always shows breakdown + "pago seguro Stripe" + cancellation summary; quick contact CTA (secondary, non-competing) on home + property + property closing band; **real** scarcity from `occupancy()` (pure, tested) via `getAvailabilityInsight` + `<AvailabilityNote>`, property routes ISR 1h; funnel events `checkout_step`, `checkout_abandoned`, `contact_click`; `docs/cro/cro-v3.md` (events table + abandoned-checkout plan gated on explicit opt-in) |
| V3 · SEO estacional | #48 | ✅ | `src/content/seasonal` + `/ofertas/[slug]`, hand-written pages only (no date×keyword combos, `dynamicParams=false`). `status: draft` → routable but `noindex` + out of sitemap; `published` → indexable + in sitemap + linked from guide hub. 2 published (Navidad Javalambre, verano Valencia) + 1 draft. e2e/seasonal.spec.ts (3 tests: indexable/noindex/404) |
| V3 · Reposicionamiento de marca | #53 | ✅ | "Del Mediterráneo a la nieve, desde Valencia". Valencia repositioned to **playa de la Llastra** (entre Les Palmeres y El Perelló, Sueca), **a pie de playa (~5 m)**, vistas frontales — "Mareny de Barraquetes"/"Les Palmeretes" out of all commercial copy (home, fichas, cards, guide hubs + satellites, landings, seasonal, OG/meta, EN, photo alts). Javalambre drive to slopes corrected **~20 → ~10 min** everywhere (copy, metadata, JSON-LD via headlineDistance/nearby, FAQs, photo alt, paraphrased review). Camarena de la Sierra given village protagonism. Structured data (geo, address, postal, `legal.ts` registry) unchanged per D-008 — `location.city` now feeds only JSON-LD `addressLocality`; components render `location.area · region`. New editorial cluster pages deferred. `tsc` + `next lint` + `build` + 56 unit + 64 chromium e2e green. `docs/seo/keyword-map.md` + `canonical-map.md` updated |
| V3 · CTAs de disponibilidad | #55 | ✅ | Fixed the property-page booking CTAs that jumped to the top: the `<aside>` holding `BookingWidget` used `id="contenido"`, which also belongs to the `<main>` landmark (skip-link target) — the browser resolved `#contenido` to the first match at the top. Now each property's booking module has a stable unique id `#reserva-<slug>` via the new centralized `bookingSectionId`/`bookingSectionHref` helper (`domains/booking/anchor.ts`); closing CTA + sticky mobile CTA both use it. `<main id="contenido">` stays the unique skip-link target. `scroll-mt-24` keeps the module clear of the sticky header; subtle `:target` ring (reduced-motion-safe) on arrival. State (dates/guests/coupon) untouched — anchor nav, no reload. 3 unit + 5 e2e (`property-cta.spec.ts`: both properties, closing + sticky CTA, scrolls away from top, no CTA points at `#`/`#contenido`/`/`). Home/cards/landings/guides CTAs audited — they link to property pages or `#buscador` (unique), no bug. `tsc`+`lint`+`build`+64 unit+70 chromium e2e green |
| V3 · Cupón 10PRAETORIA10 | #54 | ✅ | Activates the promo code `10PRAETORIA10` (10% off, both properties, no expiry/limit, `active`). Production DB via migration `20260828120000_coupon_10praetoria10.sql` (upsert by `code`, re-activates on re-run); DEMO mode seeds the same object from the new `PRAETORIA10_COUPON` domain constant (+ forward-compat upsert for existing stores). Discount is server-computed only (client never sends price/percentage) — infra from #45. 13 coupon unit tests + e2e `10PRAETORIA10` on both properties (incl. lower-case normalization). Shows in `/admin/promociones` via existing `listCoupons`. `tsc`+`lint`+`build`+61 unit+65 chromium e2e green |
| V3 · Guías SEO → hubs | #46 | ✅ | `/guias/javalambre` + `/guias/valencia-playa` pillar hubs (quick facts, TOC, sections w/ anchors, FAQ, Article+Breadcrumb+FAQ JSON-LD, contextual non-aggressive CTA); satellite route `/guias/[hub]/[slug]`; old pillar guides fold into the hub; 301 redirects for moved URLs; sitemap/seo-inventory/property-page links updated; `/guias` index relinked; a11y tests updated (hub + satellite), all chromium e2e green |

### V4 batch (issue #56) — legal data + management intranet (epic, decisions D-009, D-010) — ✅ MERGED TO `main`

The full `reserva → cliente → factura → PDF → calendario → historial → segmento`
chain works end to end and persists (`src/domains/invoicing/chain.test.ts`).
Merged to `main` 2026-08-29 at the user's explicit request. Overview:
`docs/intranet.md`. Sprint detail in `docs/issues.md`.

| Sprint | Scope | Status |
|--------|-------|--------|
| 56-A · Legal data (Part A) | PRAETORIA, S.L. data centralised in `src/content/company.ts`; aviso legal gets full Registro Mercantil / IRUS / administrador / fecha de operaciones; footer + contact page + Organization JSON-LD + transactional-email footer all read from it; 4 legal docs stay separate. Tourist-registry + property geo unchanged (D-008). 8 unit tests | ✅ code |
| 56-B · CRM foundation | `customers` + `customer_merges` migration; `reservation_source` widened (airbnb/other); reservations enriched (customer link, channel detail, guest fiscal data, external locator, manual invoice number, `payment_state`). Pure dedup (email/phone/doc/name+contact) + field-merge + profile stats — 20 unit tests. Repository CRM methods on memory + supabase. `/admin/clientes`: list + filters (canal, alojamiento, consentimiento, repetidores, búsqueda), detail (KPIs, reservation history, duplicate detection + one-click merge), manual create/edit incl. marketing consent w/ date+source. Nav updated | ✅ code |
| 56-C · Reservations intranet | New `external` reservation status (informational, does not hold availability — its iCal block does). `createManualReservation` on memory + supabase. `/admin/reservas/nuevo` (property, channel, dates, guests, amount, "bloquear disponibilidad" toggle, full guest + fiscal block, external locator, invoice number, payment method/state, notes) + `/admin/reservas/[id]` (edit metadata, cancel, customer link). List: channel + payment-state + free-text search filters, customer link, invoice column, rows link to detail. Auto-links/creates the customer from guest data on manual create | ✅ code |
| 56-D · Customers / CRM | Folded into 56-B | ✅ |
| 56-E · Invoicing | `invoices` + `invoice_items` + `invoice_settings` (migration `20260829120000`) with DB immutability triggers (issued invoices frozen; correction = anular + re-emitir). Pure `numbering.ts` (JAV-YY#### / PALM-YY####: parse, format, suggest-next, duplicate + gap detection) + `totals.ts` (configurable exempt-IVA, art. 20.Uno.23º LIVA default) — 18 tests + a flow test. Repo methods memory + supabase. `/admin/facturas` (list + per-series numbering insight incl. gaps), `/admin/facturas/[id]` (draft editor w/ dynamic line rows + live totals, or read-only issued view + issue/cobrada/anular), `/admin/facturas/[id]/documento` (branded print-to-PDF, per-property colour, PRAETORIA S.L. emisor, `requireAdmin`), `/admin/facturas/ajustes` (per-property serie + fiscalidad). "Emitir factura" on the reservation detail precarga cliente/fechas/importe/serie/nº sugerido. D-010 | ✅ code |
| 56-F · Calendar + pricing | `daily_rates` per-date price/min-stay overrides (migration `20260829130000`), wired into the pricing engine + `resolveRateConfig` so the public site, checkout and the Stripe webhook all honour them (schema field optional → old configs still valid). Pure `buildMonthGrid` (Monday-first 6×7, price per cell, reservation coloured by channel, manual block, override badge) + `monthNav`. `/admin/calendario` rebuilt as a visual month grid per property with month nav, legend, multi-day selection and a bulk panel: aplicar precio / estancia mínima / quitar ajustes / cerrar fechas (→ manual block, grouped into contiguous ranges) / abrir fechas. 12 new tests | ✅ code |
| 56-G · Marketing | `segments` + `campaigns` + `campaign_recipients` + `marketing_unsubscribes` (migration `20260829140000`). Pure segment engine (`matchSegment`/`evaluateSegment`/`describeCriteria` — property, channel, language, national/foreign, repeaters, spend, win-back, consent, coupon; all AND-ed; 8 tests). Repo (memory + supabase): customer profiles, segment CRUD w/ live member evaluation, campaign CRUD, `prepareCampaign` (materialises recipients honouring consent + unsubscribes), `markCampaignSent` (records the send intent; recipients marked skipped — real bulk send is **Aún no configurado**, config-status `campaigns`), unsubscribe list (auto-retires consent). `/admin/marketing`: segments + campaigns lists; segment editor with live counts + CSV export (`/admin/marketing/export` route, `requireAdmin`); campaign editor → preparar destinatarios → double-confirm send (type ENVIAR); `/admin/marketing/bajas`. | ✅ code |
| 56-H · Promotions integration | The coupon engine (code, %/fixed, per-property, use/expiry limits, per-reservation redemption tracking, 10PRAETORIA10) was already built in #45/#54. Added: pure `quickCode` (readable code from a label, unambiguous alphabet — 3 tests), `createQuickCouponAction`, "Crear cupón para este cliente" (fiche) / "para este segmento" (segment page) quick forms, and the campaign detail now shows its linked coupon + redemption count. | ✅ code |
| 56-I · Booking/Airbnb → internal records | Pure `planExternalReservations` (imported availability block → create an `external` reservation; drifted dates → update; block left the feed → cancel; a `confirmed` booking that shares a uid is never touched; idempotent — 5 tests). Repo `reconcileExternalReservations` (memory + supabase) + `listImportFeeds`. `sync.ts` runs the reconcile after every iCal import and now iterates Booking ∪ Airbnb ∪ any admin-added channel. `/admin/sincronizacion` gains an Airbnb feed URL field. Imported reservations show in Reservas + the calendar; completing the guest data auto-creates the customer (56-C). | ✅ code |
| 56-J · Search + exports | Per-entity search was already built into the list pages (reservas: localizador/nombre/email/doc/factura/localizador; clientes: nombre/email/tel/doc; facturas: nº/nombre/NIF/email). Added `lib/csv.ts` (RFC-4180 quoting + UTF-8 BOM + CRLF, 2 tests) and `requireAdmin` CSV export routes for clientes, reservas and facturas that honour the page's current filters, plus "Exportar CSV" buttons. Segment CSV export was delivered in 56-G. | ✅ code |
| 56-K · Security / roles / dashboard | `domains/admin/roles.ts` — a capability matrix for `admin` / `gestion` / `lectura` (env `ADMIN_ROLE`, default admin; architecture-ready, one login today) with `assertCapability` wired into every critical mutating server action. `admin_audit_log` repo methods + a non-throwing `logAction` helper wired into reservation cancel/create, invoice issue/void/paid/delete, customer merge, campaign send and calendar close; new `/admin/actividad` page. Dashboard rebuilt against §1: month + property filter, KPI row (ingresos, pagos recibidos, reservas, noches, ocupación), reservas por canal, próximas (30d) + recientes, facturas pendientes de emitir, estado de sincronización, accesos rápidos. Role shown in the admin header. 3 role tests. (noindex + private-PDF protection were already in place.) | ✅ code |
| 56-L · Final E2E + docs | `src/domains/invoicing/chain.test.ts` drives the whole `reserva → cliente → factura → documento → calendario → historial → segmento` chain against the repository and asserts persistence. `e2e/intranet.spec.ts` asserts every intranet route + export endpoint is private/redirects. `docs/intranet.md` (module map, roles, fiscalidad, data model), `docs/api/INDEX.md` (intranet functions + HTTP routes + migrations), `docs/SETUP.md` + `.env.example` (`ADMIN_ROLE`, Airbnb feeds, campaign-send "Aún no configurado"). Merged `develop → main`. | ✅ |

**Issue #56 complete.** `tsc` + `next lint` + `next build` + **134 unit** + **75 chromium e2e** green. Merged to `main` at the user's explicit request. Overview: `docs/intranet.md`.

### Bugfix (2026-08-30) — Booking iCal admin persistence

The iCal import URL lived in `calendar_syncs.feed_url`, the same row
`recordSyncRun()` upserts every sync → the "not configured" run path (and DB read
failures) wiped it to NULL, so the admin fields went blank on refresh. Fix
(D-011): new authoritative table **`channel_feeds`** (migration
`20260830090000`), `recordSyncRun()` no longer touches `feed_url`,
`setImportFeedUrl()` does a read-after-write verification and throws a real error
on failure (`{ ok: false, error }` — "Guardado" only on a confirmed write), DEMO
mode throws `PersistenceUnavailableError` instead of faking success,
`/admin/sincronizacion` rebuilt with per-property per-channel status
(configurado / no configurado / error + última sincronización + eventos).
Verified with `e2e/admin-ical-feeds.spec.ts` (2 tests) + a manual run with the
owner's real Booking URLs: saved → survived a full reload → "Sincronizar ahora"
imported 9 reservations from the persisted value → not wiped.

### Bugfix (2026-08-30) — iCal EXPORT feed rejected by Booking.com

Booking rejected the export URL as "not a valid iCal URL" (the browser still
downloaded a working .ics). Fix (D-012): clean tokenized path
`/api/ical/<slug>/<token>.ics` (no query string; legacy `?token=` kept),
response is **200 with no redirect**, `text/calendar; charset=utf-8`, explicit
`Content-Length`, **no `Content-Disposition`**. `generateIcs` now folds every
line to ≤75 octets, escapes TEXT, drops `METHOD:PUBLISH`, and **never emits an
empty calendar** (a bookings-free feed still has one inert VEVENT). Export
telemetry can't 500 the feed. `/admin/sincronizacion` shows the exact clean
HTTPS URL. `e2e/ical-export.spec.ts` (6 tests) + `curl` verify 200/no-redirect/
headers/RFC. **Owner must confirm Booking accepts both URLs** (no access to the
Booking extranet). Now 142 unit + 83 chromium e2e.

### V5 batch (issue #57) — capacidad correcta + blog/CMS SEO — ✅ MERGED TO `main` (2026-08-30)

| Part | Scope | Status |
|------|-------|--------|
| 57 · Capacidad | Valencia Frente al Mar: `capacity.guests` 4 → **6**; `bedrooms` **3** (owner confirmó 3 habitaciones, no 2 — D-013); `bedConfig` reescrito; toda la copia ES+EN "4 personas/huéspedes" → 6 (`valencia.ts`, `landings/index.ts`). JSON-LD `occupancy`/`numberOfRooms`, tabla de datos y `BookingWidget maxGuests` derivan de `capacity.*`. Javalambre ya 6 / 2 — confirmado | ✅ |
| 57 · Blog CMS | `src/domains/blog/*` (types · zod schema · renderer Markdown propio y seguro, 10 tests · helpers, 9 tests · store sobre `content_overrides`, sin migración · acciones server). `/admin/blog` lista + `/nuevo` + `/[id]`: crear/editar/borrador/publicar/programar/eliminar; campos: slug, extracto, contenido, imagen destacada+ALT, categoría, etiquetas, destino, alojamiento CTA, autor, fechas, SEO/OG. Capacidad `content.write` (admin+gestión). 2 borradores semilla en DEMO | ✅ |
| 57 · Blog público | `/blog` (índice, ISR 1h) + `/blog/[slug]` (`dynamicParams`, SSG desde publicados). `Article`+`BreadcrumbList` JSON-LD, breadcrumbs, canonical, sitemap automático (`getIndexableRoutes`), CTA contextual a la ficha, "sigue leyendo", 3 últimos en la home. `Blog` en header + menú móvil + footer. Sin canibalización con `/guias` | ✅ |
| 57 · Fix 404 `/valencia` | `/[property]` + `/en/[property]`: `dynamicParams = false` → **`true`**. Slugs conocidos siguen pre-generados; un slug válido omitido por un build se renderiza bajo demanda en vez de 404 permanente. El 404 de producción solo se reproduce en el sitio desplegado (Hostinger) — **requiere redespliegue limpio de `main`** | ✅ (código) |

`tsc` + `next lint` + `next build` limpios · **161 unit** · **86 chromium e2e**
(`e2e/blog.spec.ts` + `/blog` en `accessibility.spec.ts`). Merged `develop → main`
2026-08-30 por instrucción explícita del usuario.

### Bugfixes (2026-08-30, post-#57) — merged to `main`

| Fix | Detalle | Decisión |
|-----|---------|----------|
| Calendario público desfasado un día | `AvailabilityCalendar` construía la fecha de cada celda con `new Date(y,m,d).toISOString()` → en España (UTC+1/+2) el día 1 salía como el último del mes anterior (junio empezaba con "31" de mayo). Nuevo módulo puro `src/lib/calendar-cells.ts` (`monthCells`, 7 tests); `rangeClear` y el chequeo de "pasado" pasan a strings/UTC; `AvailabilitySearch.todayPlus` → `setUTCDate`. El calendario del admin ya estaba bien | D-015 · L-006 |
| La URL de sincronización iCal se borra en cada redespliegue | En modo demo (sin Supabase) la URL vive en `.data/demo.json`, que el redespliegue reemplaza. Nueva variable de entorno de reserva `ICAL_IMPORT_<ALOJAMIENTO>_<CANAL>` (`feed-config.ts`, 4 tests); orden: valor guardado → variable de entorno → fichero de contenido. `/admin/sincronizacion` lo indica; `.env.example` documenta las 4 variables | D-016 |

`tsc` + `lint` + `build` limpios · **172 unit** · **86 chromium e2e**.

### Build fix (2026-08-31) — Supabase `property_busy_ranges` + prerender decoupling — on `main`

`next build` failed with `property_busy_ranges` "not found in the schema cache".
Two faults: (1) the booking RPCs were **never deployed** to production Supabase;
(2) `<AvailabilityNote>` was an async server component so the ISR property-page
prerender read live availability. Fix (D-021): idempotent migration
`20260831120000_availability_rpc.sql` (hardened `property_busy_ranges` /
`is_stay_available` — `security definer`, pinned `search_path`, half-open
`[check_in, check_out)`, consolidates reservations + all blocks, PII-free
`execute` to anon, mutating RPCs `service_role` only, `notify pgrst`);
`<AvailabilityNote>` → client component fetching new `force-dynamic`
`/api/properties/[property]/availability-insight`; new Supabase publishable/secret
key names accepted (legacy still works); DEMO repo + SQL share the pure
`src/domains/booking/busy-ranges.ts`. `busy-ranges.test.ts` (14) +
`supabase/tests/property_busy_ranges.test.sql`. Build verified in DEMO **and**
with Supabase configured against an unreachable DB. 226 unit · full e2e green.

### V6 batch — issues #58, #59, #60

| Issue | Scope | Status |
|-------|-------|--------|
| #59 · Calendario checkout | The half-open `[check-in, check-out)` model was already correct in the engine, pricing min-nights, iCal parser and Postgres exclusion constraints. Only the public `AvailabilityCalendar` was wrong: it disabled every `busy` day, blocking a check-out on a day another guest arrives (the 21→24 case). New pure `src/domains/booking/calendar-select.ts` (15 tests, all 8 mandatory cases); calendar rebuilt on it — departure-only days stay clickable, drawn as a diagonal half-cell + `data-role="exit-only"` + legend; min-stay by real nights, red below the minimum. `e2e/calendar-checkout.spec.ts`. D-017 | ✅ on `develop` |
| #58 · Limpieza opcional | `RateConfig.cleaningFeeCents` → configurable `fees: StayFee[]` (enabled/amount/description/taxable). Pure `fees.ts` (24 tests w/ engine). Default OFF both properties; owner toggles from Admin → Precios y reglas → "Cargos opcionales", no redeploy. Legacy fallback preserved. `Quote.cleaningFeeCents` → `fees`/`feesCents` (no 0 € line possible). Stripe/invoice already bill the exact total. Valencia `maxGuests` 4→6 (D-019). D-018. `e2e/cleaning-fee.spec.ts` | ✅ on `develop` |
| #60 · Admin Panel V2 | Premium redesign epic — pragmatic in-code build (no design handoff), branch `feat/60-admin-v2`. **All sprints done; "definición de terminado" e2e passes.** D-020. | ✅ code (merge pending) |

**#58 + #59:** merged to `main` (commit d66a91a). `tsc` + `next lint` + `next
build` clean · **199 unit** · **full chromium e2e 89 green**. Owner redeploys
`main` (no migration).

**#60 — branch `feat/60-admin-v2` · 212 unit · admin e2e + public e2e green:**
- ✅ 60-A shell: `admin.css` (scoped `.admin-shell` system), `AdminNav`
  (11-item IA + "Más"), `AdminTopbar` ("Acciones" menu), responsive drawer,
  `/admin/alojamientos` hub, `SiteChrome` (no public chrome under `/admin`).
- ✅ 60-B dashboard: entradas/salidas 7d, alojados ahora, ocupación 30/60/90,
  huecos difíciles de vender (`src/domains/calendar/gaps.ts`), pagos con
  incidencia, canal con barras.
- ✅ 60-C/D calendar + price editing: `CalendarMonth` rebuilt; selection helpers
  (mes / entre semana / fin de semana / semana); price modes fixed € **or**
  percentage (`applyDayPricePercentAction`); **preview** (N noches · media
  actual → media nueva); "✓ Guardado" + "afecta a muchas fechas". `data-date` /
  `data-cell-state` on cells. `e2e/admin-calendar.spec.ts`.
- ✅ 60-E stay rules: `sellExactGaps` — a stay that exactly fills a gap between
  two occupied spans is sold below the minimum (pure `src/domains/booking/
  gap-fill.ts`, 7 tests; `buildQuote` `skipMinNights` hook; toggle in RatesForm).
  `e2e/gap-fill.spec.ts`.
- ✅ 60-F per-property tabbed fiche `/admin/alojamientos/[slug]?tab=…`
  (General incl. capacidad · Precios y cargos = embedded RatesForm · Calendario ·
  Contenido y SEO · Políticas · Integraciones = per-property iCal forms).
- ✅ 60-G reservations: `.admin-table`, quick-filter chips, noches + estado
  estancia; detail page restyled + status timeline.
- ✅ 60-H: calendar save-confirmation + many-dates warning; whole-admin
  harmonisation via token remapping on `.admin-shell` (no per-file edits to the
  ~11 legacy pages). Remaining nice-to-haves (undo on price/availability,
  deeper optimistic UI, per-page mobile audit) tracked as follow-ups — not in
  the issue's DoD.
- ✅ **`e2e/admin-dod.spec.ts`** drives the issue's whole "definición de
  terminado" flow end to end, no manual steps — passes.

### V4 conversion batch (master issue #98) — Phases 1–3 + infra #61/#63/#64

Optimises direct-booking conversion. Architecture in D-022 (Phase 1) and D-023
(infra). All on `develop`, ready for `main`.

| Issues | Scope | Status |
|--------|-------|--------|
| #86–#93 (Phase 1) | `alternatives.ts` rescue dates (priced, real availability only) · `stay.ts` sessionStorage booking store + `BookingBar` in `SiteChrome` · `RatingBadge` (Booking /10, per-property, renders nothing without data) · `directBooking` factual compare — **no public discount codes, no fake struck prices** · MAR/NIEVE `ExperienceSelector` · `PropertyPageView` impact block + "ideal para" chips + Javalambre weekend itinerary · `ResponsivePhoto.focal` → object-position + lightbox swipe | ✅ code (merged to `main` earlier: 4569ca9 / 8c2d209) |
| #94/#95/#96 (Phase 2 SEO) | 3 local landings (playa de la Llastra, El Perelló, Camarena de la Sierra) · 2 seasonal offer pages · blog post → property CTA strip + `PreferProperty` · `docs/seo/blog-calendar.md` | ✅ on `develop` (9a18c0a) |
| #97 (Phase 3) | `WhatsAppButton` — link-based `wa.me` concierge, prefilled with property + dates when known, hidden on `/admin`, `NEXT_PUBLIC_WHATSAPP_NUMBER` gated | ✅ on `develop` (65fccaa) |
| #61/#63/#64 (infra) | `.github/workflows/ci.yml` (quality · e2e · security) · `strictProductionBlockers()` fail-closed boot under `PRODUCTION_STRICT` · `requireServiceAuth()` on cron + iCal-import endpoints (`CRON_SECRET`, constant-time, never 200 without proof) | ✅ on `main` (0afd32d) |
| #75 (infra) | `20260831130000_rls_hardening.sql` — RLS enabled+forced on all 24 app tables (`content_overrides` was the gap), anon stripped of every table/RPC grant, default privileges locked, availability RPCs → service_role. `rls_hardening.test.sql`. D-024 | ✅ on `develop` |
| #83 (infra) | `repository/contract.ts` shared behavioural spec + `contract.memory.test.ts` (9 cases) + static memory⇔supabase method-parity check. D-025 | ✅ on `develop` |
| #84 (infra) | `feed-health.ts` stale/failing verdict on `/admin/sincronizacion` + `conflicts.ts` feed-vs-direct-booking detection in `ImportReport`/`RunSyncButton`. 12 tests. D-025 | ✅ on `main` (141ff1d) |
| #82 (product) | pure `analytics/kpis.ts` + `/admin/analitica` — 12-month occupancy/ADR/RevPAR/channel-mix/lead-time/cancellation view, per-property, MoM deltas. 12 tests. D-026 | ✅ on `develop` |

**Content-accuracy constraint (user, 2026-08-31, L-008):** the `10PRAETORIA10`
code is **campaign-only — never shown on the public site** (it still works when a
guest types it). Javalambre has **only a guardaesquís room in the building**; the
forfait and equipment rental are at the resort, not the building. Full sweep done
across `site.ts`, `DirectBooking.tsx`, `javalambre.ts` (ES+EN), 4 landings, 2
seasonal pages.

`tsc` + `next lint` + `next build` clean · **260 unit** · targeted chromium e2e
(production, whatsapp, smart-availability, booking-bar, accessibility, audit) 20
green. (The #61/#63/#64 merge to `main` at 0afd32d carried a `tsc`-only failure
in `e2e/production.spec.ts` — a heterogeneous header array; fixed in the #75/#83/#84
commit. `next build` was unaffected.)

**Owner follow-ups for this batch:** `supabase db push` (migrations through
`20260831120000`); set `CRON_SECRET` on Hostinger; decide `PRODUCTION_STRICT`
(recommended `true` once Supabase + Stripe live keys are set); optional
`NEXT_PUBLIC_WHATSAPP_NUMBER`; redeploy `main`.

## Exact position

**2026-08-31 — V4 "Sales Machine" (master #98) + buildable infra, all on `main`:**
`develop` and `main` level. Merged this session:
- `0afd32d` — V4 conversion #86–#97 (booking bar, rescue dates, rating badge,
  direct-booking compare, MAR/NIEVE selector, local SEO landings + seasonal
  pages, blog→property CTAs, WhatsApp concierge) + infra #61/#63/#64 (CI
  workflow, fail-closed `PRODUCTION_STRICT`, `CRON_SECRET` service auth).
- `141ff1d` — infra #75 (RLS hardening migration), #83 (repository behavioural
  contract + memory⇔supabase parity), #84 (stale-feed + cross-channel conflict
  detection).
- `4f2c85f` — #82 BI (`/admin/analitica` — occupancy/ADR/RevPAR/channel mix,
  12-month, per-property).
- Content-accuracy sweep held throughout (L-008): no public discount codes;
  Javalambre building = guardaesquís only, forfait/rental at the resort.

`tsc` + `next lint` + `next build` clean · **269 unit** · targeted chromium e2e
green (production incl. cron auth, whatsapp, smart-availability, booking-bar,
intranet incl. `/admin/analitica`, accessibility, audit, admin-dod).

**Owner follow-ups (blocking a real deploy, not code):**
1. `supabase db push` — apply migrations through `20260831130000` (availability
   RPCs + RLS hardening).
2. Set new Supabase key names (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`) or keep legacy; set `CRON_SECRET`; decide
   `PRODUCTION_STRICT` (recommend `true` once Supabase + Stripe live);
   optional `NEXT_PUBLIC_WHATSAPP_NUMBER`.
3. Redeploy `main` on Hostinger (clean build cache).

**"Do all issues ALL" — what is NOT done and why:**
- **Large, buildable, deferred by #98 (no booking impact):** #76 durable jobs +
  transactional outbox, #77 design system V4 + visual regression, #62 distributed
  rate limiting (needs a KV provider choice), #78 Lighthouse CI (needs the
  deployed URL).
- **Owner-decision-gated (per the issues.md table) — cannot be built without the
  owner's input on vendors / legal / credentials:** #65 (Supabase Auth + MFA),
  #66 (observability vendor), #67 (refund policy + Stripe live), #68 (guest
  portal), #69 (guest comms provider), #70/#71 (ops workflows), #72 (SES.
  HOSPEDAJES Guardia Civil creds), #73 (marketing provider), #74 (revenue
  strategy), #79 (DPO/legal), #81 (storage bucket), #85 (ES/EN translation
  effort). Phase-1 polish items #86–#88/#93 still 🟡 (need eyes on real photos /
  a map embed decision).

### (historical) Issue #57 + #56

**Issue #57 (capacidad + blog/CMS) merged to `main`** (2026-08-30). Before it,
issue #56 (management intranet) merged 2026-08-29. The public site + booking funnel are unchanged from the V3 batch;
the intranet under `/admin` is new: reservas (manual + all channels), CRM with
dedup/merge, invoicing with per-property series + immutable issued invoices +
print-to-PDF document, operational calendar with per-date pricing, marketing
(segments + campaigns + CSV export, real send "Aún no configurado"), roles
(admin/gestion/lectura), audit log. Runs in DEMO/in-memory now; production needs
the `20260829*` migrations. See `docs/intranet.md`.

`tsc` + `next lint` + `next build` + 134 unit + 75 chromium e2e green.

Remaining before V1 "done" (issue #22):
1. **User adds real Supabase + Stripe(test) + Resend keys + Booking iCal URLs**
   (docs/SETUP.md) → S10/S11/S13 move VERIFY→done; then run the full S21 checklist
   with the remaining security scenarios (duplicate webhook, repeated iCal sync).
2. **User provides real property photos/content** → replace placeholders in
   `src/content/properties/*.ts`, flip `status` flags; add a WebP/AVIF pipeline
   for the real assets (#27); replace placeholder OG art.
3. Deploy to the domain → run Lighthouse (targets Perf ≥90 mobile, SEO ≥95,
   A11y ≥90), validate structured data in Rich Results Test, submit sitemap in GSC.
4. Nice-to-have: #33 SEO evolution dashboard, deeper local schema (#26), EN
   landings/guides, deeper visual micro-interactions & skeletons (#24).
5. `develop → main` merge + Vercel deploy — the user's call.

## Branches

Both `develop` and `main` are on origin and level. `main` history: `b5ee968`
(V1+V2) → #53 → #54 → #55 → FAQ polish → #56 (intranet) → iCal fixes → #57
(capacidad + blog) → Supabase build fix → #58/#59 → #60 (admin V2) → calendar
marker → V4 Phase 1 (#86–#93) → `0afd32d` V4 #94–#97 + infra #61/#63/#64 →
`141ff1d` infra #75/#83/#84 → `4f2c85f` #82 BI. Each merged from `develop` at the
user's standing "push to main ALL" instruction. Ongoing work continues on
`develop`. Production runs on Hostinger in DEMO mode (`/api/health` →
`demoMode: true`); a real deploy needs `supabase/migrations/*` applied + the new
key names + `CRON_SECRET` + a clean redeploy of `main`.

## Open items / blocks

- **External services (non-blocking, by user decision D-003):** Supabase, Stripe, Resend
  run on placeholder keys in `.env.example`. End-to-end payment/email verification is
  `VERIFY` until the user adds real keys. Setup guide: `docs/SETUP.md`.
- **Property content (non-blocking, D-004):** Javalambre & Valencia content/photos are
  configurable placeholders in `src/content/properties/`. Nothing invented is presented
  as real. Real Booking content drops in via those files + admin.

## Ready for `main`

**V3 batch (#43–#52) + issue #53 (brand repositioning) + issue #54 (10PRAETORIA10 coupon) + issue #55 (availability CTA anchors) are complete on `develop`.**
Home V3, property pages V3, guide hubs + 301s, discount codes, transactional SEO
consolidation, seasonal pages, CRO, light CMS, final audit, mobile-first pass, and
the "Del Mediterráneo a la nieve, desde Valencia" repositioning (playa de la
Llastra + Javalambre ~10 min correction) — all committed, with `tsc` + `next lint`
+ `npm run build` + 56 unit + 64 chromium e2e green.

**Polish (2026-08-28, no issue):** removed the excessive whitespace between the
home FAQ accordion and the footer — the gap was three compounding spacers
(`FaqBlock py-14` + `<main> pb-16` + `footer mt-24`). Now: `FaqBlock` bottom
padding is `pb-10 sm:pb-20` (content-sized, ~40px mobile / ~80px desktop), `<main>`
has no bottom padding, `footer` has no top margin (its `border-t` + `py-14` carry
the separation), and the mobile/tablet sticky-bar clearance moved to the footer's
last row (`pb-16 lg:pb-0`) so it is real clearance, not visible gap. Added the two
new general FAQs (ES + EN): "¿Cómo funciona la reserva directa…?" and "¿Qué
diferencia hay entre reservar aquí y hacerlo a través de una plataforma?".
`e2e/home-faq-spacing.spec.ts` locks the desktop gap to 64–96px and the mobile
gap tighter.

Merged to `main` at the user's explicit request (2026-08-27, then 2026-08-28
after issue #53, then #54 `c0d7203`, then #55 `8e2ec3a`, then the FAQ-spacing
polish). Post-merge manual gates remain (real service keys +
`docs/launch-checklist.md`, Lighthouse on the deployed URL, iOS Safari flow pass)
— see `docs/audits/final-audit.md`. The Vercel deploy is the owner's call.

**Owner check for #53:** the geo coordinates / street address / postal code for
Valencia were NOT changed (no verified new values). If the apartment's real
coordinates should point to la Llastra rather than the current Mareny de
Barraquetes point, provide them and the JSON-LD `addressLocality` + address block
can be updated in a follow-up.
