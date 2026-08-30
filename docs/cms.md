# Light CMS (issue #50)

Lets an operator maintain the site after launch without a deploy for every text
change. Lives at **`/admin/contenido`**.

## What it stores

A single key/value table, `content_overrides` (memory store in DEMO mode):

| Key | Shape | Merged by |
|---|---|---|
| `property:<slug>` | `{ metaTitle?, metaDescription?, h1?, tagline?, shortIntro?, highlights?, nearby?, faq? }` | `resolveProperty()` / `resolvePropertiesForHome()` |
| `guide:<propertySlug>:<slug>` | `{ title?, description?, lead?, status?, order? }` | `resolveGuides()` and friends |
| `blog:post:<id>` | a full `BlogPost` document (issue #57) | `src/domains/blog/store.ts` |

## Blog / Actualidad (issue #57)

Full article CMS at **`/admin/blog`** — create / edit / draft / publish /
schedule / delete, no deploy. Each post is one `blog:post:<id>` document in the
same `content_overrides` table (no new migration; works in DEMO and Supabase
alike). Public surface: **`/blog`** (index, `revalidate=3600`) and
**`/blog/[slug]`** (`dynamicParams`, SSG from published posts).

- **Fields:** title, slug (immutable-by-convention once published), status,
  excerpt, Markdown body, featured image URL + ALT, category, tags, destination
  (`javalambre` / `valencia` / `ambos` / `general`), related property for the
  CTA, author, `publishedAt` (future date = scheduled), and the full SEO block
  (SEO title, meta description, canonical, OG title/description/image).
- **Visibility:** `isPubliclyVisible` = `status === "published"` AND
  `publishedAt <= now`. Drafts and scheduled posts 404 publicly, stay out of the
  sitemap and are unlinked.
- **SEO per article:** SSG, clean URL, unique title/meta, single h1, canonical,
  `Article` + `BreadcrumbList` JSON-LD, image ALT, visible publish/update dates,
  auto-added to `sitemap.xml` via `getIndexableRoutes()`, a contextual
  non-aggressive booking CTA to the related property, and a "sigue leyendo"
  block. Home shows the 3 latest posts (ES).
- **Markdown:** a small, safe in-house renderer (`src/domains/blog/markdown.ts`)
  — closed tag set (h2–h4, p, ul/ol/li, blockquote, a, strong, em, code, hr),
  every link URL validated, all other HTML escaped. No new dependency (D-014).
- **No canibalization with `/guias`:** guides stay the evergreen destination
  hubs; the blog is dated news / seasonal / editorial. Cross-links both ways.

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
