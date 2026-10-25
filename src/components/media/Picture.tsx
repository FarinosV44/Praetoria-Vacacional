import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import type { ResponsivePhoto } from "@/content/properties/photos";

/**
 * Property photo. The real files are pre-encoded (see photo-manifest.json); we
 * hand the largest WebP to next/image, which produces the responsive srcset and
 * modern formats. `fill` mode — the parent must be positioned with a size.
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
  /** kept for API compatibility; merged into the Image className */
  imgClassName?: string;
}) {
  const src = (p: ResponsivePhoto) => `${p.dir}/${p.base}-${Math.max(...p.widths)}.webp`;
  const cls = `${imgClassName} ${className}`.trim();

  if (!mobilePhoto) {
    // Focal point (issue #93) — keeps the subject in frame on tight crops.
    return (
      <Image
        src={src(photo)}
        alt={alt ?? photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        style={photo.focal ? { objectPosition: photo.focal } : undefined}
        className={cls}
      />
    );
  }

  const common = { alt: alt ?? photo.alt, fill: true, priority } as const;
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ ...common, sizes, src: src(photo) });
  const {
    props: { srcSet: mobileSet, ...rest },
  } = getImageProps({ ...common, sizes: "100vw", src: src(mobilePhoto) });

  const focal = {
    "--pv-focal-d": photo.focal ?? "50% 50%",
    "--pv-focal-m": mobilePhoto.focal ?? "50% 50%",
  } as CSSProperties;

  return (
    <picture>
      {priority && (
        <>
          {/* React 19 hoists these to <head>: each viewport preloads only its own frame. */}
          <link rel="preload" as="image" media="(min-width: 768px)" imageSrcSet={desktopSet} imageSizes={sizes} fetchPriority="high" />
          <link rel="preload" as="image" media="(max-width: 767.98px)" imageSrcSet={mobileSet} imageSizes="100vw" fetchPriority="high" />
        </>
      )}
      <source media="(min-width: 768px)" srcSet={desktopSet} sizes={sizes} />
      <source srcSet={mobileSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img
        {...rest}
        fetchPriority={priority ? "high" : rest.fetchPriority}
        style={{ ...rest.style, ...focal }}
        className={`pv-art ${cls}`}
      />
    </picture>
  );
}
