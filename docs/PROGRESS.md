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

### V4 batch (issue #56) — legal data + management intranet (epic, decision D-009)

Merge to `main` only when `reserva → cliente → factura → PDF → calendario →
historial → segmento` works end to end and persists. Sprint tracker + per-sprint
detail in `docs/issues.md`.

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
| 56-K → 56-L | Roles/dashboard/logs, final E2E | ⬜ |

`tsc` + `next lint` + `next build` + 130 unit green after 56-J.

## Exact position

Working `develop` (pushed, 13 commits). Platform builds static (~40 pages), 34
unit + 4 booking E2E + 7 axe a11y tests all green. Full booking flow verified
end-to-end in DEMO for both properties **and in English**. ES site content-complete
(2 property pages, 6 landings, 12 guides, 4 legal, home). EN home + property +
full checkout live with correct hreflang/canonical. Admin: auth, dashboard,
reservations, manual blocks, **price editor (live on site)**, sync health.

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

Both `develop` and `main` are on origin. `main` was merged from `develop` at the
user's explicit request (release commit `b5ee968`, "Praetoria Vacacional V1 + V2").
Ongoing work continues on `develop`; merge to `main` again for the next release.
The Vercel deploy itself is still the user's to trigger.

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
