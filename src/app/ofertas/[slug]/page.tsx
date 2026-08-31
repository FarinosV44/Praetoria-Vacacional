import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeasonalPage, seasonalPages } from "@/content/seasonal";
import { resolveProperty } from "@/domains/properties/content";
import { publishedLandings } from "@/content/landings";
import { pageMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { Picture } from "@/components/media/Picture";
import { heroPhoto } from "@/content/properties/photos";
import { getRateConfig } from "@/content/rates";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  // Draft pages are generated too (so the owner can preview) but render noindex
  // and are kept out of the sitemap.
  return seasonalPages.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeasonalPage(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/ofertas/${slug}`,
    noindex: page.status !== "published",
  });
}

export default async function SeasonalPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getSeasonalPage(slug);
  if (!page) notFound();
  const prop = await resolveProperty(page.propertySlug, "es");
  if (!prop) notFound();

  const photo = heroPhoto(page.propertySlug);
  const landing = publishedLandings().find((l) => l.propertySlug === page.propertySlug);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: prop.name, path: `/${prop.slug}` },
    { name: page.h1, path: `/ofertas/${page.slug}` },
  ];

  return (
    <div data-experience={prop.experience}>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          ...(page.faq && page.faq.length > 0 ? [faqJsonLd(page.faq)] : []),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <header className="container-page pt-4">
        <p className="eyebrow">{page.period}</p>
        <h1 className="mt-2 display-2">{page.h1}</h1>
        <p className="lede mt-3 max-w-2xl">{page.lead}</p>
        {page.status !== "published" && (
          <p className="mt-3 pv-note pv-note--warn">
            Borrador — esta página no está indexada.
          </p>
        )}
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
          {page.blocks.map((b) => (
            <section key={b.heading} className="[&:not(:first-child)]:mt-9">
              <h2 className="display-3">{b.heading}</h2>
              {b.body.map((para, i) => (
                <p key={i} className="mt-2 text-[var(--color-ink-soft)]">
                  {para}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/${prop.slug}`}
              className="pv-btn pv-btn--primary"
            >
              Ver el alojamiento
            </Link>
            {landing && (
              <Link
                href={`/${landing.propertySlug}/${landing.slug}`}
                className="pv-btn pv-btn--secondary"
              >
                {landing.h1}
              </Link>
            )}
          </div>

          {page.faq && page.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="display-3">Preguntas frecuentes</h2>
              <div className="pv-faq mt-4">
                {page.faq.map((f) => (
                  <details key={f.question}>
                    <summary>{f.question}<span aria-hidden className="pv-faq__sign">+</span></summary>
                    <p className="mt-2 text-[var(--color-ink-soft)]">{f.answer}</p>
                  </details>
                ))}
              </div>
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
    </div>
  );
}
