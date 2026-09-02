import Link from "next/link";
import { resolvePropertiesForHome } from "@/domains/properties/content";
import { AvailabilitySearch } from "@/components/search/AvailabilitySearch";
import { ExperienceSelector } from "@/components/home/ExperienceSelector";
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
import { DirectBookingCompare, DirectBookingSaving } from "@/components/booking/DirectBooking";

const COPY = {
  es: {
    heroKicker: "Reserva directa · Del Mediterráneo a la nieve",
    heroTitle: "Del Mediterráneo a la nieve, desde Valencia.",
    heroSub:
      "Dos apartamentos para vivir Valencia todo el año: uno a pie de la playa de la Llastra, al sur de la ciudad; otro en Camarena de la Sierra, a diez minutos de las pistas de Javalambre. Verano mediterráneo, escapadas de nieve en invierno y una gran ciudad en medio. En reserva directa y con precio total desde el principio.",
    heroCta: "Comprobar fechas",
    heroCta2: "Ver apartamentos",
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
    heroCta: "Check dates",
    heroCta2: "See the apartments",
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

/** The blog strip is optional social proof — a database hiccup must not 5xx the home page. */
async function safeRecentPosts() {
  try {
    return await listPublicPosts();
  } catch (err) {
    console.error("[home] recent posts read failed; hiding the blog strip", err);
    return [];
  }
}

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
  const recentPosts = locale === "es" ? (await safeRecentPosts()).slice(0, 3) : [];

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
          <h1 className="mt-4 max-w-2xl display-1 text-white">{c.heroTitle}</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
            {c.heroSub}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#buscador" className="pv-btn pv-btn--ondark pv-btn--lg">
              {c.heroCta}
              <span aria-hidden>→</span>
            </a>
            <a href="#alojamientos" className="pv-btn pv-btn--ondark-ghost pv-btn--lg">
              {c.heroCta2}
            </a>
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
      <section id="buscador" className="scroll-mt-20 border-b border-[var(--color-line)] bg-white section-y-tight">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{c.bookHeading}</p>
            <p className="lede mt-2">{c.bookSub}</p>
          </div>
          <div className="mx-auto mt-7 max-w-3xl">
            <AvailabilitySearch locale={locale} />
          </div>
          <div className="mx-auto mt-4 max-w-3xl text-center">
            <DirectBookingSaving locale={locale} />
          </div>
        </div>
      </section>

      {/* 4 · Choose your getaway — MAR / NIEVE selector (issue #86 §5) */}
      <div id="alojamientos" className="scroll-mt-24">
        <div className="container-page pt-16 sm:pt-20">
          <p className="eyebrow">{locale === "en" ? "Two homes" : "Dos casas"}</p>
          <h2 id="alojamientos-heading" className="mt-2 display-2">
            {dict.home.chooseHeading}
          </h2>
          <p className="lede mt-3 max-w-2xl">{dict.home.chooseSub}</p>
        </div>
        <ExperienceSelector
          locale={locale}
          options={properties.map((p) => {
            // Scene-setting shot for the emotional selector: the beach view for
            // the sea, the snowy village for the mountain.
            const pics = propertyPhotos(p.slug);
            const want = p.experience === "sea" ? "vista-mar" : "invierno";
            return {
              slug: p.slug,
              experience: p.experience,
              name: p.name,
              area: p.location.area,
              region: p.location.region,
              intro: p.shortIntro,
              photo: pics.find((ph) => ph.base === want) ?? heroPhoto(p.slug),
              rating: p.rating ?? null,
              headline: p.headlineDistance,
            };
          })}
        />
      </div>

      {/* 5 · Per-destination story + real, property-specific advantages */}
      {properties.map((p, i) => {
        // A photo that matches the story: the sea/environment for Valencia,
        // the snowy village for Javalambre — falling back to a hero-ish shot.
        const pics = propertyPhotos(p.slug);
        const storyBase = p.experience === "sea" ? "atardecer-playa" : "invierno";
        const shot = pics.find((ph) => ph.base === storyBase) ?? pics[1] ?? pics[0];
        const s = c.story[p.experience];
        return (
          <section
            key={p.slug}
            data-experience={p.experience}
            className="reveal border-t border-[var(--color-line)] bg-[var(--accent-50)]"
          >
            <div
              className={`container-page grid grid-cols-1 items-start gap-8 section-y-tight md:grid-cols-2 md:gap-12 ${
                i % 2 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] md:sticky md:top-24">
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
                <h2 className="mt-2 display-3">{s.h}</h2>
                <p className="lede mt-3">{p.shortIntro}</p>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
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
                    className="pv-btn pv-btn--primary h-auto min-h-11 max-w-full whitespace-normal py-2 text-center"
                  >
                    {c.discover(p.name)}
                  </Link>
                  {locale === "es" && (
                    <Link
                      href={`/guias/${hubFor(p.slug)}`}
                      className="pv-btn pv-btn--secondary h-auto min-h-11 max-w-full whitespace-normal py-2 text-center"
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
        <section className="reveal border-t border-[var(--color-line)] bg-white section-y-tight">
          <div className="container-page">
            <p className="eyebrow">{locale === "en" ? "Reviews" : "Opiniones"}</p>
            <h2 className="mt-2 display-2">{c.reviewsHeading}</h2>
            <p className="lede mt-3 max-w-2xl">{c.reviewsSub}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {reviewStrip.map(({ property, review }) => (
                <figure
                  key={property.slug}
                  data-experience={property.experience}
                  className="pv-card pv-card--pad flex h-full flex-col"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="pv-badge pv-badge--score">{review.rating.toFixed(1)}</span>
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
                      className="mt-1 block font-medium text-[var(--accent-700)] hover:underline"
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
        <section className="reveal border-t border-[var(--color-line)] bg-[var(--color-mist)] section-y-tight">
          <div className="container-page">
            <p className="eyebrow">{c.guidesHeading}</p>
            <h2 className="mt-2 display-2">{c.guidesSub}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {guideHubs.map((h) => (
                <Link
                  key={h.slug}
                  href={`/guias/${h.slug}`}
                  data-experience={h.propertySlug === "javalambre" ? "ski" : "sea"}
                  className="pv-card pv-card--pad pv-card--interactive group"
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
        <section className="reveal border-t border-[var(--color-line)] bg-white section-y-tight">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Actualidad</p>
                <h2 className="mt-2 display-2">Del blog</h2>
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
                  className="pv-card pv-card--interactive group flex h-full flex-col overflow-hidden !p-0"
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
      <section aria-labelledby="ventajas-heading" className="bg-white section-y">
        <div className="container-page reveal">
          <p className="eyebrow">{c.closingEyebrow}</p>
          <h2 id="ventajas-heading" className="mt-2 display-2">
            {c.closingHeading}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="pv-card pv-card--pad">
                <h3 className="font-display text-lg">{a.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <DirectBookingCompare locale={locale} />
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#buscador" className="pv-btn pv-btn--primary">
              {dict.nav.seeAvailability}
            </a>
            <Link href={path("/contacto")} className="pv-btn pv-btn--secondary">
              {locale === "en" ? "Ask a question" : "Resolver una duda"}
            </Link>
          </div>
        </div>
      </section>

      <FaqBlock items={faq} heading={dict.home.faqHeading} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 p-3 backdrop-blur sm:hidden">
        <a href="#buscador" className="pv-btn pv-btn--primary pv-btn--block">
          {dict.nav.seeAvailability}
        </a>
      </div>
    </div>
  );
}
