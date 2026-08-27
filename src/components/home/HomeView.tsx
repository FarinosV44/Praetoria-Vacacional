import Link from "next/link";
import { getPropertiesByExperience, localizedProperty } from "@/domains/properties/registry";
import { AvailabilitySearch } from "@/components/search/AvailabilitySearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { Picture } from "@/components/media/Picture";
import { faqJsonLd } from "@/lib/seo";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath, type Locale } from "@/i18n/config";
import { heroPhoto, propertyPhotos } from "@/content/properties/photos";
import {
  directBookingAdvantages,
  directBookingAdvantagesEn,
  homeFaq,
  homeFaqEn,
  trustSignals,
  trustSignalsEn,
} from "@/content/site";

const COPY = {
  es: {
    heroKicker: "Reserva directa · Playa y montaña",
    heroTitle: "Dos casas frente al mar y a la nieve.",
    heroSub: "El Mediterráneo al sur de Valencia y la sierra de Javalambre, en reserva directa.",
    discover: (n: string) => `Descubrir ${n}`,
    bookHeading: "Reserva tu escapada",
    bookSub: "Consulta disponibilidad y precio total en los dos alojamientos.",
    twoDestinations: "Dos destinos, una forma de viajar",
    twoDestinationsSub:
      "Cada casa tiene su calendario, sus precios y su carácter. El motor de reserva y el pago seguro son los mismos.",
    whyDirect: "Por qué reservar directamente",
    faqHeading: "Preguntas frecuentes",
    story: {
      sea: { eyebrow: "Mediterráneo", h: "Días de playa, tardes junto a la Albufera" },
      ski: { eyebrow: "Montaña", h: "Nieve, chimenea y cielo de estrellas" },
    },
  },
  en: {
    heroKicker: "Book direct · Beach and mountains",
    heroTitle: "Two homes — one by the sea, one by the snow.",
    heroSub: "The Mediterranean south of Valencia and the Javalambre range, booked direct.",
    discover: (n: string) => `Discover ${n}`,
    bookHeading: "Book your getaway",
    bookSub: "Check availability and the full price at both properties.",
    twoDestinations: "Two destinations, one way to travel",
    twoDestinationsSub:
      "Each home has its own calendar, prices and character. The booking engine and secure payment are shared.",
    whyDirect: "Why book direct",
    faqHeading: "Frequently asked questions",
    story: {
      sea: { eyebrow: "Mediterranean", h: "Beach days, evenings by the Albufera" },
      ski: { eyebrow: "Mountains", h: "Snow, a stove and a sky full of stars" },
    },
  },
} as const;

export function HomeView({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const c = COPY[locale];
  const ski = getPropertiesByExperience("ski").map((p) => localizedProperty(p, locale))[0]!;
  const sea = getPropertiesByExperience("sea").map((p) => localizedProperty(p, locale))[0]!;
  const properties = [sea, ski];
  const faq = locale === "en" ? homeFaqEn : homeFaq;
  const advantages =
    locale === "en"
      ? directBookingAdvantagesEn
      : directBookingAdvantages.map((a) => ({ title: a.title, body: a.body }));
  const trust = locale === "en" ? trustSignalsEn : trustSignals.map((t) => t.label);
  const path = (n: string) => localizedPath(locale, n);

  const skiHero = heroPhoto("javalambre");
  const seaHero = heroPhoto("valencia");

  return (
    <div lang={locale === "en" ? "en" : undefined}>
      <JsonLd data={faqJsonLd(faq)} />

      {/* 1 · Emotional hero (no booking form) */}
      <section className="relative isolate overflow-hidden bg-[var(--color-ink)] text-white">
        <div className="absolute inset-0 -z-10 grid grid-cols-1 sm:grid-cols-2">
          {seaHero && (
            <Picture
              photo={seaHero}
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              imgClassName="h-full w-full object-cover"
            />
          )}
          {skiHero && (
            <Picture
              photo={skiHero}
              sizes="(max-width: 640px) 100vw, 50vw"
              imgClassName="hidden h-full w-full object-cover sm:block"
            />
          )}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/35 to-black/70" />

        <div className="container-page flex min-h-[70vh] flex-col justify-end py-16 sm:min-h-[78vh] sm:py-20">
          <p className="eyebrow !text-white/75">{c.heroKicker}</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.08] sm:text-5xl md:text-6xl">
            {c.heroTitle}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/90">{c.heroSub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {properties.map((p) => (
              <Link
                key={p.slug}
                href={path(`/${p.slug}`)}
                data-experience={p.experience}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[var(--accent-700)] transition hover:shadow-lg"
              >
                <span aria-hidden>{p.experience === "ski" ? "❄" : "☀"}</span>
                {c.discover(p.name)}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2 · Standalone booking module (issue #36) */}
      <section id="buscador" className="border-b border-[var(--color-line)] bg-white py-14 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{c.bookHeading}</p>
            <p className="mt-2 text-[var(--color-ink-soft)]">{c.bookSub}</p>
          </div>
          <div className="mx-auto mt-6 max-w-3xl">
            <AvailabilitySearch locale={locale} />
          </div>
        </div>
      </section>

      {/* 3 · Two destinations (issue #37 cards) */}
      <section aria-labelledby="alojamientos-heading" className="container-page reveal py-16">
        <p className="eyebrow">{locale === "en" ? "Two homes" : "Dos casas"}</p>
        <h2 id="alojamientos-heading" className="mt-2 font-display text-3xl sm:text-4xl">
          {c.twoDestinations}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">{c.twoDestinationsSub}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {properties.map((p) => (
            <PropertyCard key={p.slug} property={p} locale={locale} />
          ))}
        </div>
      </section>

      {/* Storytelling */}
      {properties.map((p, i) => {
        const shot = propertyPhotos(p.slug)[i === 0 ? 6 : 3] ?? propertyPhotos(p.slug)[1];
        const s = c.story[p.experience];
        return (
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
                {shot && (
                  <Picture
                    photo={shot}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    imgClassName="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="eyebrow">{s.eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl">{s.h}</h2>
                <p className="mt-3 text-[var(--color-ink-soft)]">{p.shortIntro}</p>
                <Link
                  href={path(`/${p.slug}`)}
                  className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--accent-600)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-700)]"
                >
                  {c.discover(p.name)}
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* 4 · Direct-booking advantages */}
      <section aria-labelledby="ventajas-heading" className="bg-white py-20">
        <div className="container-page reveal">
          <p className="eyebrow">{locale === "en" ? "Book direct" : "Reserva directa"}</p>
          <h2 id="ventajas-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            {c.whyDirect}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="rounded-xl border border-[var(--color-line)] p-5">
                <h3 className="font-display text-lg">{a.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.body}</p>
              </div>
            ))}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-ink-soft)]">
            {trust.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span aria-hidden className="text-[var(--accent-600)]">
                  ✓
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 · Social proof handled per-property on their pages; 6 · SEO/FAQ after commercial part */}
      <FaqBlock items={faq} heading={dict.home.faqHeading} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 p-3 backdrop-blur sm:hidden">
        <a
          href="#buscador"
          className="flex h-12 items-center justify-center rounded-full bg-[var(--accent-600)] font-medium text-white"
        >
          {dict.nav.seeAvailability}
        </a>
      </div>
    </div>
  );
}
