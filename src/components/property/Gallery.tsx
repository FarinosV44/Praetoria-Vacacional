"use client";

import { useState } from "react";
import type { ResponsivePhoto } from "@/content/properties/photos";
import { Picture } from "@/components/media/Picture";
import { GalleryLightbox } from "./GalleryLightbox";

/**
 * Boutique property gallery (issues #17, #27, #38). Real photos, pre-encoded to
 * AVIF+WebP at responsive widths. Hero eager for LCP; the rest lazy. Click any
 * tile for the full-screen lightbox. One reusable component — it only ever
 * receives one property's photos.
 */
export function Gallery({ photos, name }: { photos: ResponsivePhoto[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [hero, ...rest] = photos;
  if (!hero) return null;

  const tile = "group relative block overflow-hidden rounded-xl";
  const img = "transition-transform duration-500 group-hover:scale-[1.03]";

  return (
    <section aria-label={`Galería de ${name}`} className="container-page pt-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <button
          type="button"
          onClick={() => setOpen(0)}
          className={`${tile} aspect-[4/3] sm:col-span-2 lg:row-span-2`}
        >
          <Picture
            photo={hero}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            imgClassName={`h-full w-full object-cover ${img}`}
          />
        </button>
        {rest.slice(0, 4).map((photo, i) => (
          <button
            key={photo.base}
            type="button"
            onClick={() => setOpen(i + 1)}
            className={`${tile} aspect-[4/3]`}
          >
            <Picture
              photo={photo}
              sizes="(max-width: 1024px) 50vw, 25vw"
              imgClassName={`h-full w-full object-cover ${img}`}
            />
            {i === 3 && photos.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                +{photos.length - 5} fotos
              </span>
            )}
          </button>
        ))}
      </div>

      <GalleryLightbox photos={photos} name={name} openIndex={open} onClose={() => setOpen(null)} />
    </section>
  );
}
