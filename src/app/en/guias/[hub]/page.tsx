import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideHubEn, guideHubsWithEn } from "@/content/guides/hubs";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideHero, QuickFacts, PropertyCta, slugifyHeading } from "@/components/guides/GuideLayout";

export const dynamicParams = false;
export const revalidate = 3600;
export function generateStaticParams() {
  return guideHubsWithEn().map((h) => ({ hub: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<Metadata> {
  const { hub } = await params;
  const h = getGuideHubEn(hub);
  if (!h) return {};
  return {
    // Draft translation: never index, never emit hreflang / alternates.
    ...pageMetadata({ title: h.en.metaTitle, description: h.en.metaDescription, path: `/en/guias/${h.slug}` }),
    robots: { index: false, follow: true },
  };
}

export default async function EnGuideHubPage({ params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const h = getGuideHubEn(hub);
  if (!h) notFound();
  const en = h.en;

  return (
    <div data-experience={h.propertySlug === "javalambre" ? "ski" : "sea"}>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/en" },
            { name: "Guides", path: "/en/guias" },
            { name: en.h1, path: `/en/guias/${h.slug}` },
          ]),
        ]}
      />

      <div className="container-page pt-6">
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Draft English translation — pending review. The authoritative version is{" "}
          <Link href={`/guias/${h.slug}`} className="underline">
            in Spanish
          </Link>
          .
        </p>
      </div>

      <GuideHero
        propertySlug={h.propertySlug}
        eyebrow={en.eyebrow}
        title={en.h1}
        lead={en.lead}
        updated={h.updated}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/en" },
          { name: "Guides", path: "/en/guias" },
          { name: en.h1, path: `/en/guias/${h.slug}` },
        ]}
      />
      <QuickFacts facts={en.quickFacts} />

      <div className="container-page py-10">
        <article className="max-w-2xl">
          {en.sections.map((s) => (
            <section
              key={s.heading}
              id={slugifyHeading(s.heading)}
              className="scroll-mt-24 [&:not(:first-child)]:mt-10"
            >
              <h2 className="display-3">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-[var(--color-ink-soft)]">
                  {p}
                </p>
              ))}
            </section>
          ))}

          {en.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="display-3">Frequently asked questions</h2>
              <div className="pv-faq mt-4">
                {en.faq.map((f) => (
                  <details key={f.question}>
                    <summary>
                      {f.question}
                      <span aria-hidden className="pv-faq__sign">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 text-[var(--color-ink-soft)]">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <PropertyCta propertySlug={h.propertySlug} heading="Where to stay in this destination" />
        </article>
      </div>
    </div>
  );
}
