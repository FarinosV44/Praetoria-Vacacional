import manifest from "./photo-manifest.json";

/**
 * Real property photos, downloaded from the owner's Booking listings (issue #35)
 * and re-encoded locally to AVIF + WebP at responsive widths. The site serves
 * these from /public and never touches Booking at runtime.
 *
 * Regenerate with: node scripts/fetch-property-photos.mjs
 */

export interface ResponsivePhoto {
  base: string;
  alt: string;
  order: number;
  aspect: number;
  widths: number[];
  dir: string;
  /** Largest webp — used as the plain <Image> src / og:image. */
  src: string;
  /** Optional CSS object-position ("x% y%") so mobile crops keep the subject
   *  in frame (issue #93). Absent → centre. */
  focal?: string;
  /** Optional grouping for a categorised gallery ("vistas", "salon", …). */
  category?: string;
  /** What the picture truthfully shows (issue #100): a view taken FROM the
   *  apartment, the apartment itself, or the surroundings. Drives the visible
   *  caption tag so destination shots are never passed off as the property. */
  kind?: PhotoKind;
  /** Short visible caption (ES / EN). */
  caption?: string;
  captionEn?: string;
  /** "owner" = supplied directly by the owner, otherwise the Booking listing. */
  source?: string;
}

export type PhotoKind = "vista" | "alojamiento" | "entorno";

export const PHOTO_KIND_LABEL: Record<"es" | "en", Record<PhotoKind, string>> = {
  es: { vista: "Vista real", alojamiento: "Alojamiento", entorno: "Entorno" },
  en: { vista: "Actual view", alojamiento: "Apartment", entorno: "Surroundings" },
};

type ManifestEntry = Omit<ResponsivePhoto, "dir" | "src">;

const M = manifest as Record<string, ManifestEntry[]>;

export function propertyPhotos(slug: string): ResponsivePhoto[] {
  const entries = M[slug] ?? [];
  const dir = `/images/properties/${slug}`;
  return entries
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((e) => ({
      ...e,
      dir,
      src: `${dir}/${e.base}-${Math.max(...e.widths)}.webp`,
    }));
}

export function hasRealPhotos(slug: string): boolean {
  return (M[slug]?.length ?? 0) > 0;
}

export function heroPhoto(slug: string): ResponsivePhoto | undefined {
  return propertyPhotos(slug)[0];
}

/** Find one photo by its file stem. */
export function photoByBase(slug: string, base: string): ResponsivePhoto | undefined {
  return propertyPhotos(slug).find((p) => p.base === base);
}

export function photoCaption(photo: ResponsivePhoto, locale: "es" | "en"): string | undefined {
  return locale === "en" ? (photo.captionEn ?? photo.caption) : photo.caption;
}

/** srcset string for one format at the photo's available widths. */
export function srcSet(photo: ResponsivePhoto, format: "avif" | "webp"): string {
  return photo.widths.map((w) => `${photo.dir}/${photo.base}-${w}.${format} ${w}w`).join(", ");
}
