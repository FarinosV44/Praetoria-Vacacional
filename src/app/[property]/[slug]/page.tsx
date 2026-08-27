import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLanding, publishedLandings } from "@/content/landings";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { pageMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { FaqBlock } from "@/components/FaqBlock";
import { Picture } from "@/components/media/Picture";
import { heroPhoto } from "@/content/properties/photos";
import { getRateConfig } from "@/content/rates";
import { guideLinksFor } from "@/domains/marketing/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedLandings().map((l) => ({ property: l.propertySlug, slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ property: string; slug: string }>;
}): Promise<Metadata> {
  const { property, slug } = await params;
  const landing = getLanding(property, slug);
  if (!landing) return {};
  return pageMetadata({
    title: landing.title,
    description: landing.description,
    path: `/${property}/${slug}`,
  });
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ property: string; slug: string }>;
}) {
  const { property, slug } = await params;
  const landing = getLanding(property, slug);
  const prop = getPropertyBySlug(property);
  if (!landing || !prop) notFound();

  const photo = heroPhoto(property);
  const guides = guideLinksFor(property).slice(0, 4);
  const topReviews = [...prop.reviews].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: prop.name, path: `/${prop.slug}` },
    { name: landing.h1, path: `/${prop.slug}/${landing.slug}` },
  ];

  return (
    <div data-experience={prop.experience}>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          ...(landing.faq && landing.faq.length > 0 ? [faqJsonLd(landing.faq)] : []),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      {/* Commercial hero — keyword + real photo + availability, before deep copy */}
      <header className="container-page pt-4">
        <h1 className="font-display text-3xl sm:text-4xl">{landing.h1}</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--color-ink-soft)]">{landing.lead}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink-soft)]">
          {prop.rating && (
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-md bg-[var(--accent-700)] px-1.5 py-0.5 text-xs font-semibold text-white">
                {prop.rating.value.toFixed(1)}
              </span>
              {prop.rating.count} opiniones en Booking
            </span>
          )}
          <span>
            {prop.headlineDistance.label} · {prop.headlineDistance.value}
          </span>
        </div>
      </header>

      {photo && (
        <div className="container-page mt-5">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] sm:aspect-[21/9]">
            <Picture photo={photo} priority sizes="100vw" imgClassName="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <article className="min-w-0 max-w-2xl">
          {/* Advantages summary — commercial block first */}
          {prop.highlights.length > 0 && (
            <section aria-labelledby="ventajas-heading">
              <h2 id="ventajas-heading" className="font-display text-2xl">
                Por qué reservar aquí
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {prop.highlights.slice(0, 4).map((h) => (
                  <li key={h.title} className="rounded-xl border border-[var(--color-line)] p-4">
                    <p className="flex items-start gap-2 text-sm font-medium">
                      <span aria-hidden className="mt-0.5 text-[var(--accent-600)]">
                        ◆
                      </span>
                      {h.title}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${prop.slug}`}
                className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
              >
                Ver el alojamiento completo
              </Link>
            </section>
          )}

          {/* Distances / local context */}
          <section aria-labelledby="dist-heading" className="mt-10">
            <h2 id="dist-heading" className="font-display text-2xl">
              Qué tienes cerca
            </h2>
            <table className="mt-3 w-full border-collapse text-sm">
              <tbody>
                {prop.nearby.slice(0, 7).map((n) => (
                  <tr key={n.name} className="border-b border-[var(--color-line)]">
                    <td className="py-2 pr-4">{n.name}</td>
                    <td className="py-2 text-right font-medium tabular-nums whitespace-nowrap text-[var(--color-ink-soft)]">
                      {n.distance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Deep copy after the commercial block */}
          {landing.blocks.map((b) => (
            <section key={b.heading} className="mt-10">
              <h2 className="font-display text-2xl">{b.heading}</h2>
              {b.body.map((para, i) => (
                <p key={i} className="mt-2 text-[var(--color-ink-soft)]">
                  {para}
                </p>
              ))}
            </section>
          ))}

          {topReviews.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">Opiniones de huéspedes</h2>
              <div className="mt-4 space-y-4">
                {topReviews.map((r) => (
                  <figure
                    key={r.author + r.date}
                    className="rounded-xl border border-[var(--color-line)] p-4"
                  >
                    <blockquote className="text-sm text-[var(--color-ink-soft)]">“{r.text}”</blockquote>
                    <figcaption className="mt-2 text-xs">
                      <span className="font-medium">{r.author}</span> · {r.rating}/10 ·{" "}
                      {r.source === "booking" ? "Booking" : r.source}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Link
                href={`/${prop.slug}#opiniones`}
                className="mt-3 inline-block text-sm text-[var(--accent-700)] hover:underline"
              >
                Ver todas las opiniones →
              </Link>
            </section>
          )}

          {guides.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">Guías para preparar la escapada</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {guides.map((g) => (
                  <li key={g.path}>
                    <Link
                      href={g.path}
                      className="block rounded-xl border border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                    >
                      {g.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget
            propertySlug={prop.slug}
            maxGuests={prop.capacity.guests}
            minNightsHint={getRateConfig(prop.slug)?.minNights ?? 2}
          />
        </aside>
      </div>

      {landing.faq && landing.faq.length > 0 && (
        <FaqBlock items={landing.faq} heading="Preguntas frecuentes" />
      )}
    </div>
  );
}
