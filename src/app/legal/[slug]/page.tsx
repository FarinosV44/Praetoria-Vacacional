import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, legalSlugs } from "@/content/legal";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamicParams = false;
export function generateStaticParams() {
  return legalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};
  return pageMetadata({
    title: doc.title,
    description: doc.intro,
    path: `/legal/${slug}`,
    noindex: false,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <article>
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: doc.title, path: `/legal/${slug}` },
        ]}
      />
      <div className="container-page max-w-3xl py-10">
        <h1 className="display-2">{doc.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Última actualización: {doc.updated}
        </p>
        <p className="mt-4 text-[var(--color-ink-soft)]">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="font-display text-xl">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-[var(--color-ink-soft)]">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
