import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLanding, publishedLandings } from "@/content/landings";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BookingWidget } from "@/components/booking/BookingWidget";

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

  return (
    <div data-experience={prop.experience}>
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: prop.name, path: `/${prop.slug}` },
          { name: landing.h1, path: `/${prop.slug}/${landing.slug}` },
        ]}
      />

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[1fr_360px]">
        <article className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl">{landing.h1}</h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">{landing.lead}</p>

          {landing.blocks.map((b) => (
            <section key={b.heading} className="mt-8">
              <h2 className="font-display text-xl">{b.heading}</h2>
              {b.body.map((p, i) => (
                <p key={i} className="mt-2 text-[var(--color-ink-soft)]">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-10 rounded-xl border border-[var(--color-line)] bg-white p-5">
            <p className="font-display text-lg">{prop.name}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{prop.tagline}</p>
            <Link
              href={`/${prop.slug}`}
              className="mt-3 inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
            >
              Ver el alojamiento completo
            </Link>
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget propertySlug={prop.slug} maxGuests={prop.capacity.guests} minNightsHint={2} />
        </aside>
      </div>
    </div>
  );
}
