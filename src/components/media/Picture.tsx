import Image from "next/image";
import type { ResponsivePhoto } from "@/content/properties/photos";

/**
 * Property photo. The real files are pre-encoded (see photo-manifest.json); we
 * hand the largest WebP to next/image, which produces the responsive srcset and
 * modern formats. `fill` mode — the parent must be positioned with a size.
 */
export function Picture({
  photo,
  sizes,
  priority = false,
  className = "",
  imgClassName = "object-cover",
}: {
  photo: ResponsivePhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** kept for API compatibility; merged into the Image className */
  imgClassName?: string;
}) {
  const maxW = Math.max(...photo.widths);
  return (
    <Image
      src={`${photo.dir}/${photo.base}-${maxW}.webp`}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`${imgClassName} ${className}`.trim()}
    />
  );
}
