import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuide, publishedGuides, pillarGuide } from "@/content/guides";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { publishedLandings } from "@/content/landings";
import { pageMetadata, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedGuides().map((g) => ({ property: g.propertySlug, slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ property: string; slug: string }>;
}): Promise<Metadata> {
  const { property, slug } = await params;
  const guide = getGuide(property, slug);
  if (!guide) return {};
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guias/${property}/${slug}`,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ property: string; slug: string }>;
}) {
  const { property, slug } = await params;
  const guide = getGuide(property, slug);
  const prop = getPropertyBySlug(property);
  if (!guide || !prop || !guide.published) notFound();

  const pillar = pillarGuide(property);
  const siblings = publishedGuides(property).filter((g) => g.slug !== slug);
  const relatedLandings = publishedLandings().filter((l) => l.propertySlug === property).slice(0, 2);

  return (
    <div data-experience={prop.experience}>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Guías", path: "/guias" },
            { name: prop.location.city, path: `/guias#${prop.slug}` },
            { name: guide.h1, path: `/guias/${prop.slug}/${guide.slug}` },
          ]),
          ...(guide.faq ? [faqJsonLd(guide.faq)] : []),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
          { name: guide.h1, path: `/guias/${prop.slug}/${guide.slug}` },
        ]}
      />

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[1fr_300px]">
        <article className="max-w-2xl">
          {guide.pillar && <p className="eyebrow">Guía principal · {prop.location.city}</p>}
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{guide.h1}</h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">{guide.lead}</p>

          {guide.sections.map((s) => (
            <section key={s.heading} className="mt-8">
              <h2 className="font-display text-xl">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2 text-[var(--color-ink-soft)]">
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

          {guide.faq && guide.faq.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl">Preguntas frecuentes</h2>
              <div className="mt-3 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
                {guide.faq.map((f) => (
                  <details key={f.question} className="group py-3">
                    <summary className="cursor-pointer list-none font-medium">{f.question}</summary>
                    <p className="mt-2 text-[var(--color-ink-soft)]">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 rounded-xl border border-[var(--color-line)] bg-[var(--accent-50)] p-5">
            <p className="font-display text-lg">¿Te encaja esta escapada?</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {prop.name} — {prop.tagline}. Consulta fechas y precio total sin compromiso.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/${prop.slug}`}
                className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
              >
                Ver alojamiento y disponibilidad
              </Link>
              {relatedLandings.map((l) => (
                <Link
                  key={l.slug}
                  href={`/${l.propertySlug}/${l.slug}`}
                  className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-[var(--color-line)]"
                >
                  {l.h1}
                </Link>
              ))}
            </div>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {pillar && pillar.slug !== slug && (
            <Link
              href={`/guias/${prop.slug}/${pillar.slug}`}
              className="block rounded-xl border border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
            >
              <span className="eyebrow">Empieza por aquí</span>
              <span className="mt-1 block font-medium">{pillar.h1}</span>
            </Link>
          )}
          {siblings.length > 0 && (
            <div className="rounded-xl border border-[var(--color-line)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                Más sobre {prop.location.city}
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {siblings.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guias/${prop.slug}/${g.slug}`}
                      className="hover:text-[var(--accent-700)]"
                    >
                      {g.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
