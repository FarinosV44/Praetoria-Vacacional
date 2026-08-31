import Link from "next/link";
import type { PropertyContent } from "@/domains/properties/types";
import { experienceMeta } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { heroPhoto } from "@/content/properties/photos";
import { Picture } from "@/components/media/Picture";
import { formatMoney } from "@/lib/format";
import { localizedPath, type Locale } from "@/i18n/config";

/**
 * Destination card (issue #37): photo-forward, with the one headline distance,
 * capacity, a real feature and the source rating. The whole card is a link.
 */
export function PropertyCard({
  property,
  locale = "es",
}: {
  property: PropertyContent;
  locale?: Locale;
}) {
  const meta = experienceMeta[property.experience];
  const rate = getRateConfig(property.slug);
  const fromNightly = rate
    ? Math.min(rate.baseNightlyCents, ...rate.seasons.map((s) => s.nightlyCents))
    : null;
  const hero = heroPhoto(property.slug);
  const keyFeature =
    property.experience === "ski" ? "Chimenea y guardaesquís" : "A pie de playa";

  const t =
    locale === "en"
      ? { from: "from", per: "/ night", cta: "View property →", upTo: "Sleeps", rating: "on Booking" }
      : { from: "desde", per: "/ noche", cta: "Ver alojamiento →", upTo: "Hasta", rating: "en Booking" };

  return (
    <Link
      href={localizedPath(locale, `/${property.slug}`)}
      data-experience={property.experience}
      className="pv-card pv-card--soft pv-card--interactive group relative flex flex-col overflow-hidden !p-0"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        {hero && (
          <Picture
            photo={hero}
            sizes="(max-width: 768px) 100vw, 50vw"
            imgClassName="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className="pv-chip absolute left-4 top-4 !bg-white/95 font-semibold !text-[var(--accent-700)] !shadow-none">
          {property.experience === "ski" ? "❄ " : "☀ "}
          {meta.label}
        </span>
        {property.rating && (
          <span className="pv-badge pv-badge--score absolute right-4 top-4">
            {property.rating.value.toFixed(1)}
          </span>
        )}
        <div className="absolute inset-x-5 bottom-5 text-white">
          <h3 className="font-display text-2xl leading-tight drop-shadow-md">{property.name}</h3>
          <p className="text-sm text-white/90 drop-shadow">
            {property.location.area} · {property.location.region}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[var(--color-ink)]">{property.tagline}</p>
        <ul className="grid grid-cols-3 gap-2 text-xs text-[var(--color-ink-soft)]">
          <li>
            <span className="block font-medium text-[var(--color-ink)]">
              {property.headlineDistance.value}
            </span>
            {property.headlineDistance.label}
          </li>
          <li>
            <span className="block font-medium text-[var(--color-ink)]">
              {t.upTo} {property.capacity.guests}
            </span>
            {property.capacity.bedrooms} habitaciones
          </li>
          <li>
            <span className="block font-medium text-[var(--color-ink)]">{keyFeature}</span>
            {property.capacity.sizeSqm} m²
          </li>
        </ul>
        <div className="mt-auto flex items-end justify-between pt-3">
          {fromNightly && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              {t.from}{" "}
              <span className="font-semibold text-[var(--color-ink)]">{formatMoney(fromNightly)}</span>{" "}
              {t.per}
            </p>
          )}
          <span className="text-sm font-medium text-[var(--accent-700)] transition-transform group-hover:translate-x-0.5">
            {t.cta}
          </span>
        </div>
      </div>
    </Link>
  );
}
