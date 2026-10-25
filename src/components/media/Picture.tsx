import type { CSSProperties } from "react";
import { srcSet, type ResponsivePhoto } from "@/content/properties/photos";

/**
 * Property photo. The real files are pre-encoded to AVIF + WebP at responsive
 * widths (see photo-manifest.json and scripts/import-local-photos.mjs), so they
 * are served directly as a native <picture> — no on-the-fly re-encoding by the
 * Next image optimiser. That keeps the first visit after a deploy fast (a cold
 * optimiser has to AVIF-encode every large hero) and spares the host's CPU.
 * "Fill" layout: the parent must be positioned and sized.
 *
 * Optional `mobilePhoto` gives true art direction (issue #100/#101): phones get
 * a portrait frame (the same view, shot upright) instead of a squeezed
 * landscape crop; pass a matching `alt`. Only one source is ever downloaded.
 */
export function Picture({
  photo,
  mobilePhoto,
  alt,
  sizes,
  priority = false,
  className = "",
  imgClassName = "object-cover",
}: {
  photo: ResponsivePhoto;
  mobilePhoto?: ResponsivePhoto;
  /** Overrides the photo's alt — needed when the mobile frame shows a different shot. */
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Classes for the <img>, e.g. "h-full w-full object-cover". */
  imgClassName?: string;
}) {
  const DESKTOP = "(min-width: 768px)";
  const MOBILE = "(max-width: 767.98px)";
  const mobileSizes = "100vw";

  // Focal point (issue #93) — keeps the subject in frame on tight crops; with
  // art direction each frame keeps its own (see .pv-art in globals.css).
  const style: CSSProperties = mobilePhoto
    ? ({
        "--pv-focal-d": photo.focal ?? "50% 50%",
        "--pv-focal-m": mobilePhoto.focal ?? "50% 50%",
      } as CSSProperties)
    : { objectPosition: photo.focal ?? undefined };

  return (
    <picture>
      {priority && (
        // React 19 hoists these to <head>. Only the LCP photo is marked
        // priority, and with art direction each viewport preloads its own frame.
        <>
          <link
            rel="preload"
            as="image"
            type="image/avif"
            media={mobilePhoto ? DESKTOP : undefined}
            imageSrcSet={srcSet(photo, "avif")}
            imageSizes={sizes}
            fetchPriority="high"
          />
          {mobilePhoto && (
            <link
              rel="preload"
              as="image"
              type="image/avif"
              media={MOBILE}
              imageSrcSet={srcSet(mobilePhoto, "avif")}
              imageSizes={mobileSizes}
              fetchPriority="high"
            />
          )}
        </>
      )}
      {mobilePhoto && (
        <>
          <source media={MOBILE} type="image/avif" srcSet={srcSet(mobilePhoto, "avif")} sizes={mobileSizes} />
          <source media={MOBILE} type="image/webp" srcSet={srcSet(mobilePhoto, "webp")} sizes={mobileSizes} />
        </>
      )}
      <source type="image/avif" srcSet={srcSet(photo, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(photo, "webp")} sizes={sizes} />
      <img
        src={photo.src}
        alt={alt ?? photo.alt}
        sizes={sizes}
        srcSet={srcSet(photo, "webp")}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
        className={`${mobilePhoto ? "pv-art " : ""}${imgClassName} ${className}`.trim()}
      />
    </picture>
  );
}
