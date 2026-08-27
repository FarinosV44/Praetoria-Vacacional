import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getAllProperties } from "@/domains/properties/registry";
import { publishedGuides, pillarGuide } from "@/content/guides";

export const metadata: Metadata = pageMetadata({
  title: "Guías de destino",
  description:
    "Guías prácticas para preparar tu escapada: la nieve de Javalambre y la playa de Valencia. Información útil y enlaces a disponibilidad.",
  path: "/guias",
});

export default function GuiasPage() {
  const properties = getAllProperties();
  return (
    <div>
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
        ]}
      />
      <div className="container-page py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Guías de destino</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-ink-soft)]">
          Todo lo que necesitas para decidir y preparar tu escapada, por destino.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {properties.map((p) => {
            const pillar = pillarGuide(p.slug);
            const rest = publishedGuides(p.slug).filter((g) => !g.pillar);
            return (
              <section
                key={p.slug}
                id={p.slug}
                data-experience={p.experience}
                className="scroll-mt-24 rounded-[var(--radius-card)] border border-[var(--color-line)] p-6"
              >
                <h2 className="font-display text-2xl">{p.location.city}</h2>
                <p className="mt-2 text-[var(--color-ink-soft)]">{p.shortIntro}</p>
                {pillar && (
                  <Link
                    href={`/guias/${p.slug}/${pillar.slug}`}
                    className="mt-4 block rounded-xl bg-[var(--accent-50)] p-4 hover:ring-1 hover:ring-[var(--accent-500)]"
                  >
                    <span className="eyebrow">Guía principal</span>
                    <span className="mt-1 block font-display text-lg">{pillar.h1}</span>
                  </Link>
                )}
                <ul className="mt-4 space-y-2 text-sm">
                  {rest.map((g) => (
                    <li key={g.slug}>
                      <Link
                        className="hover:text-[var(--accent-700)]"
                        href={`/guias/${p.slug}/${g.slug}`}
                      >
                        {g.h1}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link className="font-medium text-[var(--accent-700)]" href={`/${p.slug}`}>
                      Ver el alojamiento y consultar fechas →
                    </Link>
                  </li>
                </ul>
              </section>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-[var(--color-ink-soft)]">
          Seguimos ampliando las guías con más contenido por destino (familia, gastronomía,
          planes sin esquí). Se publican progresivamente.
        </p>
      </div>
    </div>
  );
}
