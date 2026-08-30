/**
 * Blog / Actualidad (issue #57).
 *
 * A lightweight, admin-managed news + guides blog that lives alongside the
 * evergreen destination hubs in `/guias`. Posts are stored as documents in the
 * existing `content_overrides` KV (key `blog:post:<id>`) so the feature needs no
 * new migration and works identically in DEMO (in-memory) and Supabase modes —
 * the same light-CMS approach as issue #50.
 */

export type BlogStatus = "draft" | "published";

/** Which apartment(s) a post is about — drives the contextual booking CTA. */
export type BlogDestination = "javalambre" | "valencia" | "ambos" | "general";

export interface BlogPost {
  id: string;
  /** URL segment, unique, lowercase-kebab. Immutable once published (no 404s). */
  slug: string;
  status: BlogStatus;

  title: string;
  excerpt: string;
  /** Body in a small, safe Markdown subset (see `./markdown`). */
  bodyMarkdown: string;

  featuredImageUrl: string | null;
  featuredImageAlt: string;

  category: string;
  tags: string[];

  destination: BlogDestination;
  /** Explicit property for the CTA/related-ficha link; falls back to `destination`. */
  relatedPropertySlug: string | null;

  author: string;

  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;

  /**
   * Publication instant (ISO). May be in the future — a `published` post with a
   * future `publishedAt` is scheduled and not shown publicly until then.
   */
  publishedAt: string | null;
  /** Last substantive content edit (ISO) — shown as "actualizado el …". */
  updatedContentAt: string | null;

  createdAt: string;
  updatedAt: string;
}

/** Shape the admin form submits (before defaults / id / timestamps are applied). */
export interface BlogPostInput {
  slug: string;
  status: BlogStatus;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  category: string;
  tags: string[];
  destination: BlogDestination;
  relatedPropertySlug: string | null;
  author: string;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  publishedAt: string | null;
}

export const BLOG_DESTINATIONS: { value: BlogDestination; label: string }[] = [
  { value: "valencia", label: "Valencia Frente al Mar" },
  { value: "javalambre", label: "Javalambre Mountain SuperSki" },
  { value: "ambos", label: "Ambos alojamientos" },
  { value: "general", label: "General / Valencia y turismo" },
];
