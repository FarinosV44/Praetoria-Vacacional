import type { BlogDestination, BlogPost } from "./types";
import { markdownToText } from "./markdown";

/** Lowercase-kebab slug, accent-folded, safe for a URL segment. */
export function slugify(input: string): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

/**
 * Is the post visible to the public right now?
 * Published AND its publishedAt (if set) is not in the future.
 */
export function isPubliclyVisible(post: BlogPost, now: Date = new Date()): boolean {
  if (post.status !== "published") return false;
  if (!post.publishedAt) return true;
  return new Date(post.publishedAt).getTime() <= now.getTime();
}

/** A published post whose publishedAt is still in the future. */
export function isScheduled(post: BlogPost, now: Date = new Date()): boolean {
  return (
    post.status === "published" &&
    !!post.publishedAt &&
    new Date(post.publishedAt).getTime() > now.getTime()
  );
}

/** Property slug the contextual CTA / related-ficha link should point at, if any. */
export function relatedPropertySlug(post: BlogPost): "javalambre" | "valencia" | null {
  if (post.relatedPropertySlug === "javalambre" || post.relatedPropertySlug === "valencia") {
    return post.relatedPropertySlug;
  }
  if (post.destination === "javalambre") return "javalambre";
  if (post.destination === "valencia") return "valencia";
  return null;
}

const CTA_COPY: Record<BlogDestination, { heading: string; body: string } | null> = {
  javalambre: {
    heading: "¿Buscas alojamiento cerca de las pistas?",
    body: "Javalambre Mountain SuperSki está en Camarena de la Sierra, a diez minutos de la estación. Reserva directa, disponibilidad real y precio total.",
  },
  valencia: {
    heading: "Alojamiento frente al Mediterráneo",
    body: "Valencia Frente al Mar está a pie de la playa de la Llastra, entre Les Palmeres y El Perelló. Reserva directa, sin comisiones y con confirmación inmediata.",
  },
  ambos: {
    heading: "Dos alojamientos, un mismo eje: Valencia todo el año",
    body: "Playa a pie de arena en la Llastra o nieve a diez minutos en Javalambre. Reserva directa en cualquiera de los dos.",
  },
  general: null,
};

export function ctaForPost(post: BlogPost): { heading: string; body: string; propertySlug: string | null } | null {
  const prop = relatedPropertySlug(post);
  const base = CTA_COPY[post.destination];
  if (!base) {
    if (!prop) return null;
    return {
      ...(CTA_COPY[prop] as { heading: string; body: string }),
      propertySlug: prop,
    };
  }
  return { ...base, propertySlug: prop };
}

export function readingMinutes(post: BlogPost): number {
  const words = markdownToText(post.bodyMarkdown).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function autoExcerpt(post: Pick<BlogPost, "excerpt" | "bodyMarkdown">, max = 200): string {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const text = markdownToText(post.bodyMarkdown);
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Newest-first, most relevant other posts for the "sigue leyendo" block. */
export function relatedPosts(post: BlogPost, all: BlogPost[], limit = 3): BlogPost[] {
  const others = all.filter((p) => p.id !== post.id);
  const score = (p: BlogPost) => {
    let s = 0;
    if (p.destination === post.destination) s += 3;
    if (relatedPropertySlug(p) && relatedPropertySlug(p) === relatedPropertySlug(post)) s += 2;
    s += p.tags.filter((t) => post.tags.includes(t)).length;
    return s;
  };
  return [...others]
    .sort((a, b) => {
      const d = score(b) - score(a);
      if (d !== 0) return d;
      return (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt);
    })
    .slice(0, limit);
}

export function sortByPublished(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) =>
    (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
  );
}
