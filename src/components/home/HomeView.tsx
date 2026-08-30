import Link from "next/link";
import { resolvePropertiesForHome } from "@/domains/properties/content";
import { AvailabilitySearch } from "@/components/search/AvailabilitySearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { Picture } from "@/components/media/Picture";
import { faqJsonLd } from "@/lib/seo";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath, type Locale } from "@/i18n/config";
import type { PropertyContent, Review } from "@/domains/properties/types";
import { heroPhoto, propertyPhotos } from "@/content/properties/photos";
import { guideHubs } from "@/content/guides/hubs";
import { listPublicPosts } from "@/domains/blog/store";
import { autoExcerpt } from "@/domains/blog/helpers";
import {
  directBookingAdvantages,
  directBookingAdvantagesEn,
  homeFaq,
  homeFaqEn,
} from "@/content/site";

const COPY = {
  es: {
    heroKicker: "Reserva directa · Del Mediterráneo a la nieve",
    heroTitle: "Del Mediterráneo a la nieve, desde Valencia.",
    heroSub:
      "Dos apartamentos para vivir Valencia todo el año: uno a pie de la playa de la Llastra, al sur de la ciudad; otro en Camarena de la Sierra, a diez minutos de las pistas de Javalambre. Verano mediterráneo, escapadas de nieve en invierno y una gran ciudad en medio. En reserva directa y con precio total desde el principio.",
    discover: (n: string) => `Descubrir ${n}`,
    trust: [
      "Dos destinos, un mismo eje: Valencia todo el año",
      "Reserva directa, sin comisiones de intermediarios",
      "Pago seguro con tarjeta y confirmación inmediata",
    ],
    bookHeading: "Reserva tu escapada",
    bookSub: "Consulta disponibilidad y precio total en los dos alojamientos.",
    bestOf: (n: string) => `Lo mejor de ${n}`,
    guideCta: "Guía de destino",
    reviewsHeading: "Lo que dicen quienes ya han estado",
    reviewsSub: "Opiniones reales de huéspedes verificados en Booking, con su procedencia.",
    guidesHeading: "Prepara tu escapada",
    guidesSub: "Guías prácticas de cada destino: cómo llegar, qué hacer y qué tienes cerca.",
    closingEyebrow: "Reserva directa",
    closingHeading: "Reservar aquí tiene ventajas concretas",
    seeAllReviews: "Ver todas las opiniones",
    story: {
      sea: { eyebrow: "Mediterráneo", h: "Días de playa en la Llastra, tardes junto a la Albufera" },
      ski: { eyebrow: "Sierra", h: "Nieve a diez minutos, chimenea y cielo de estrellas" },
    },
  },
  en: {
    heroKicker: "Book direct · From the Mediterranean to the snow",
    heroTitle: "From the Mediterranean to the snow, out of Valencia.",
    heroSub:
      "Two apartments for a year-round Valencia: one right on la Llastra beach, south of the city; the other in Camarena de la Sierra, ten minutes from the Javalambre slopes. Mediterranean summers, winter snow escapes and a great city in between. Booked direct, with the full price up front.",
    discover: (n: string) => `Discover ${n}`,
    trust: [
      "Two destinations on one axis: Valencia, all year",
      "Book direct, no middleman fees",
      "Secure card payment and instant confirmation",
    ],
    bookHeading: "Book your getaway",
    bookSub: "Check availability and the full price at both properties.",
    bestOf: (n: string) => `The best of ${n}`,
    guideCta: "Destination guide",
    reviewsHeading: "What past guests say",
    reviewsSub: "Real reviews from guests verified on Booking, with their source.",
    guidesHeading: "Plan your trip",
    guidesSub: "Practical guides to each destination: how to get there, what to do and what is nearby.",
    closingEyebrow: "Book direct",
    closingHeading: "Booking here has concrete advantages",
    seeAllReviews: "See all reviews",
    story: {
      sea: { eyebrow: "Mediterranean", h: "Beach days on la Llastra, evenings by the Albufera" },
      ski: { eyebrow: "Mountains", h: "Snow ten minutes away, a stove and a sky full of stars" },
    },
  },
} as const;

