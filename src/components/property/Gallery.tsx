import Image from "next/image";
import type { PropertyImage } from "@/domains/properties/types";

/**
 * Property gallery (issues #17, #27). The hero image is eager + high priority
 * for LCP; the rest lazy-load. Single reusable component — never mixes photos
 * between properties because it only receives one property's images.
 */
export function Gallery({ images, name }: { images: PropertyImage[]; name: string }) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [hero, ...rest] = sorted;
  if (!hero) return null;

  return (
    <section aria-label={`Galería de ${name}`} className="container-page pt-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:col-span-2 lg:row-span-2">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        {rest.slice(0, 4).map((img) => (
          <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
