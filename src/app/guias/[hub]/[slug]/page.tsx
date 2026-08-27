import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideHub } from "@/content/guides/hubs";
import { guides as baseGuides } from "@/content/guides";
import { resolveSatelliteGuide, resolveSatelliteGuides } from "@/content/guides/overrides";
import { pageMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  GuideHero,
  TableOfContents,
  PropertyCta,
  slugifyHeading,
} from "@/components/guides/GuideLayout";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  // Draft guides are generated too (preview) but render noindex; publishing one
  // via the CMS then just flips the meta robots on the next revalidation.
  return baseGuides
    .filter((g) => !g.pillar)
    .map((g) => ({
      hub: g.propertySlug === "valencia" ? "valencia-playa" : "javalambre",
      slug: g.slug,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string; slug: string }>;
}): Promise<Metadata> {
  const { hub, slug } = await params;
  const found = await resolveSatelliteGuide(hub, slug);
  if (!found) return {};
  return pageMetadata({
    title: found.guide.title,
    description: found.guide.description,
    path: `/guias/${hub}/${slug}`,
    noindex: !found.published,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ hub: string; slug: string }>;
}) {
  const { hub, slug } = await params;
  const found = await resolveSatelliteGuide(hub, slug);
  const h = getGuideHub(hub);
  if (!found || !h) notFound();
  const g = found.guide;

  const siblings = (await resolveSatelliteGuides(hub)).filter((x) => x.slug !== slug);
  const toc = g.sections.map((s) => ({ id: slugifyHeading(s.heading), label: s.heading }));

  return (
    <div data-experience={g.propertySlug === "javalambre" ? "ski" : "sea"}>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Guías", path: "/guias" },
            { name: h.title, path: `/guias/${hub}` },
            { name: g.h1, path: `/guias/${hub}/${slug}` },
          ]),
          ...(found.published && g.faq && g.faq.length > 0 ? [faqJsonLd(g.faq)] : []),
          ...(found.published
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "Article",
                  headline: g.h1,
                  description: g.description,
                  about: g.keyword,
                },
              ]
            : []),
        ]}
      />
      <GuideHero propertySlug={g.propertySlug} eyebrow={`Guía · ${h.title}`} title={g.h1} lead={g.lead} />
      {!found.published && (
        <p className="container-page mt-3 rounded-md bg-amber-100 px-3 py-1 text-sm text-amber-900">
          Borrador — esta guía no está indexada ni enlazada públicamente.
        </p>
      )}
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
          { name: h.title, path: `/guias/${hub}` },
          { name: g.h1, path: `/guias/${hub}/${slug}` },
        ]}
      />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block">
          <TableOfContents items={toc} />
        </div>
        <article className="max-w-2xl">
          {g.sections.map((s) => (
            <section
              key={s.heading}
              id={slugifyHeading(s.heading)}
              className="scroll-mt-24 [&:not(:first-child)]:mt-10"
            >
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

          {g.faq && g.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl">Preguntas frecuentes</h2>
              <div className="mt-3 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
                {g.faq.map((f) => (
                  <details key={f.question} className="group py-3">
                    <summary className="cursor-pointer list-none font-medium">{f.question}</summary>
                    <p className="mt-2 text-[var(--color-ink-soft)]">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <PropertyCta propertySlug={g.propertySlug} heading="Para esta escapada" />

          <p className="mt-8 text-sm">
            <Link href={`/guias/${hub}`} className="text-[var(--accent-700)] hover:underline">
              ← Volver a la {h.title}
            </Link>
          </p>
        </article>
      </div>

      {siblings.length > 0 && (
        <section className="border-t border-[var(--color-line)] bg-white py-14">
          <div className="container-page">
            <h2 className="font-display text-2xl">También te puede interesar</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/guias/${hub}/${s.slug}`}
                    className="block h-full rounded-xl border border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                  >
                    {s.h1}
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
