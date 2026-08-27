# Pre-launch technical SEO audit (issues #32, #14)

Status at commit on `develop`. ✅ done · 🔶 needs a real domain/deploy to confirm · ⬜ open

| Check | Status | Evidence / notes |
|---|---|---|
| Status codes correct (200 / 404) | ✅ | `not-found.tsx`; unknown property/landing/guide → `notFound()` (dynamicParams=false) |
| Canonical on every page, self-referential | ✅ | `pageMetadata` → `alternates.canonical`; per-locale (EN → `/en/...`, never cross-canonical) |
| `robots.txt` | ✅ | `app/robots.ts` — disallows `/admin/ /api/ /reservar/ /reserva/`; points to sitemap + host |
| `sitemap.xml` | ✅ | `app/sitemap.ts` from `navigation.ts` route registry — home, EN home, 2 properties, 2 EN properties, 6 landings, 12 guides, 4 legal, 3 info |
| `noindex` only where correct | ✅ | admin/checkout/api via `X-Robots-Tag` (middleware) + route metadata; nowhere else |
| No orphan indexable pages | ✅ | every landing/guide linked from its property page and/or `/guias`; properties linked from home + header + footer |
| Unique title / H1 / meta per URL | ✅ | property/landing/guide content each define their own; `title:{absolute}` bypasses template doubling |
| Redirects | 🔶 | none needed yet; www→apex + http→https handled at Vercel/DNS on deploy |
| Internal links without 404 | ✅ | links built from the same registries that generate the routes; E2E + build would fail otherwise |
| URL params don't create indexable dups | ✅ | only `/reservar` uses query params and it is `noindex`; search is client-side POST, no crawlable URL state |
| Calendar / search don't create index bloat | ✅ | calendar is an API route (`noindex` prefix); no `?date=` pages exist |
| Structured data valid | ✅ (VERIFY with Rich Results Test on deploy) | Organization, WebSite, VacationRental, BreadcrumbList, FAQPage. Placeholder geo/rating omitted so JSON-LD never contradicts the visible page |
| `hreflang` correct (ES/EN) | ✅ | bidirectional + `x-default` on `/`, `/javalambre`, `/valencia` and their `/en` counterparts — verified in rendered HTML |
| Core Web Vitals | 🔶 | static generation for all marketing pages; hero LCP image eager + `fetchpriority=high`, rest lazy; fonts `display:swap`. Run Lighthouse/CrUX after deploy (targets: Perf ≥90 mobile, SEO ≥95) |
| Open Graph / social previews | ✅ | per-property OG images (`/images/og/*`), `summary_large_image` twitter card; replace placeholder OG art with real photos |
| Accessibility (feeds SEO) | ✅ | axe-core over 7 pages, 0 serious/critical; AA contrast |
| Google Search Console verification | ✅ (env) | `NEXT_PUBLIC_GSC_VERIFICATION` → `google-site-verification` meta |
| GA4 + consent | ✅ (env) | `NEXT_PUBLIC_GA4_ID`; consent default denied; no PII in events |

## Open before launch

1. Deploy to the real domain, set `NEXT_PUBLIC_SITE_URL`.
2. Run Lighthouse (mobile + desktop) on `/`, `/javalambre`, `/valencia`, one landing,
   one guide. Record scores here. Fix anything below target.
3. Validate all structured data with Google's Rich Results Test.
4. Submit `sitemap.xml` in Search Console; verify the property.
5. Replace placeholder OG images and property photos with real authorised assets;
   re-check LCP.
6. Formalise `docs/seo/keyword-map.md` targets with real search-volume data if available.
