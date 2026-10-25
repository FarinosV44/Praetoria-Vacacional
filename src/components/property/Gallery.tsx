"use client";

import { useState } from "react";
import { PHOTO_KIND_LABEL, type ResponsivePhoto } from "@/content/properties/photos";
import { Picture } from "@/components/media/Picture";
import { GalleryLightbox } from "./GalleryLightbox";

const STR = {
  es: { all: "Todas", place: "Vistas y entorno", home: "Alojamiento", more: (n: number) => `+${n} ${n === 1 ? "foto" : "fotos"}`, seeAll: (n: number) => `Ver las ${n} fotos` },
  en: { all: "All", place: "Views & surroundings", home: "Apartment", more: (n: number) => `+${n} ${n === 1 ? "photo" : "photos"}`, seeAll: (n: number) => `See all ${n} photos` },
} as const;

type Filter = "all" | "place" | "home";

/**
 * Boutique property gallery (issues #17, #27, #38, #93). Real photos, pre-encoded
 * to AVIF+WebP at responsive widths, all lazy (the page hero carries LCP). A
 * truthful filter separates the apartment from views and surroundings (#100);
 * click any tile for the full-screen lightbox.
 */
export function Gallery({
  photos,
  name,
  locale = "es",
}: {
  photos: ResponsivePhoto[];
  name: string;
  locale?: "es" | "en";
}) {
  const t = STR[locale];
  const [filter, setFilter] = useState<Filter>("home");
  const [open, setOpen] = useState<number | null>(null);

  const isHome = (p: ResponsivePhoto) => p.kind === "alojamiento";
  const shown =
    filter === "all" ? photos : photos.filter((p) => (filter === "home" ? isHome(p) : !isHome(p)));
  const [lead, ...rest] = shown;
  const counts: Record<Filter, number> = {
    all: photos.length,
    home: photos.filter(isHome).length,
    place: photos.filter((p) => !isHome(p)).length,
  };

  const tile =
    "pv-zoom group relative block overflow-hidden bg-[var(--color-mist)] focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <div className="mt-6">
      <div role="group" aria-label={locale === "en" ? "Filter photos" : "Filtrar fotos"} className="flex gap-6 overflow-x-auto border-b border-[var(--color-line)] text-sm font-semibold">
        {(["home", "place", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              setOpen(null);
            }}
            className={`shrink-0 py-3 ${
              filter === f
                ? "text-[var(--color-ink)] shadow-[inset_0_-2px_0_var(--accent-600)]"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t[f]} · {counts[f]}
          </button>
        ))}
      </div>

      {lead && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setOpen(0)}
            className={`${tile} col-span-2 aspect-[4/3] sm:row-span-2 sm:aspect-auto`}
          >
            <Picture photo={lead} sizes="(max-width: 640px) 100vw, 45vw" imgClassName="h-full w-full object-cover" />
          </button>
          {rest.slice(0, 4).map((photo, i) => (
            <button key={photo.base} type="button" onClick={() => setOpen(i + 1)} className={`${tile} aspect-[4/3]`}>
              <Picture photo={photo} sizes="(max-width: 640px) 50vw, 22vw" imgClassName="h-full w-full object-cover" />
              {i === 3 && shown.length > 5 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  {t.more(shown.length - 5)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {shown.length > 1 && (
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="mt-4 border-b border-current pb-0.5 text-sm font-semibold"
        >
          {t.seeAll(shown.length)}
        </button>
      )}

      <GalleryLightbox
        photos={shown}
        name={name}
        openIndex={open}
        onClose={() => setOpen(null)}
        kindLabels={PHOTO_KIND_LABEL[locale]}
        locale={locale}
      />
    </div>
  );
}
