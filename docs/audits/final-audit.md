# V3 final audit (issue #51)

_Run: 2026-08-27. Automated via `e2e/audit.spec.ts` + `e2e/accessibility.spec.ts`
+ `npm run build` + `npx vitest run`. Lighthouse needs a deployed URL and is the
one remaining manual gate (see below)._

## SEO — crawl of every sitemap URL (`e2e/audit.spec.ts`)

All **26** indexable URLs verified:

- ✅ HTTP 200
- ✅ Unique `<title>` (no duplicates across the whole surface)
- ✅ Self-referential `<link rel="canonical">`
- ✅ Exactly one `<h1>`
- ✅ Non-empty `meta[name="description"]`
- ✅ `meta[name="robots"]` = index,follow (drafts / `/admin` / booking funnel are
  correctly excluded from the sitemap and carry `noindex`)
- ✅ hreflang + x-default on the bilingual pages (home, property pages)

Structured data present: Organization + WebSite (layout), VacationRental +
BreadcrumbList + FAQPage (property), Article + BreadcrumbList + FAQPage (guides
& hubs), BreadcrumbList + FAQPage (landings & seasonal). Validate in Google's
Rich Results Test after deploy.

Cannibalization: mapped in `docs/seo/canonical-map.md` — one primary keyword per
URL, property page owns the head term, no two URLs compete for the same intent.

Internal linking / orphans: `e2e/audit.spec.ts` crawls the entry pages and
asserts every internal link resolves (200/301/308). Every commercial page is
≤ 3 clicks from home (home → property → landing; home → /guias → hub → guide).

## Accessibility (`e2e/accessibility.spec.ts`)

axe-core, 0 serious/critical violations on home (ES/EN), property, landing,
guide hub, guide, legal and checkout. AA contrast holds (palette tokens were
darkened in V2). Skip link, visible focus, `prefers-reduced-motion` respected.

## Conversion flow

`e2e/booking-flow.spec.ts` + `e2e/coupons.spec.ts`: home → property → dates →
(coupon) → checkout → Stripe redirect, for **both** properties and in English,
all green in DEMO. Coupon valid / invalid / not-applicable paths covered;
expired/exhausted covered by `coupons.test.ts`. `not_configured` states render
the demo-mode notice without blocking (issue #41).

## Performance / CWV

- Pages are static or ISR (`revalidate = 3600`); no per-request DB work on the
  marketing surface beyond the availability snapshot.
- `next/image` everywhere with responsive `sizes`; AVIF/WebP; LCP hero eager,
  rest lazy. `e2e/images.spec.ts` guards decode.
- CSP keeps `'unsafe-inline'` for scripts only to preserve static generation;
  no render-blocking third-party CSS.
- **Lighthouse (mobile) targets — to confirm on the deployed URL:** Perf ≥ 90,
  SEO ≥ 95, A11y ≥ 90, Best Practices ≥ 95. Cannot be scored locally against
  `next start` reliably; it is the final manual gate in `docs/launch-checklist.md`.

## Console

No errors in the automated runs. `error.tsx` / `global-error.tsx` log via
`console.error` only.

## Fixes made during this audit

- Mobile header/nav rebuilt, footer + language switcher + coupon toggle tap
  targets enlarged, horizontal overflow eliminated at all breakpoints
  (`docs/audits/mobile-audit.md`).
- Guide URL 301s wired for the hub migration (issue #46).
- Landing pages de-thinned (photo, advantages, distances, reviews, FAQ) so no
  transactional page is thin content (issue #47).

## Remaining before flipping to production

1. Real Supabase / Stripe (test) / Resend keys + Booking iCal URLs → run the
   full `docs/launch-checklist.md` including duplicate-webhook and repeated-sync
   scenarios.
2. Deploy → Lighthouse mobile, Rich Results Test, submit sitemap in GSC.
3. Manual iOS Safari pass of the booking flow at 375/390 px.
4. `develop → main` merge + Vercel deploy — the owner's call.
