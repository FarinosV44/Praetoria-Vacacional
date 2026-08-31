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
}

type ManifestEntry = {
  base: string;
  alt: string;
  order: number;
  aspect: number;
  widths: number[];
  focal?: string;
  category?: string;
};

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

/** srcset string for one format at the photo's available widths. */
export function srcSet(photo: ResponsivePhoto, format: "avif" | "webp"): string {
  return photo.widths.map((w) => `${photo.dir}/${photo.base}-${w}.${format} ${w}w`).join(", ");
}
