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

        <div className="container-page flex min-h-[78vh] flex-col justify-center py-20 text-white">
          <p className="eyebrow !text-white/75">Praetoria Vacacional</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-[4rem]">
            La nieve de Javalambre y el mar de Valencia, en reserva directa.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90">
            Disponibilidad real, precio total y reserva en tres pasos. Sin comisiones de
            intermediarios y con confirmación inmediata.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {properties.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                data-experience={p.experience}
                className="group inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-sm font-medium text-[var(--accent-700)] backdrop-blur transition hover:bg-white hover:shadow-lg"
              >
                <span aria-hidden className="text-base">
                  {p.experience === "ski" ? "❄" : "☀"}
                </span>
                {p.name}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
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
      <section aria-labelledby="alojamientos-heading" className="container-page py-16 reveal">
        <p className="eyebrow">Dos destinos</p>
        <h2 id="alojamientos-heading" className="mt-2 font-display text-3xl sm:text-4xl">
          Elige tu escapada
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">
          Cada alojamiento tiene su propio calendario, sus precios y su personalidad. El motor de
          reserva y el pago seguro son los mismos.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {properties.map((p) => (
            <PropertyCard key={p.slug} property={p} />
          ))}
        </div>
      </section>

      {/* Storytelling: two worlds */}
      {[sea, ski].map((p, i) =>
        p ? (
          <section
            key={p.slug}
            data-experience={p.experience}
            className="reveal border-t border-[var(--color-line)] bg-[var(--accent-50)]"
          >
            <div
              className={`container-page grid items-center gap-8 py-16 md:grid-cols-2 ${
                i % 2 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
                <Image
                  src={p.gallery[1]?.src ?? p.gallery[0]!.src}
                  alt={p.gallery[1]?.alt ?? p.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="eyebrow">
                  {p.experience === "sea" ? "Mediterráneo" : "Montaña"}
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl">
                  {p.experience === "sea"
                    ? "Días de playa, tardes de ciudad"
                    : "Nieve, silencio y montaña"}
                </h2>
                <p className="mt-3 text-[var(--color-ink-soft)]">{p.shortIntro}</p>
                <Link
                  href={`/${p.slug}`}
                  className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--accent-600)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-700)]"
                >
                  Descubrir {p.name}
                </Link>
              </div>
            </div>
          </section>
        ) : null,
      )}

      {/* Direct booking advantages */}
      <section aria-labelledby="ventajas-heading" className="bg-white py-20">
        <div className="container-page reveal">
          <p className="eyebrow">Reserva directa</p>
          <h2 id="ventajas-heading" className="mt-2 font-display text-3xl sm:text-4xl">
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
