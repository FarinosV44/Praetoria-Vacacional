"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResponsivePhoto } from "@/content/properties/photos";
import { srcSet } from "@/content/properties/photos";

/**
 * Full-screen, keyboard-navigable gallery (issue #17/#38). Mounts only when
 * opened, so it costs nothing on first paint.
 */
export function GalleryLightbox({
  photos,
  name,
  openIndex,
  onClose,
}: {
  photos: ResponsivePhoto[];
  name: string;
  openIndex: number | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(openIndex ?? 0);

  useEffect(() => {
    if (openIndex !== null) setIndex(openIndex);
  }, [openIndex]);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length],
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, onClose, prev, next]);

  if (openIndex === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${name}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm">
          {index + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm ring-1 ring-white/40 hover:bg-white/10"
        >
          Cerrar ✕
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 pb-6">
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 z-10 h-12 w-12 rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ‹
        </button>
        <picture className="flex h-full max-h-[80vh] w-full max-w-5xl items-center justify-center">
          <source type="image/avif" srcSet={srcSet(photo, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={srcSet(photo, "webp")} sizes="100vw" />
          <img
            src={`${photo.dir}/${photo.base}-${Math.max(...photo.widths)}.webp`}
            alt={photo.alt}
            className="max-h-[80vh] w-auto object-contain"
          />
        </picture>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 z-10 h-12 w-12 rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ›
        </button>
      </div>
      <p className="pb-4 text-center text-sm text-white/70">{photo.alt}</p>
    </div>
  );
}
