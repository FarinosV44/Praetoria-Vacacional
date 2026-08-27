import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideHub, guideHubs } from "@/content/guides/hubs";
import { satelliteGuides } from "@/content/guides";
import { publishedLandings } from "@/content/landings";
import { publishedSeasonalPages } from "@/content/seasonal";
import { pageMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  GuideHero,
  QuickFacts,
  TableOfContents,
  PropertyCta,
  slugifyHeading,
} from "@/components/guides/GuideLayout";

export const dynamicParams = false;
export function generateStaticParams() {
  return guideHubs.map((h) => ({ hub: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<Metadata> {
  const { hub } = await params;
  const h = getGuideHub(hub);
  if (!h) return {};
  return pageMetadata({
    title: h.metaTitle,
    description: h.metaDescription,
    path: `/guias/${h.slug}`,
  });
}

export default async function GuideHubPage({ params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const h = getGuideHub(hub);
  if (!h) notFound();

  const satellites = satelliteGuides(h.slug);
  const landings = publishedLandings().filter((l) => l.propertySlug === h.propertySlug);
  const seasonal = publishedSeasonalPages().filter((s) => s.propertySlug === h.propertySlug);
  const toc = h.sections.map((s) => ({ id: slugifyHeading(s.heading), label: s.heading }));

  return (
    <div data-experience={h.propertySlug === "javalambre" ? "ski" : "sea"}>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Guías", path: "/guias" },
            { name: h.title, path: `/guias/${h.slug}` },
          ]),
          faqJsonLd(h.faq),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: h.h1,
            description: h.metaDescription,
            dateModified: h.updated,
          },
        ]}
      />
      <GuideHero
        propertySlug={h.propertySlug}
        eyebrow={h.eyebrow}
        title={h.h1}
        lead={h.lead}
        updated={h.updated}
      />
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
          { name: h.title, path: `/guias/${h.slug}` },
        ]}
      />
      <QuickFacts facts={h.quickFacts} />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block">
          <TableOfContents items={toc} />
        </div>

        <article className="max-w-2xl">
          {h.sections.map((s) => (
            <section key={s.heading} id={slugifyHeading(s.heading)} className="scroll-mt-24 [&:not(:first-child)]:mt-10">
              <h2 className="font-display text-2xl">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-[var(--color-ink-soft)]">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--color-ink-soft)]">
                  {s.list.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {h.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl">Preguntas frecuentes</h2>
              <div className="mt-3 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
                {h.faq.map((f) => (
                  <details key={f.question} className="group py-3">
                    <summary className="cursor-pointer list-none font-medium">{f.question}</summary>
                    <p className="mt-2 text-[var(--color-ink-soft)]">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <PropertyCta propertySlug={h.propertySlug} heading="El alojamiento de este destino" />
        </article>
      </div>

      {(satellites.length > 0 || landings.length > 0 || seasonal.length > 0) && (
        <section className="border-t border-[var(--color-line)] bg-white py-14">
          <div className="container-page">
            <h2 className="font-display text-2xl">Guías de {h.propertySlug === "javalambre" ? "Javalambre" : "la costa sur de Valencia"}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {satellites.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guias/${h.slug}/${g.slug}`}
                    className="block h-full rounded-xl border border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                  >
                    <span className="font-medium">{g.h1}</span>
                    <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                      {g.description}
                    </span>
                  </Link>
                </li>
              ))}
              {landings.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/${l.propertySlug}/${l.slug}`}
                    className="block h-full rounded-xl border border-dashed border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                  >
                    <span className="font-medium">{l.h1}</span>
                    <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                      Reserva directa
                    </span>
                  </Link>
                </li>
              ))}
              {seasonal.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/ofertas/${s.slug}`}
                    className="block h-full rounded-xl border border-dashed border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                  >
                    <span className="font-medium">{s.h1}</span>
                    <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                      {s.period}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