export async function HomeView({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const c = COPY[locale];
  const properties = await resolvePropertiesForHome(locale === "en" ? "en" : "es");
  const faq = locale === "en" ? homeFaqEn : homeFaq;
  const advantages =
    locale === "en"
      ? directBookingAdvantagesEn
      : directBookingAdvantages.map((a) => ({ title: a.title, body: a.body }));
  const path = (n: string) => localizedPath(locale, n);
  const hubFor = (slug: string) => (slug === "valencia" ? "valencia-playa" : "javalambre");

  const skiHero = heroPhoto("javalambre");
  const seaHero = heroPhoto("valencia");
  const recentPosts = locale === "es" ? (await listPublicPosts()).slice(0, 3) : [];

  // A short, real review from each property for the social-proof strip.
  const reviewStrip: { property: PropertyContent; review: Review }[] = [];
  for (const p of properties) {
    const r = [...p.reviews].sort((a, b) => b.rating - a.rating)[0];
    if (r) reviewStrip.push({ property: p, review: r });
  }

  return (
    <div lang={locale === "en" ? "en" : undefined}>
      <JsonLd data={faqJsonLd(faq)} />

      {/* 1 · Cinematic hero — two real destinations, double CTA */}
      <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        <div className="absolute inset-0 grid grid-cols-1 grid-rows-1 sm:grid-cols-2">
          {seaHero && (
            <div className="relative">
              <Picture photo={seaHero} priority sizes="(max-width: 640px) 100vw, 50vw" />
            </div>
          )}
          {skiHero && (
            <div className="relative hidden sm:block">
              <Picture photo={skiHero} sizes="50vw" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />

        <div className="container-page relative flex min-h-[68vh] flex-col justify-end py-14 sm:min-h-[80vh] sm:py-24">
          <p className="eyebrow !text-white/75">{c.heroKicker}</p>
          <h1 className="mt-4 max-w-2xl font-display text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl">
            {c.heroTitle}
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/90 sm:text-lg">{c.heroSub}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {properties.map((p) => (
              <Link
                key={p.slug}
                href={path(`/${p.slug}`)}
                data-experience={p.experience}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[var(--accent-700)] transition hover:shadow-lg"
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

      {/* 2 · Trust microblock */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-ink)] text-white/85">
        <ul className="container-page flex flex-col gap-2 py-4 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8">
          {c.trust.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden className="text-[var(--accent-400,#7fb2ff)]">
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · Availability module, clearly separated */}
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

      {/* 4 · Choose your getaway — editorial cards */}
      <section aria-labelledby="alojamientos-heading" className="container-page reveal py-16">
        <p className="eyebrow">{locale === "en" ? "Two homes" : "Dos casas"}</p>
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

      {/* 5 · Per-destination story + real, property-specific advantages */}
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
              className={`container-page grid items-start gap-8 py-16 md:grid-cols-2 ${
                i % 2 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] md:sticky md:top-24">
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

                <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  {c.bestOf(p.name)}
                </p>
                <ul className="mt-3 space-y-3">
                  {p.highlights.slice(0, 4).map((h) => (
                    <li key={h.title} className="flex gap-3">
                      <span aria-hidden className="mt-1 text-[var(--accent-600)]">
                        ◆
                      </span>
                      <span>
                        <span className="font-medium">{h.title}.</span>{" "}
                        <span className="text-[var(--color-ink-soft)]">{h.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href={path(`/${p.slug}`)}
                    className="inline-flex h-12 items-center rounded-full bg-[var(--accent-600)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-700)]"
                  >
                    {c.discover(p.name)}
                  </Link>
                  {locale === "es" && (
                    <Link
                      href={`/guias/${hubFor(p.slug)}`}
                      className="inline-flex h-12 items-center rounded-full px-5 text-sm font-medium ring-1 ring-[var(--color-line)] hover:ring-[var(--accent-500)]"
                    >
                      {c.guideCta} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* 6 · Real reviews */}
      {reviewStrip.length > 0 && (
        <section className="reveal border-t border-[var(--color-line)] bg-white py-16">
          <div className="container-page">
            <p className="eyebrow">{locale === "en" ? "Reviews" : "Opiniones"}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">{c.reviewsHeading}</h2>
            <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">{c.reviewsSub}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {reviewStrip.map(({ property, review }) => (
                <figure
                  key={property.slug}
                  data-experience={property.experience}
                  className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-line)] p-6"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-[var(--accent-50)] px-2 py-0.5 font-semibold text-[var(--accent-700)]">
                      {(review.rating).toFixed(0)}/10
                    </span>
                    {property.rating && (
                      <span className="text-[var(--color-ink-soft)]">
                        {property.rating.value.toFixed(1)} · {property.rating.count}{" "}
                        {locale === "en" ? "reviews" : "opiniones"}
                      </span>
                    )}
                  </div>
                  <blockquote className="mt-3 grow text-[var(--color-ink-soft)]">
                    “{review.text}”
                  </blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-medium">{review.author}</span>
                    <span className="text-[var(--color-ink-soft)]">
                      {" "}
                      · {property.name} ·{" "}
                      {review.source === "booking" ? "Booking" : review.source}
                    </span>
                    <Link
                      href={path(`/${property.slug}#opiniones`)}
                      className="mt-1 block text-[var(--accent-700)] hover:underline"
                    >
                      {c.seeAllReviews} →
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7 · Featured guides */}
      {locale === "es" && (
        <section className="reveal border-t border-[var(--color-line)] bg-[var(--color-mist,#f4f6f8)] py-16">
          <div className="container-page">
            <p className="eyebrow">{c.guidesHeading}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">{c.guidesSub}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {guideHubs.map((h) => (
                <Link
                  key={h.slug}
                  href={`/guias/${h.slug}`}
                  data-experience={h.propertySlug === "javalambre" ? "ski" : "sea"}
                  className="group rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 transition hover:border-[var(--accent-500)]"
                >
                  <p className="eyebrow">{h.eyebrow}</p>
                  <p className="mt-1 font-display text-xl">{h.title}</p>
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{h.lead}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-[var(--accent-700)]">
                    Abrir la guía →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7b · Actualidad — latest blog posts (issue #57) */}
      {recentPosts.length > 0 && (
        <section className="reveal border-t border-[var(--color-line)] bg-white py-16">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Actualidad</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl">Del blog</h2>
              </div>
              <Link href="/blog" className="text-sm font-medium text-[var(--accent-700)] hover:underline">
                Ver todo el blog →
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] transition hover:border-[var(--accent-500)]"
                >
                  {post.featuredImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.featuredImageUrl}
                      alt={post.featuredImageAlt || post.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-display text-lg group-hover:text-[var(--accent-700)]">
                      {post.title}
                    </p>
                    <p className="mt-2 flex-1 text-sm text-[var(--color-ink-soft)]">
                      {autoExcerpt(post, 120)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8 · Closing argument for direct booking + final CTA */}
      <section aria-labelledby="ventajas-heading" className="bg-white py-20">
        <div className="container-page reveal">
          <p className="eyebrow">{c.closingEyebrow}</p>
          <h2 id="ventajas-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            {c.closingHeading}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="rounded-xl border border-[var(--color-line)] p-5">
                <h3 className="font-display text-lg">{a.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#buscador"
              className="inline-flex h-12 items-center rounded-full bg-[var(--accent-600)] px-6 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
            >
              {dict.nav.seeAvailability}
            </a>
            <Link
              href={path("/contacto")}
              className="inline-flex h-12 items-center rounded-full px-5 text-sm font-medium ring-1 ring-[var(--color-line)] hover:ring-[var(--accent-500)]"
            >
              {locale === "en" ? "Ask a question" : "Resolver una duda"}
            </Link>
          </div>
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
