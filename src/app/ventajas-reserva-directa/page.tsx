import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { directBookingAdvantages, trustSignals } from "@/content/site";
import { getAllProperties } from "@/domains/properties/registry";

export const metadata: Metadata = pageMetadata({
  title: "Ventajas de reservar directamente",
  description:
    "Reservar directamente en Praetoria Vacacional significa precio total sin comisiones, confirmación inmediata y trato directo con el propietario.",
  path: "/ventajas-reserva-directa",
});

export default function VentajasPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Ventajas de reservar directo", path: "/ventajas-reserva-directa" },
        ]}
      />
      <div className="container-page max-w-3xl py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Ventajas de reservar directamente</h1>
        <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
          Cuando reservas en esta web tratas directamente con quien gestiona el alojamiento. Ni
          intermediarios ni recargos.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {directBookingAdvantages.map((a) => (
            <div key={a.title} className="rounded-xl border border-[var(--color-line)] p-5">
              <h2 className="font-display text-lg">{a.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-xl">Señales de confianza</h2>
        <ul className="mt-3 space-y-2 text-[var(--color-ink-soft)]">
          {trustSignals.map((t) => (
            <li key={t.label} className="flex items-center gap-2">
              <span aria-hidden className="text-[var(--accent-600)]">
                ✓
              </span>
              {t.label}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          {getAllProperties().map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              data-experience={p.experience}
              className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
            >
              Ver {p.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
