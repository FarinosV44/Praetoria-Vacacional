import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProperties, getPropertyBySlug } from "@/domains/properties/registry";
import { pageMetadata, propertyJsonLd, faqJsonLd } from "@/lib/seo";
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
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProperties().map((p) => ({ property: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ property: string }>;
}): Promise<Metadata> {
  const { property } = await params;
  const p = getPropertyBySlug(property);
  if (!p) return {};
  return pageMetadata({
    title: p.seo.metaTitle,
    description: p.seo.metaDescription,
    path: `/${p.slug}`,
    images: [p.seo.ogImage],
  });
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ property: string }>;
}) {
  const { property } = await params;
  const p = getPropertyBySlug(property);
  if (!p) notFound();

  const stats = reviewStats(p.reviews);
  const landings = [...landingLinksFor(p.slug), ...guideLinksFor(p.slug)];

  return (
    <div data-experience={p.experience}>
      <JsonLd
        data={[
          propertyJsonLd(p, stats ?? {}),
          faqJsonLd(p.faq),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: p.name, path: `/${p.slug}` },
        ]}
      />

      <header className="container-page pt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-700)]">
          {p.location.city} · {p.location.region}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{p.seo.h1}</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--color-ink-soft)]">{p.shortIntro}</p>
      </header>

      <Gallery images={p.gallery} name={p.name} />
      <div className="container-page">
        <ContentStatusNote status={p.galleryStatus} what="Galería de fotos" />
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {/* Capacity */}
          <section aria-labelledby="cap-heading">
            <h2 id="cap-heading" className="font-display text-2xl">
              El alojamiento
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Huéspedes", guestsLabel(p.capacity.guests)],
                ["Habitaciones", p.capacity.bedrooms],
                ["Camas", p.capacity.beds],
                ["Baños", p.capacity.bathrooms],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--color-line)] p-4">
                  <dt className="text-xs text-[var(--color-ink-soft)]">{label}</dt>
                  <dd className="mt-1 text-lg font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Narrative sections */}
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

          {/* Amenities */}
          <section aria-labelledby="amenities-heading">
            <h2 id="amenities-heading" className="font-display text-2xl">
              Equipamiento
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
              <p className="mt-3 text-[var(--color-ink-soft)]">
                El listado detallado de equipamiento se publicará con la información definitiva del
                propietario.
              </p>
            )}
            <ContentStatusNote status={p.amenitiesStatus} what="Listado de equipamiento" />
          </section>

          {/* Location & distances */}
          <section aria-labelledby="loc-heading">
            <h2 id="loc-heading" className="font-display text-2xl">
              Ubicación y cómo llegar
            </h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              {p.name} está en {p.location.area}, {p.location.city} ({p.location.region}).
            </p>
            {p.distances.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {p.distances.map((d) => (
                  <li key={d.label} className="flex justify-between border-b border-[var(--color-line)] pb-2">
                    <span>{d.label}</span>
                    <span className="text-[var(--color-ink-soft)]">
                      {d.km ? `${d.km} km` : ""}
                      {d.minutes ? ` · ${d.minutes} min` : d.km ? "" : "distancia por confirmar"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <ContentStatusNote status={p.distancesStatus} what="Distancias exactas" />
          </section>

          {/* Cancellation */}
          <section aria-labelledby="cancel-heading">
            <h2 id="cancel-heading" className="font-display text-2xl">
              Política de cancelación
            </h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">{p.cancellationPolicy.summary}</p>
            <ContentStatusNote status={p.cancellationPolicy.status} what="Condiciones exactas de cancelación" />
          </section>

          {/* Internal links to landings */}
          {landings.length > 0 && (
            <section aria-labelledby="more-heading">
              <h2 id="more-heading" className="font-display text-2xl">
                Más sobre esta escapada
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

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget
            propertySlug={p.slug}
            maxGuests={p.capacity.guests}
            minNightsHint={getRateConfig(p.slug)?.minNights}
          />
        </aside>
      </div>

      <ReviewsBlock reviews={p.reviews} propertyName={p.name} />
      <FaqBlock items={p.faq} heading={`Preguntas frecuentes sobre ${p.name}`} />

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 p-3 backdrop-blur lg:hidden">
        <a
          href="#contenido"
          className="flex h-12 items-center justify-center rounded-full bg-[var(--accent-600)] font-medium text-white"
        >
          Consultar fechas y reservar
        </a>
      </div>
    </div>
  );
}
