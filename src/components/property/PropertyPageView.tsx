import Link from "next/link";
import { getPropertyBySlug, localizedProperty } from "@/domains/properties/registry";
import { propertyJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Gallery } from "@/components/property/Gallery";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { ReviewsBlock } from "@/components/ReviewsBlock";
import { FaqBlock } from "@/components/FaqBlock";
import { landingLinksFor, guideLinksFor } from "@/domains/marketing/navigation";
import { getRateConfig } from "@/content/rates";
import { propertyPhotos } from "@/content/properties/photos";
import { localizedPath, type Locale } from "@/i18n/config";

const T = {
  es: {
    home: "Inicio",
    theProperty: "El alojamiento",
    guests: "Huéspedes",
    bedrooms: "Dormitorios",
    beds: "Camas",
    bathrooms: "Baños",
    size: "Superficie",
    amenities: "Equipamiento",
    location: "Ubicación y cómo llegar",
    gettingThere: "Cómo llegar",
    nearby: "Qué tienes cerca",
    stayInfo: "Información de la estancia",
    checkIn: "Entrada",
    checkOut: "Salida",
    deposit: "Fianza",
    rules: "Normas",
    license: "Número de licencia",
    cancellation: "Política de cancelación",
    more: "Sigue descubriendo",
    faqHeading: (n: string) => `Preguntas frecuentes sobre ${n}`,
    stickyCta: "Consultar fechas y reservar",
    ratingOn: (n: number) => `${n} opiniones en Booking`,
  },
  en: {
    home: "Home",
    theProperty: "The property",
    guests: "Guests",
    bedrooms: "Bedrooms",
    beds: "Beds",
    bathrooms: "Bathrooms",
    size: "Size",
    amenities: "Amenities",
    location: "Location & how to get there",
    gettingThere: "How to get here",
    nearby: "What's nearby",
    stayInfo: "Stay information",
    checkIn: "Check-in",
    checkOut: "Check-out",
    deposit: "Deposit",
    rules: "House rules",
    license: "Licence number",
    cancellation: "Cancellation policy",
    more: "Keep exploring",
    faqHeading: (n: string) => `Frequently asked questions about ${n}`,
    stickyCta: "Check dates & book",
    ratingOn: (n: number) => `${n} reviews on Booking`,
  },
} as const;

export function PropertyPageView({ slug, locale }: { slug: string; locale: Locale }) {
  const raw = getPropertyBySlug(slug);
  if (!raw) return null;
  const p = localizedProperty(raw, locale);
  const t = T[locale];
  const photos = propertyPhotos(slug);
  const path = (n: string) => localizedPath(locale, n);
  const links = locale === "es" ? [...landingLinksFor(slug), ...guideLinksFor(slug)] : [];

  const facts: [string, string | number][] = [
    [t.guests, p.capacity.guests],
    [t.bedrooms, p.capacity.bedrooms],
    [t.beds, p.capacity.bedConfig],
    [t.bathrooms, p.capacity.bathrooms],
  ];
  if (p.capacity.sizeSqm) facts.push([t.size, `${p.capacity.sizeSqm} m²`]);

  return (
    <div data-experience={p.experience} lang={locale === "en" ? "en" : undefined}>
      <JsonLd
        data={[
          propertyJsonLd(p, p.rating ? { ratingValue: p.rating.value, reviewCount: p.rating.count } : {}),
          faqJsonLd(p.faq),
        ]}
      />
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
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink-soft)]">
          {p.rating && (
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-md bg-[var(--accent-700)] px-1.5 py-0.5 text-xs font-semibold text-white">
                {p.rating.value.toFixed(1)}
              </span>
              {t.ratingOn(p.rating.count)}
            </span>
          )}
          <span>{p.headlineDistance.label} · {p.headlineDistance.value}</span>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-[var(--color-ink-soft)]">{p.shortIntro}</p>
      </header>

      <Gallery photos={photos} name={p.name} />

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-12">
          {/* Quick facts */}
          <section aria-labelledby="cap-heading">
            <h2 id="cap-heading" className="font-display text-2xl">
              {t.theProperty}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--color-line)] p-4">
                  <dt className="text-xs text-[var(--color-ink-soft)]">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
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

          {/* Amenities grouped */}
          <section aria-labelledby="amenities-heading">
            <h2 id="amenities-heading" className="font-display text-2xl">
              {t.amenities}
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {p.amenityGroups.map((g) => (
                <div key={g.category}>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{g.category}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-ink-soft)]">
                    {g.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden className="mt-0.5 text-[var(--accent-600)]">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Location */}
          <section aria-labelledby="loc-heading">
            <h2 id="loc-heading" className="font-display text-2xl">
              {t.location}
            </h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              {p.name} — {p.location.addressLine}, {p.location.postalCode} {p.location.city}.
            </p>

            <h3 className="mt-6 text-sm font-semibold">{t.gettingThere}</h3>
            {p.location.gettingThere.map((para, i) => (
              <p key={i} className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {para}
              </p>
            ))}

            <h3 className="mt-6 text-sm font-semibold">{t.nearby}</h3>
            <ul className="mt-3 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] text-sm">
              {p.nearby.map((n) => (
                <li key={n.name} className="flex justify-between gap-4 py-2">
                  <span>{n.name}</span>
                  <span className="shrink-0 text-[var(--color-ink-soft)]">{n.distance}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
              Distancias estimadas (fuente: Booking.com / OpenStreetMap).
            </p>
          </section>

          {/* Stay info */}
          <section aria-labelledby="stay-heading">
            <h2 id="stay-heading" className="font-display text-2xl">
              {t.stayInfo}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t.checkIn} value={p.stayInfo.checkIn} />
              <Row label={t.checkOut} value={p.stayInfo.checkOut} />
              {p.stayInfo.deposit && <Row label={t.deposit} value={p.stayInfo.deposit} />}
              {p.stayInfo.licenseNumber && (
                <Row label={t.license} value={p.stayInfo.licenseNumber} />
              )}
            </dl>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-soft)]">
              {p.stayInfo.notes.map((n) => (
                <li key={n}>· {n}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-semibold">{t.cancellation}</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{p.cancellationPolicy.summary}</p>
          </section>

          {links.length > 0 && (
            <section aria-labelledby="more-heading">
              <h2 id="more-heading" className="font-display text-2xl">
                {t.more}
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {links.map((l) => (
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
            locale={locale}
          />
        </aside>
      </div>

      <ReviewsBlock reviews={p.reviews} propertyName={p.name} rating={p.rating} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--color-line)] pb-2 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="sm:text-right">{value}</dd>
    </div>
  );
}
