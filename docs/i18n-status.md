# i18n status (issue #85)

**Policy (user, 2026-09-02):** translate SEO content / blog / guides / legal to
English as **drafts** — published with `noindex`, out of the sitemap, no
hreflang — for the owner to review before they go live.

## Architecture

- ES is served at the root, EN under `/en` (`src/i18n/config.ts`).
- Content models carry an optional `en?` block (e.g. `GuideHub.en`,
  `GuideHubEn`). Present ≠ published: the `/en/...` route renders it with a
  "draft, pending review" banner and `robots: noindex`.
- A draft EN page is **not** added to `getIndexableRoutes`
  (`src/domains/marketing/navigation.ts`) and does **not** emit `hreflang`
  (`pageMetadata` only does when `hreflangFor` is passed).

## Done — draft EN, pending owner review

| Area | Route | Source |
|---|---|---|
| Home | `/en` | pre-existing (issue #29) |
| Property pages | `/en/javalambre`, `/en/valencia` | pre-existing |
| Checkout | `/en/reservar/[property]` | pre-existing |
| **Destination guide hubs** | `/en/guias`, `/en/guias/javalambre`, `/en/guias/valencia-playa` | `src/content/guides/hubs.ts` → `en:` blocks |

## Pending — same pattern, content to add

Each needs an `en:` block on the content object + a thin `/en/...` route that
mirrors the ES one (hero + sections + FAQ + CTA), `noindex`, draft banner.

| Area | Content file | ES routes to mirror |
|---|---|---|
| Satellite guides | `src/content/guides/index.ts` | `/guias/[hub]/[slug]` |
| SEO landings | `src/content/landings/index.ts` | `/[property]/[slug]` |
| Seasonal offers | `src/content/seasonal/index.ts` | `/ofertas/[slug]` |
| Blog | CMS (`content_overrides`) — the model already has a locale field; the owner writes EN posts in `/admin/blog` | `/blog`, `/blog/[slug]` |
| Legal | `src/content/legal/*` | `/legal/[slug]` — **do not machine-translate**: add a professionally reviewed EN version, and keep a "the Spanish version prevails" notice |

## When the owner approves a draft

1. Move the page's path into `getIndexableRoutes`.
2. Pass `hreflangFor: "<neutral path>"` to `pageMetadata` on both the ES and EN
   route so the pair emits bidirectional `hreflang` + `x-default`.
3. Add the EN URL to `LanguageSwitcher` for that page.
4. Drop the draft banner and `robots: noindex`.
