import Image from "next/image";
import Link from "next/link";
import { getAllProperties, getPropertiesByExperience, localizedProperty } from "@/domains/properties/registry";
import { AvailabilitySearch } from "@/components/search/AvailabilitySearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath, type Locale } from "@/i18n/config";
import {
  directBookingAdvantages,
  directBookingAdvantagesEn,
  homeFaq,
  homeFaqEn,
  trustSignals,
  trustSignalsEn,
} from "@/content/site";

const STORY = {
  es: {
    sea: { eyebrow: "Mediterráneo", h: "Días de playa, tardes de ciudad" },
    ski: { eyebrow: "Montaña", h: "Nieve, silencio y montaña" },
    discover: (n: string) => `Descubrir ${n}`,
  },
  en: {
    sea: { eyebrow: "Mediterranean", h: "Beach days, city evenings" },
    ski: { eyebrow: "Mountain", h: "Snow, quiet and mountains" },
    discover: (n: string) => `Discover ${n}`,
  },
} as const;

export function HomeView({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const properties = getAllProperties().map((p) => localizedProperty(p, locale));
  const [ski] = getPropertiesByExperience("ski").map((p) => localizedProperty(p, locale));
  const [sea] = getPropertiesByExperience("sea").map((p) => localizedProperty(p, locale));
  const faq = locale === "en" ? homeFaqEn : homeFaq;
  const advantages =
    locale === "en"
      ? directBookingAdvantagesEn
      : directBookingAdvantages.map((a) => ({ title: a.title, body: a.body }));
  const trust = locale === "en" ? trustSignalsEn : trustSignals.map((t) => t.label);
  const story = STORY[locale];
  const path = (n: string) => localizedPath(locale, n);

  return (
    <div lang={locale === "en" ? "en" : undefined}>
      <JsonLd data={faqJsonLd(faq)} />

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
          <p className="eyebrow !text-white/75">{dict.home.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-[4rem]">
            {dict.home.h1}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90">{dict.home.sub}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            {properties.map((p) => (
              <Link
                key={p.slug}
                href={path(`/${p.slug}`)}
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

      <section id="buscador" className="container-page -mt-12 pb-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="sr-only">{dict.home.searchHeading}</h2>
          <AvailabilitySearch locale={locale} />
        </div>
      </section>

      <section aria-labelledby="alojamientos-heading" className="container-page reveal py-16">
        <p className="eyebrow">{locale === "en" ? "Two destinations" : "Dos destinos"}</p>
        <h2 id="alojamientos-heading" className="mt-2 font-display text-3xl sm:text-4xl">
          {dict.home.chooseHeading}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">{dict.home.chooseSub}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {properties.map((p) => (
            <PropertyCard key={p.slug} property={p} locale={locale} />
          ))}
        </div>
      </section>

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
                <p className="eyebrow">{story[p.experience].eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl">{story[p.experience].h}</h2>
                <p className="mt-3 text-[var(--color-ink-soft)]">{p.shortIntro}</p>
                <Link
                  href={path(`/${p.slug}`)}
                  className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--accent-600)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-700)]"
                >
                  {story.discover(p.name)}
                </Link>
              </div>
            </div>
          </section>
        ) : null,
      )}

      <section aria-labelledby="ventajas-heading" className="bg-white py-20">
        <div className="container-page reveal">
          <p className="eyebrow">{locale === "en" ? "Book direct" : "Reserva directa"}</p>
          <h2 id="ventajas-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            {dict.home.whyDirect}
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
