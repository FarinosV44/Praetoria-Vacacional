import Image from "next/image";
import Link from "next/link";
import type { PropertyContent } from "@/domains/properties/types";
import { experienceMeta } from "@/domains/properties/registry";
import { guestsLabel } from "@/lib/format";

export function PropertyCard({ property }: { property: PropertyContent }) {
  const hero = property.gallery.find((g) => g.hero) ?? property.gallery[0];
  const meta = experienceMeta[property.experience];
  return (
    <Link
      href={`/${property.slug}`}
      data-experience={property.experience}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {hero && (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--accent-700)]">
          {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl">{property.name}</h3>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {property.location.city} · {property.location.region}
        </p>
        <p className="text-sm text-[var(--color-ink)]">{property.tagline}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          Hasta {guestsLabel(property.capacity.guests)} · {property.capacity.bedrooms} habitaciones ·{" "}
          {property.capacity.bathrooms} baños
        </p>
        <span className="mt-auto pt-3 text-sm font-medium text-[var(--accent-700)]">
          Ver alojamiento y fechas →
        </span>
      </div>
    </Link>
  );
}
