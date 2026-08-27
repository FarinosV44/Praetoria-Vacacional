import Link from "next/link";
import { getPropertyBySlug, localizedProperty } from "@/domains/properties/registry";
import { propertyJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Gallery } from "@/components/property/Gallery";
import { ContentStatusNote } from "@/components/property/ContentStatusNote";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { ReviewsBlock, reviewStats } from "@/components/ReviewsBlock";
import { FaqBlock } from "@/components/FaqBlock";
import { guestsLabel } from "@/lib/format";
import { landingLinksFor, guideLinksFor } from "@/domains/marketing/navigation";
import { getRateConfig } from "@/content/rates";
import { localizedPath, type Locale } from "@/i18n/config";

const T = {
  es: {
    home: "Inicio",
    gallery: "Galería de fotos",
    theProperty: "El alojamiento",
    guests: "Huéspedes",
    bedrooms: "Habitaciones",
    beds: "Camas",
    bathrooms: "Baños",
    amenities: "Equipamiento",
    amenitiesPending:
      "El listado detallado de equipamiento se publicará con la información definitiva del propietario.",
    amenitiesWhat: "Listado de equipamiento",
    location: "Ubicación y cómo llegar",
    locatedAt: (name: string, area: string, city: string, region: string) =>
      `${name} está en ${area}, ${city} (${region}).`,
    distancePending: "distancia por confirmar",
    distancesWhat: "Distancias exactas",
    cancellation: "Política de cancelación",
    cancellationWhat: "Condiciones exactas de cancelación",
    more: "Más sobre esta escapada",
    faqHeading: (name: string) => `Preguntas frecuentes sobre ${name}`,
    stickyCta: "Consultar fechas y reservar",
    translationNote: null as string | null,
  },
  en: {
    home: "Home",
    gallery: "Photo gallery",
    theProperty: "The property",
    guests: "Guests",
    bedrooms: "Bedrooms",
    beds: "Beds",
    bathrooms: "Bathrooms",
    amenities: "Amenities",
    amenitiesPending:
      "The full amenities list will be published with the owner's final information.",
    amenitiesWhat: "Amenities list",
    location: "Location & how to get there",
    locatedAt: (name: string, area: string, city: string, region: string) =>
      `${name} is in ${area}, ${city} (${region}).`,
    distancePending: "distance to be confirmed",
    distancesWhat: "Exact distances",
    cancellation: "Cancellation policy",
    cancellationWhat: "Exact cancellation terms",
    more: "More about this getaway",
    faqHeading: (name: string) => `Frequently asked questions about ${name}`,
    stickyCta: "Check dates & book",
    translationNote:
      "Some sections below are shown in Spanish while the reviewed English version is prepared.",
  },
} as const;

export function PropertyPageView({ slug, locale }: { slug: string; locale: Locale }) {
  const raw = getPropertyBySlug(slug);
  if (!raw) return null;
  const p = localizedProperty(raw, locale);
  const t = T[locale];
  const stats = reviewStats(p.reviews);
  const path = (neutral: string) => localizedPath(locale, neutral);
  // Landings and guides are Spanish-only for V1 — only surface them on the ES site
  // so the English pages never link to a non-existent localized URL.
  const landings =
    locale === "es" ? [...landingLinksFor(p.slug), ...guideLinksFor(p.slug)] : [];
  const usingEsFallback = locale === "en" && !raw.en?.sections;

  return (
    <div data-experience={p.experience} lang={locale === "en" ? "en" : undefined}>
      <JsonLd data={[propertyJsonLd(p, stats ?? {}), faqJsonLd(p.faq)]} />
      <Breadcrumbs
        items={[
          { name: t.home, path: path("/") },
          { name: p.name, path: path(`/${p.slug}`) },
        ]}
      />

      <header className="container-page pt-4">
        <p className="eyebrow">
          {p.location.city} · {p.location.region}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{p.seo.h1}</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--color-ink-soft)]">{p.shortIntro}</p>
        {usingEsFallback && t.translationNote && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t.translationNote}
          </p>
        )}
      </header>

      <Gallery images={p.gallery} name={p.name} />
      <div className="container-page">
        <ContentStatusNote status={p.galleryStatus} what={t.gallery} />
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section aria-labelledby="cap-heading">
            <h2 id="cap-heading" className="font-display text-2xl">
              {t.theProperty}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                [t.guests, guestsLabel(p.capacity.guests)],
                [t.bedrooms, p.capacity.bedrooms],
                [t.beds, p.capacity.beds],
                [t.bathrooms, p.capacity.bathrooms],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-[var(--color-line)] p-4">
                  <dt className="text-xs text-[var(--color-ink-soft)]">{label}</dt>
                  <dd className="mt-1 text-lg font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {p.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-2xl">{s.heading}</h2>
              {s.body.map((para, i) => (
                <p key={i} className="mt-3 text-[var(--color-ink-soft)]">
                  {para}
                </p>
              ))}
            </section>
          ))}

          <section aria-labelledby="amenities-heading">
            <h2 id="amenities-heading" className="font-display text-2xl">
              {t.amenities}
            </h2>
            {p.amenities.length > 0 ? (
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <li key={a.key} className="flex items-center gap-2">
                    <span aria-hidden className="text-[var(--accent-600)]">
                      ✓
                    </span>
                    {a.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[var(--color-ink-soft)]">{t.amenitiesPending}</p>
            )}
            <ContentStatusNote status={p.amenitiesStatus} what={t.amenitiesWhat} />
          </section>

          <section aria-labelledby="loc-heading">
            <h2 id="loc-heading" className="font-display text-2xl">
              {t.location}
            </h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              {t.locatedAt(p.name, p.location.area, p.location.city, p.location.region)}
            </p>
            {p.distances.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {p.distances.map((d) => (
                  <li
                    key={d.label}
                    className="flex justify-between border-b border-[var(--color-line)] pb-2"
                  >
                    <span>{d.label}</span>
                    <span className="text-[var(--color-ink-soft)]">
                      {d.km ? `${d.km} km` : ""}
                      {d.minutes ? ` · ${d.minutes} min` : d.km ? "" : t.distancePending}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <ContentStatusNote status={p.distancesStatus} what={t.distancesWhat} />
          </section>

          <section aria-labelledby="cancel-heading">
            <h2 id="cancel-heading" className="font-display text-2xl">
              {t.cancellation}
            </h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">{p.cancellationPolicy.summary}</p>
            <ContentStatusNote status={p.cancellationPolicy.status} what={t.cancellationWhat} />
          </section>

          {landings.length > 0 && (
            <section aria-labelledby="more-heading">
              <h2 id="more-heading" className="font-display text-2xl">
                {t.more}
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {landings.map((l) => (
                  <li key={l.path}>
                    <Link
                      href={l.path}
                      className="block rounded-xl border border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget
            propertySlug={p.slug}
            maxGuests={p.capacity.guests}
            minNightsHint={getRateConfig(p.slug)?.minNights}
          />
        </aside>
      </div>

      <ReviewsBlock reviews={p.reviews} propertyName={p.name} />
      <FaqBlock items={p.faq} heading={t.faqHeading(p.name)} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 p-3 backdrop-blur lg:hidden">
        <a
          href="#contenido"
          className="flex h-12 items-center justify-center rounded-full bg-[var(--accent-600)] font-medium text-white"
        >
          {t.stickyCta}
        </a>
      </div>
    </div>
  );
}
