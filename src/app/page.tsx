import Image from "next/image";
import Link from "next/link";
import { getAllProperties, getPropertiesByExperience } from "@/domains/properties/registry";
import { AvailabilitySearch } from "@/components/search/AvailabilitySearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { directBookingAdvantages, homeFaq, trustSignals } from "@/content/site";
import { faqJsonLd } from "@/lib/seo";

export default function HomePage() {
  const properties = getAllProperties();
  const [ski] = getPropertiesByExperience("ski");
  const [sea] = getPropertiesByExperience("sea");

  return (
    <>
      <JsonLd data={faqJsonLd(homeFaq)} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 grid grid-cols-2">
          <div data-experience="ski" className="relative">
            {ski && (
              <Image
                src={ski.gallery.find((g) => g.hero)?.src ?? ski.gallery[0]!.src}
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-[var(--color-ski-700)]/45" />
          </div>
          <div data-experience="sea" className="relative">
            {sea && (
              <Image
                src={sea.gallery.find((g) => g.hero)?.src ?? sea.gallery[0]!.src}
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-[var(--color-sea-700)]/40" />
          </div>
        </div>

        <div className="container-page flex min-h-[70vh] flex-col justify-center py-16 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            Praetoria Vacacional
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
            Dos escapadas, una reserva directa: la nieve de Javalambre y el mar de Valencia.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">
            Consulta disponibilidad real, precio total y reserva en tres pasos. Sin comisiones de
            intermediarios y con confirmación inmediata.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {properties.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                data-experience={p.experience}
                className="rounded-full bg-white/95 px-5 py-3 text-sm font-medium text-[var(--accent-700)] backdrop-blur transition hover:bg-white"
              >
                {p.experience === "ski" ? "❄ " : "☀ "}
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section id="buscador" className="container-page -mt-12 pb-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="sr-only">Buscar disponibilidad</h2>
          <AvailabilitySearch />
        </div>
      </section>

      {/* Property cards */}
      <section aria-labelledby="alojamientos-heading" className="container-page py-14">
        <h2 id="alojamientos-heading" className="font-display text-2xl sm:text-3xl">
          Elige tu escapada
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Cada alojamiento tiene su propio calendario, sus precios y su personalidad. El motor de
          reserva y el pago seguro son los mismos.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {properties.map((p) => (
            <PropertyCard key={p.slug} property={p} />
          ))}
        </div>
      </section>

      {/* Direct booking advantages */}
      <section aria-labelledby="ventajas-heading" className="bg-white py-16">
        <div className="container-page">
          <h2 id="ventajas-heading" className="font-display text-2xl sm:text-3xl">
            Por qué reservar directamente
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {directBookingAdvantages.map((a) => (
              <div key={a.title} className="rounded-xl border border-[var(--color-line)] p-5">
                <h3 className="font-display text-lg">{a.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.body}</p>
              </div>
            ))}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-ink-soft)]">
            {trustSignals.map((t) => (
              <li key={t.label} className="flex items-center gap-2">
                <span aria-hidden className="text-[var(--accent-600)]">
                  ✓
                </span>
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqBlock items={homeFaq} heading="Preguntas frecuentes" />

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 p-3 backdrop-blur sm:hidden">
        <a
          href="#buscador"
          className="flex h-12 items-center justify-center rounded-full bg-[var(--accent-600)] font-medium text-white"
        >
          Ver disponibilidad
        </a>
      </div>
    </>
  );
}
