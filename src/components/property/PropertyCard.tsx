import Image from "next/image";
import Link from "next/link";
import type { PropertyContent } from "@/domains/properties/types";
import { experienceMeta } from "@/domains/properties/registry";
import { getRateConfig } from "@/content/rates";
import { formatMoney, guestsLabel } from "@/lib/format";
import { localizedPath, type Locale } from "@/i18n/config";

export function PropertyCard({
  property,
  locale = "es",
}: {
  property: PropertyContent;
  locale?: Locale;
}) {
  const t =
    locale === "en"
      ? { from: "from", perNight: "/ night", cta: "Check availability →", upTo: "Up to", rooms: "bedrooms", beds: "beds", baths: "bathrooms" }
      : { from: "desde", perNight: "/ noche", cta: "Ver disponibilidad →", upTo: "Hasta", rooms: "habitaciones", beds: "camas", baths: "baños" };
  const hero = property.gallery.find((g) => g.hero) ?? property.gallery[0];
  const meta = experienceMeta[property.experience];
  const rate = getRateConfig(property.slug);
  const fromNightly = rate ? Math.min(rate.baseNightlyCents, ...rate.seasons.map((s) => s.nightlyCents)) : null;

  return (
    <Link
      href={localizedPath(locale, `/${property.slug}`)}
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
          {t.upTo} {locale === "en" ? `${property.capacity.guests} guests` : guestsLabel(property.capacity.guests)} ·{" "}
          {property.capacity.bedrooms} {t.rooms} · {property.capacity.beds} {t.beds} ·{" "}
          {property.capacity.bathrooms} {t.baths}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          {fromNightly && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              {t.from}{" "}
              <span className="font-semibold text-[var(--color-ink)]">{formatMoney(fromNightly)}</span>{" "}
              {t.perNight}
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
