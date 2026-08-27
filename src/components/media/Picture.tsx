import type { ResponsivePhoto } from "@/content/properties/photos";
import { srcSet } from "@/content/properties/photos";

/**
 * Responsive <picture> for the pre-optimised property photos (AVIF → WebP).
 * The images are already encoded at fixed widths, so we skip the Next image
 * optimiser and serve them directly with a proper srcset.
 */
export function Picture({
  photo,
  sizes,
  priority = false,
  className = "",
  imgClassName = "",
}: {
  photo: ResponsivePhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const maxW = Math.max(...photo.widths);
  const width = maxW;
  const height = Math.round(maxW / photo.aspect);
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet(photo, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(photo, "webp")} sizes={sizes} />
      <img
        src={`${photo.dir}/${photo.base}-${maxW}.webp`}
        alt={photo.alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        // @ts-expect-error fetchpriority is valid HTML, types lag
        fetchpriority={priority ? "high" : undefined}
        decoding="async"
        className={imgClassName || "h-full w-full object-cover"}
      />
    </picture>
  );
}
