import Image from "next/image";
import Link from "next/link";
import type { PropertyContent } from "@/domains/properties/types";
import { experienceMeta } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { formatMoney, guestsLabel } from "@/lib/format";

export function PropertyCard({ property }: { property: PropertyContent }) {
  const hero = property.gallery.find((g) => g.hero) ?? property.gallery[0];
  const meta = experienceMeta[property.experience];
  const rate = getRateConfig(property.slug);
  const fromNightly = rate ? Math.min(rate.baseNightlyCents, ...rate.seasons.map((s) => s.nightlyCents)) : null;

  return (
    <Link
      href={`/${property.slug}`}
      data-experience={property.experience}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        {hero && (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--accent-700)]">
          {property.experience === "ski" ? "❄ " : "☀ "}
          {meta.label}
        </span>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="font-display text-2xl leading-tight drop-shadow">{property.name}</h3>
          <p className="text-sm text-white/90 drop-shadow">
            {property.location.city} · {property.location.region}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[var(--color-ink)]">{property.tagline}</p>
        <p className="text-xs text-[var(--color-ink-soft)]">
          Hasta {guestsLabel(property.capacity.guests)} · {property.capacity.bedrooms} habitaciones ·{" "}
          {property.capacity.beds} camas · {property.capacity.bathrooms} baños
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          {fromNightly && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              desde <span className="font-semibold text-[var(--color-ink)]">{formatMoney(fromNightly)}</span> / noche
            </p>
          )}
          <span className="text-sm font-medium text-[var(--accent-700)] transition-transform group-hover:translate-x-0.5">
            Ver disponibilidad →
          </span>
        </div>
      </div>
    </Link>
  );
}
