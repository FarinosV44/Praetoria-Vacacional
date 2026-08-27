import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { guideHubs } from "@/content/guides/hubs";
import { resolveSatelliteGuides } from "@/content/guides/overrides";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Guías de destino: Javalambre y la costa sur de Valencia",
  description:
    "Guías prácticas para preparar tu escapada: la sierra de Javalambre y Camarena de la Sierra, y la playa Les Palmeretes y la costa sur de Valencia.",
  path: "/guias",
});

export default async function GuiasPage() {
  const satellitesByHub = new Map(
    await Promise.all(
      guideHubs.map(async (h) => [h.slug, await resolveSatelliteGuides(h.slug)] as const),
    ),
  );
  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
        ]}
      />
      <div className="container-page py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Guías de destino</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-ink-soft)]">
          Todo lo que necesitas para decidir y preparar tu escapada, por destino: cómo llegar,
          qué hacer y dónde alojarse.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {guideHubs.map((h) => {
            const satellites = satellitesByHub.get(h.slug) ?? [];
            return (
              <section
                key={h.slug}
                data-experience={h.propertySlug === "javalambre" ? "ski" : "sea"}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-6"
              >
                <p className="eyebrow">{h.eyebrow}</p>
                <h2 className="mt-1 font-display text-2xl">{h.title}</h2>
                <p className="mt-2 text-[var(--color-ink-soft)]">{h.lead}</p>
                <Link
                  href={`/guias/${h.slug}`}
                  className="mt-4 inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
                >
                  Abrir la guía de destino
                </Link>
                {satellites.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4 text-sm">
                    {satellites.map((g) => (
                      <li key={g.slug}>
                        <Link
                          className="hover:text-[var(--accent-700)]"
                          href={`/guias/${h.slug}/${g.slug}`}
                        >
                          {g.h1}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
