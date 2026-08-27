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
| V3 · Guías SEO → hubs | #46 | ✅ | `/guias/javalambre` + `/guias/valencia-playa` pillar hubs (quick facts, TOC, sections w/ anchors, FAQ, Article+Breadcrumb+FAQ JSON-LD, contextual non-aggressive CTA); satellite route `/guias/[hub]/[slug]`; old pillar guides fold into the hub; 301 redirects for moved URLs; sitemap/seo-inventory/property-page links updated; `/guias` index relinked; a11y tests updated (hub + satellite), all chromium e2e green |

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

Nothing yet.
