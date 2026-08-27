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
| S15 · Keyword arch + SEO landings | #15, #16, #25, #26, #31 | 🟡→✅ | 6 transactional landings + **12 destination guides (hub & spoke)**, all real copy, distinct intent. Keyword→URL map doc still to formalise (#15) |
| S16 · Analytics + Search Console | #19, #33 | 🟡 | GA4 loader (consent-default-denied), typed event wrapper w/ PII filter, events wired, **GSC verification meta**. Needs GA4 id + live GSC + evolution dashboard (#33) |
| S17 · Legal pages | #20 | 🟡 | 4 configurable legal docs, `[[PENDIENTE]]` markers, checkout terms checkbox, per-property cancellation policy |
| S18 · i18n ES/EN | #29 | 🟡 | ES root + `/en` for home & property pages, dictionaries, hreflang, LanguageSwitcher, reviewed EN property copy. EN checkout copy + EN landings/guides pending |
| S19 · CRO | #30 | 🟡 | direct-booking block near CTA, total price up front, trust signals, no false urgency. A/B experiment scaffolding not built |
| S20 · Perf/a11y/security hardening | #21 | 🟡 | **CSP** + security headers, rate limiting, server validation (zod), skip-link, focus styles, reduced-motion. Full Lighthouse/axe pass pending |
| S21 · Final E2E QA | #22 | 🟡 | **Playwright critical-path E2E green for BOTH properties + independence** (DEMO). Full checklist w/ real services + security scenarios pending |

## Exact position

Working `develop` (pushed). 8 commits. Platform builds static (37 pages), 34 unit
+ 3 Playwright E2E green. Full booking flow verified end-to-end in DEMO for both
properties. ES site substantially complete; EN priority pages live with correct
hreflang/canonical. Admin can edit prices and they reach the public site.

Remaining before V1 "done" (issue #22):
1. User adds real Supabase + Stripe(test) + Resend keys + Booking iCal URLs → then
   S10/S11/S13 move VERIFY→done and S21 runs the full checklist.
2. User provides real property photos/content → S7/S8 content, WebP pipeline.
3. EN checkout copy + EN landings/guides; #15 keyword map doc; #33 SEO dashboard;
   deeper visual + Lighthouse/axe pass; #30 experiment scaffolding.
4. `develop → main` merge + Vercel deploy (user's call).

## Branches

`develop` is pushed to origin and holds all work. `main` has only the initial
commit and is **not** pushed / not updated — the `develop → main` merge and the
Vercel deploy are the user's call (nothing reaches users until then).

## Open items / blocks

- **External services (non-blocking, by user decision D-003):** Supabase, Stripe, Resend
  run on placeholder keys in `.env.example`. End-to-end payment/email verification is
  `VERIFY` until the user adds real keys. Setup guide: `docs/SETUP.md`.
- **Property content (non-blocking, D-004):** Javalambre & Valencia content/photos are
  configurable placeholders in `src/content/properties/`. Nothing invented is presented
  as real. Real Booking content drops in via those files + admin.

## Ready for `main`

Nothing yet.
