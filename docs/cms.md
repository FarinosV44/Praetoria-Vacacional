# Light CMS (issue #50)

Lets an operator maintain the site after launch without a deploy for every text
change. Lives at **`/admin/contenido`**.

## What it stores

A single key/value table, `content_overrides` (memory store in DEMO mode):

| Key | Shape | Merged by |
|---|---|---|
| `property:<slug>` | `{ metaTitle?, metaDescription?, h1?, tagline?, shortIntro?, highlights?, nearby?, faq? }` | `resolveProperty()` / `resolvePropertiesForHome()` |
| `guide:<propertySlug>:<slug>` | `{ title?, description?, lead?, status?, order? }` | `resolveGuides()` and friends |

Pure merge logic is in `src/domains/properties/merge.ts` and
`src/content/guides/merge.ts` (both unit-tested). The repo read lives in
`content.ts` / `overrides.ts`.

## What an operator can do without a deploy

- Fix a property's SEO title / meta description / H1, tagline or intro.
- Rewrite or reorder the "Lo mejor de este alojamiento" selling points.
- Correct a distance in "Qué tienes cerca" (keeps the original category by name).
- Edit a property's FAQ.
- Retitle a guide, rewrite its excerpt/lead.
- **Publish or unpublish a guide** (draft → noindex + out of the sitemap + not
  linked; published → indexable).
- Reorder the guide cluster.

## SEO safeguards

- **Title / meta preview:** the property form renders a Google-style SERP
  preview with live character counts (60 / 160) and an over-length warning.
- **Canonical:** unchanged — every page is self-canonical via `pageMetadata`.
  Overrides only change the text, never the URL.
- **Slugs are immutable in the CMS.** Guide and property slugs come from the
  static seed (already unique); the CMS cannot create a duplicate because it
  cannot change a slug or add a new one. Creating a brand-new guide/landing is
  still a code change (rich body editing is out of V1 scope).
- **Drafts never leak:** `resolvePublishedGuides()` (sitemap, hub lists,
  property-page links) filters drafts; the guide route renders drafts with
  `robots: noindex` + a visible "Borrador" banner for preview only.
- **`updated_at`:** every write stamps `content_overrides.updated_at`. Guide
  `dateModified` in Article JSON-LD still comes from the hub's `updated` field;
  wire per-guide `updated` here when guide bodies become editable.

## Freshness

All content routes are ISR (`revalidate = 3600`). A save also calls
`revalidatePath` for the affected URLs, so changes show up within a minute in
practice and within an hour worst case. Setting every field back to empty and
saving clears the override and restores the original content.

## Not yet in the CMS (documented follow-ups)

- Editing full guide/landing body sections (needs a structured/rich editor).
- Creating a new guide, landing or seasonal page from the panel.
- Featured-image selection (photos are a build-time asset pipeline today).
Amenities groups and rate rules are edited elsewhere (`/admin/precios`) or in
content files; promotions in `/admin/promociones` (issue #45).
