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
| S5 · Design system + branding | #2, #24 | 🟡 | tokens + ski/sea theming + core components (Button, cards, gallery, FAQ, reviews). Premium visual pass still pending |
| S6 · Home + search | #3 | 🟡 | split hero, Playa/Nieve selector, live global search with per-property price+CTA, sticky mobile CTA, FAQ+JSON-LD |
| S7 · Property pages | #4, #5 | 🟡 | full functional pages (gallery, capacity, sections, distances, cancellation, booking widget, reviews, FAQ). Content = placeholder (D-004) |
| S8 · Galleries + reviews | #17, #18, #27 | 🟡 | reusable Gallery (LCP hero eager, rest lazy), empty-safe ReviewsBlock w/ source attribution. Needs real photos + WebP pipeline |
| S9 · Checkout (3 steps) | #10, #23 | 🟡 | 3-step flow, server re-quote + re-check, pending hold w/ expiry, idempotency key (refresh/back safe), success/error pages. Verified E2E in DEMO |
| S10 · Stripe + webhooks | #11 | 🟡 VERIFY | Checkout Session w/ metadata, signed idempotent webhook, confirm only via webhook. Needs real test keys to verify |
| S11 · Emails | #12 | 🟡 VERIFY | Resend module, per-property confirmation + payment-failed templates, 3× retry, email failure never changes reservation state |
| S12 · Admin panel | #13 | 🟡 | signed-cookie auth, dashboard (revenue/occupancy), reservations list+filter+cancel(confirm), manual blocks, sync health. Server-guarded |
| S13 · iCal sync | #9 | 🟡 | parser+generator (7 tests, idempotent), per-property export feed (token), import endpoint+cron, dedup by (property,source,uid) |
| S14 · Technical SEO | #14, #28, #32 | 🟡 | dynamic sitemap/robots from route registry, canonical, OG, JSON-LD (Org/WebSite/VacationRental/Breadcrumb/FAQ), noindex admin/checkout, breadcrumbs |
| S15 · Keyword arch + SEO landings | #15, #16, #25, #26, #31 | 🟡 | 6 transactional landings live w/ distinct intent + real copy. Content clusters/guides + copy polish pending |
| S16 · Analytics + Search Console | #19, #33 | 🟡 | GA4 loader (consent-default-denied), typed event wrapper w/ PII filter, events wired (search/select/begin_checkout/payment_started/confirmed). Needs GA4 id + GSC |
| S17 · Legal pages | #20 | 🟡 | 4 configurable legal docs, `[[PENDIENTE]]` markers, checkout terms checkbox, per-property cancellation policy |
| S18 · i18n ES/EN | #29 | ⬜ | architecture is locale-ready; EN routing + content not built |
| S19 · CRO | #30 | 🟡 | direct-booking block near CTA, total price up front, trust signals, no false urgency. A/B experiments not built |
| S20 · Perf/a11y/security hardening | #21 | 🟡 | security headers, rate limiting, server validation (zod), skip-link, focus styles, reduced-motion. Full Lighthouse/axe pass pending |
| S21 · Final E2E QA | #22 | ⬜ | partial DEMO E2E passed; full both-property checklist pending real services |

## Exact position

First vertical slice committed: the platform builds, all pure-logic engines are
tested, and the **full booking flow works end-to-end in DEMO mode** for both
properties (search → hold → guest → pay(sim) → confirm → blocked dates → admin).
Double-booking, idempotent checkout and hold expiry verified.

Next: S5/S6/S24 visual quality pass, then wire real Supabase/Stripe/Resend and
run S21 QA. Then S15 content, S18 i18n, S20 hardening.

## Open items / blocks

- **External services (non-blocking, by user decision D-003):** Supabase, Stripe, Resend
  run on placeholder keys in `.env.example`. End-to-end payment/email verification is
  `VERIFY` until the user adds real keys. Setup guide: `docs/SETUP.md`.
- **Property content (non-blocking, D-004):** Javalambre & Valencia content/photos are
  configurable placeholders in `src/content/properties/`. Nothing invented is presented
  as real. Real Booking content drops in via those files + admin.

## Ready for `main`

Nothing yet.
