"use client";

import { useState } from "react";
import Image from "next/image";
import type { PropertyImage } from "@/domains/properties/types";
import { GalleryLightbox } from "./GalleryLightbox";

/**
 * Property gallery (issues #17, #27). Hero image is eager + high priority for
 * LCP; the rest lazy-load. Click any tile to open the full-screen lightbox.
 * Single reusable component — only ever receives one property's images.
 */
export function Gallery({ images, name }: { images: PropertyImage[]; name: string }) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [open, setOpen] = useState<number | null>(null);
  const [hero, ...rest] = sorted;
  if (!hero) return null;

  const tile = "group relative overflow-hidden rounded-xl";
  const imgCls = "object-cover transition-transform duration-500 group-hover:scale-[1.03]";

  return (
    <section aria-label={`Galería de ${name}`} className="container-page pt-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <button
          type="button"
          onClick={() => setOpen(0)}
          className={`${tile} aspect-[4/3] sm:col-span-2 lg:row-span-2`}
        >
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={imgCls}
          />
        </button>
        {rest.slice(0, 4).map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setOpen(i + 1)}
            className={`${tile} aspect-[4/3]`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 50vw, 25vw"
              className={imgCls}
            />
            {i === 3 && sorted.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                +{sorted.length - 5} fotos
              </span>
            )}
          </button>
        ))}
      </div>

      <GalleryLightbox images={sorted} name={name} openIndex={open} onClose={() => setOpen(null)} />
    </section>
  );
}
