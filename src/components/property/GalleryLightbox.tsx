"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { PropertyImage } from "@/domains/properties/types";

/**
 * Full-screen, keyboard- and swipe-navigable gallery (issue #17).
 * The grid thumbnails are server-rendered by <Gallery/>; this component only
 * mounts the overlay when opened, so it costs nothing on first paint.
 */
export function GalleryLightbox({
  images,
  name,
  openIndex,
  onClose,
}: {
  images: PropertyImage[];
  name: string;
  openIndex: number | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(openIndex ?? 0);

  useEffect(() => {
    if (openIndex !== null) setIndex(openIndex);
  }, [openIndex]);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

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
  const img = images[index];
  if (!img) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${name}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm">
          {index + 1} / {images.length}
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
        <div className="relative h-full max-h-[80vh] w-full max-w-5xl">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 z-10 h-12 w-12 rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ›
        </button>
      </div>
      <p className="pb-4 text-center text-sm text-white/70">{img.alt}</p>
    </div>
  );
}
