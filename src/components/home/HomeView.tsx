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
import {
  PHOTO_KIND_LABEL,
  heroPhoto,
  photoByBase,
  photoCaption,
  type ResponsivePhoto,
} from "@/content/properties/photos";
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
    heroKicker: "Valencia · Mar y montaña · Reserva directa",
    heroTitle: ["Despertar frente al mar.", "Dormir en la montaña."],
    heroSub: "Dos apartamentos con reserva directa: a pie de la playa de la Llastra y junto a las pistas de Javalambre.",
    bookHeading: "Consulta fechas y precio total",
    discover: (n: string) => `Ver ${n}`,
    trust: ["Precio total antes de pagar", "Pago seguro con tarjeta", "Trato directo con los anfitriones"],
    guideCta: "Guía de destino",
    reviewsHeading: "Opiniones verificadas en Booking",
    reviews: "opiniones",
    guidesHeading: "Antes de llegar.",
    closingEyebrow: "Reserva directa",
    closingHeading: "Reservar aquí tiene ventajas concretas",
    seeAllReviews: "Leer todas las opiniones",
    finalHeading: "¿Mar o montaña?",
    finalCta: "Consultar fechas",
    story: {
      sea: {
        num: "01 — Mar",
        h: "La playa empieza al bajar el portal.",
        lede: "Desayuno junto al ventanal, el primer baño descalzo y la Albufera a ocho kilómetros.",
      },
      ski: {
        num: "02 — Montaña",
        h: "Nieve de día. Chimenea de noche.",
        lede: "Un pueblo de piedra en la alta montaña, pistas a unos diez minutos en coche cuando hay temporada y silencio el resto del año.",
      },
    },
    guests: "huéspedes",
  },
  en: {
    heroKicker: "Valencia · Sea and mountains · Book direct",
    heroTitle: ["Wake up to the sea.", "Sleep in the mountains."],
    heroSub: "Two apartments, booked direct: right on la Llastra beach and close to the Javalambre slopes.",
    bookHeading: "Check dates and the full price",
    discover: (n: string) => `View ${n}`,
    trust: ["Full price before you pay", "Secure card payment", "Direct contact with your hosts"],
    guideCta: "Destination guide",
    reviewsHeading: "Verified reviews on Booking",
    reviews: "reviews",
    guidesHeading: "Before you arrive.",
    closingEyebrow: "Book direct",
    closingHeading: "Booking here has concrete advantages",
    seeAllReviews: "Read all reviews",
    finalHeading: "Sea or mountains?",
    finalCta: "Check dates",
    story: {
      sea: {
        num: "01 — Sea",
        h: "The beach starts at the front door.",
        lede: "Breakfast by the big window, a barefoot first swim and the Albufera eight kilometres away.",
      },
      ski: {
        num: "02 — Mountains",
        h: "Snow by day. Fireside by night.",
        lede: "A stone village in the high mountains, slopes about ten minutes away by car in season, and quiet the rest of the year.",
      },
    },
    guests: "guests",
  },
} as const;

/** Photos chosen per destination for each home moment (real files, see photo-manifest.json). */
const HOME_PHOTOS = {
  sea: { panel: "amanecer-llastra", chapter: "salon-vista-mar", inset: "vista-verano", guide: "dunas-llastra" },
  ski: { panel: "estacion-javalambre", chapter: "salon-chimenea", inset: "pistas-familia", guide: "pistas-esqui" },
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

  const lang = locale === "en" ? "en" : "es";
  const pick = (slug: string, base: string) => photoByBase(slug, base) ?? heroPhoto(slug);
  const recentPosts = locale === "es" ? (await safeRecentPosts()).slice(0, 3) : [];

  // A short, real review from each property for the social-proof strip.
  const reviewStrip: { property: PropertyContent; review: Review }[] = [];
  for (const p of properties) {
    const r = [...p.reviews].sort((a, b) => b.rating - a.rating || a.text.length - b.text.length)[0];
    if (r) reviewStrip.push({ property: p, review: r });
  }

  return (
    <div lang={locale === "en" ? "en" : undefined}>
      <JsonLd data={faqJsonLd(faq)} />

      {/* 1 · Diptych opening — two real landscapes as equals (#101, proposal A) */}
      <section aria-labelledby="home-title" className="relative bg-[var(--color-ink)] text-white">
        {/* Quiet shade behind the centred title so it stays legible over both photos */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 hidden bg-[radial-gradient(56%_30%_at_50%_27%,rgb(14_20_19/0.42),transparent_72%)] md:block"
        />
        <div className="px-5 pb-8 pt-8 md:pointer-events-none md:absolute md:inset-x-0 md:top-[11%] md:z-20 md:p-0 md:text-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/80 md:[text-shadow:0_1px_14px_rgb(0_0_0/0.45)]">
            {c.heroKicker}
          </p>
          <h1
            id="home-title"
            className="mt-4 display-1 !text-white md:[text-shadow:0_2px_36px_rgb(0_0_0/0.3)]"
          >
            {c.heroTitle[0]}
            <br />
            {c.heroTitle[1]}
          </h1>
          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-white/90 md:mx-auto md:mt-6 md:max-w-xl md:text-lg md:[text-shadow:0_1px_14px_rgb(0_0_0/0.5)]">
            {c.heroSub}
          </p>
        </div>
        <div className="md:h-[calc(100svh-4rem)] md:max-h-[980px] md:min-h-[640px]">
          <ExperienceSelector
            locale={locale}
            options={properties.map((p) => ({
              slug: p.slug,
              experience: p.experience,
              name: p.name,
              area: p.location.area,
              photo: pick(p.slug, HOME_PHOTOS[p.experience].panel),
            }))}
          />
        </div>
      </section>

      {/* 2 · Availability, docked on the hero edge — real dates, real total price (#86/#89) */}
      <section
        id="buscador"
        aria-labelledby="buscador-heading"
        className="relative z-10 scroll-mt-20 bg-[var(--color-paper)] pb-12 pt-8 md:pt-0"
      >
        <div className="container-page">
          <div className="border border-[var(--color-line)] bg-white p-5 sm:p-7 md:-mt-16">
            <h2 id="buscador-heading" className="eyebrow !text-[var(--color-ink-soft)]">
              {c.bookHeading}
            </h2>
            <div className="mt-4">
              <AvailabilitySearch locale={locale} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-[0.8rem] text-[var(--color-ink-soft)]">
            {c.trust.map((t) => (
              <span key={t} className="before:mr-2 before:text-[var(--color-ink-faint)] before:content-['—']">
                {t}
              </span>
            ))}
            <DirectBookingSaving locale={locale} />
          </div>
        </div>
      </section>

      {/* 3 · Two chapters: the apartment and its view, then the mountain refuge */}
      <div id="alojamientos" className="scroll-mt-24">
        {properties.map((p, i) => {
          const s = c.story[p.experience];
          const shots = HOME_PHOTOS[p.experience];
          const main = pick(p.slug, shots.chapter);
          const inset = pick(p.slug, shots.inset);
          const flip = i % 2 === 1;
          return (
            <section
              key={p.slug}
              data-experience={p.experience}
              aria-labelledby={`chapter-${p.slug}`}
              className="bg-[var(--accent-50)] py-[clamp(4.5rem,3rem+6vw,10rem)]"
            >
              <div className="container-page grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
                <div className={`md:col-span-7 ${flip ? "md:order-2 md:col-start-6" : ""}`}>
                  {main && <Figure photo={main} lang={lang} ratio="aspect-[4/3]" sizes="(max-width: 768px) 100vw, 58vw" />}
                </div>
                <div
                  className={`reveal flex flex-col justify-end md:col-span-4 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-9"}`}
                >
                  <p className="eyebrow">{s.num}</p>
                  <h2 id={`chapter-${p.slug}`} className="mt-4 display-3">
                    {s.h}
                  </h2>
                  <p className="lede mt-4">{s.lede}</p>
                  <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-[var(--color-line)] pt-5">
                    <Stat
                      value={p.headlineDistance.value.split(" ").slice(0, 2).join(" ")}
                      label={
                        p.experience === "ski"
                          ? `${p.headlineDistance.label}, ${p.headlineDistance.value.split(" ").slice(2).join(" ")}`
                          : p.headlineDistance.label
                      }
                    />
                    <Stat value={String(p.capacity.guests)} label={c.guests} />
                    {p.rating && (
                      <Stat
                        value={p.rating.value.toLocaleString(locale === "en" ? "en" : "es", { minimumFractionDigits: 1 })}
                        label={`${p.rating.count} ${c.reviews}`}
                      />
                    )}
                  </dl>
                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                    <Link href={path(`/${p.slug}`)} className="pv-btn pv-btn--primary h-auto min-h-12 whitespace-normal py-3">
                      {c.discover(p.name)} <span aria-hidden>→</span>
                    </Link>
                    {locale === "es" && (
                      <Link
                        href={`/guias/${hubFor(p.slug)}`}
                        className="border-b border-current pb-0.5 text-sm font-semibold"
                      >
                        {c.guideCta}
                      </Link>
                    )}
                  </div>
                  {inset && (
                    <div className="mt-10 hidden w-2/3 md:block">
                      <Figure photo={inset} lang={lang} ratio="aspect-[4/5]" sizes="20vw" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* 4 · Proof — verified scores and one real line from each home (#90) */}
      {reviewStrip.length > 0 && (
        <section aria-labelledby="reviews-heading" className="bg-white py-[clamp(4.5rem,3rem+5vw,9rem)]">
          <div className="container-page">
            <h2 id="reviews-heading" className="eyebrow !text-[var(--color-ink-soft)]">
              {c.reviewsHeading}
            </h2>
            <div className="mt-10 grid gap-14 md:grid-cols-2 md:gap-8">
              {reviewStrip.map(({ property, review }) => (
                <figure key={property.slug} data-experience={property.experience} className="reveal">
                  {property.rating && (
                    <p className="text-[clamp(4rem,2.5rem+5vw,7rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
                      {property.rating.value.toLocaleString(locale === "en" ? "en" : "es", { minimumFractionDigits: 1 })}
                      <span className="sr-only"> / 10</span>
                    </p>
                  )}
                  <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                    {property.name}
                    {property.rating && ` · ${property.rating.count} ${c.reviews}`}
                  </p>
                  <blockquote className="mt-7 max-w-xl text-[clamp(1.2rem,1rem+0.8vw,1.6rem)] font-medium leading-snug tracking-[-0.012em]">
                    “{review.text}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm text-[var(--color-ink-soft)]">
                    {review.author} · {review.source === "booking" ? "Booking" : review.source}
                    <Link
                      href={path(`/${property.slug}#opiniones`)}
                      className="ml-4 border-b border-current pb-0.5 font-semibold text-[var(--color-ink)]"
                    >
                      {c.seeAllReviews}
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5 · Destination guides — photography and headlines, not a card wall */}
      {locale === "es" && (
        <section aria-labelledby="guides-heading" className="py-[clamp(4.5rem,3rem+5vw,9rem)]">
          <div className="container-page">
            <h2 id="guides-heading" className="display-2">
              {c.guidesHeading}
            </h2>
            <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-8">
              {guideHubs.map((h) => {
                const exp = h.propertySlug === "javalambre" ? "ski" : "sea";
                const photo = pick(h.propertySlug, HOME_PHOTOS[exp].guide);
                return (
                  <Link key={h.slug} href={`/guias/${h.slug}`} data-experience={exp} className="pv-zoom group block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-mist)]">
                      {photo && <Picture photo={photo} sizes="(max-width: 768px) 100vw, 45vw" imgClassName="h-full w-full object-cover" />}
                    </div>
                    <p className="eyebrow mt-5">{h.eyebrow}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4">
                      {h.title}
                    </p>
                    <p className="mt-2 max-w-lg text-sm text-[var(--color-ink-soft)]">{h.lead}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5b · Actualidad — latest blog posts (issue #57) */}
      {recentPosts.length > 0 && (
        <section aria-labelledby="blog-heading" className="border-t border-[var(--color-line)] py-[clamp(4rem,3rem+3vw,6rem)]">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="blog-heading" className="display-3">
                Del blog
              </h2>
              <Link href="/blog" className="border-b border-current pb-0.5 text-sm font-semibold">
                Ver todo el blog
              </Link>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {recentPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="pv-zoom group flex h-full flex-col">
                  {post.featuredImageUrl && (
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.featuredImageUrl}
                        alt={post.featuredImageAlt || post.title}
                        loading="lazy"
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </div>
                  )}
                  <p className="mt-4 text-lg font-semibold leading-snug tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">
                    {post.title}
                  </p>
                  <p className="mt-2 flex-1 text-sm text-[var(--color-ink-soft)]">{autoExcerpt(post, 120)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6 · Why book direct — concrete, beside the final CTA */}
      <section aria-labelledby="ventajas-heading" className="border-t border-[var(--color-line)] bg-white py-[clamp(4rem,3rem+3vw,7rem)]">
        <div className="container-page">
          <p className="eyebrow">{c.closingEyebrow}</p>
          <h2 id="ventajas-heading" className="mt-3 display-3 max-w-2xl">
            {c.closingHeading}
          </h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 border-t border-[var(--color-ink)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title}>
                <h3 className="text-base font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <DirectBookingCompare locale={locale} />
          </div>
        </div>
      </section>

      {/* 7 · Final call — one action */}
      <section className="bg-[var(--color-ink)] py-[clamp(4.5rem,3rem+5vw,9rem)] text-white">
        <div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="display-2 !text-white">{c.finalHeading}</h2>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#buscador" className="pv-btn pv-btn--ondark pv-btn--lg">
              {c.finalCta} <span aria-hidden>→</span>
            </a>
            <Link href="/contacto" className="border-b border-white/70 pb-0.5 text-sm font-semibold">
              {locale === "en" ? "Ask a question" : "Resolver una duda"}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ stays last before the footer (spacing contract in e2e/home-faq-spacing) */}
      <FaqBlock items={faq} heading={dict.home.faqHeading} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 p-3 backdrop-blur-sm sm:hidden">
        <a href="#buscador" className="pv-btn pv-btn--ink pv-btn--block">
          {c.finalCta}
        </a>
      </div>
    </div>
  );
}

/** Photograph with its truthful caption (Vista real / Alojamiento / Entorno). */
function Figure({
  photo,
  lang,
  ratio,
  sizes,
}: {
  photo: ResponsivePhoto;
  lang: "es" | "en";
  ratio: string;
  sizes: string;
}) {
  return (
    <figure>
      <div className={`relative overflow-hidden bg-[var(--color-mist)] ${ratio}`}>
        <Picture photo={photo} sizes={sizes} imgClassName="h-full w-full object-cover" />
      </div>
      {photo.kind && (
        <figcaption className="photo-caption mt-3">
          <span className="photo-tag">{PHOTO_KIND_LABEL[lang][photo.kind]}</span>
          {photoCaption(photo, lang)}
        </figcaption>
      )}
    </figure>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1.5 text-xs leading-snug text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="text-[1.35rem] font-semibold leading-none tracking-[-0.02em]">{value}</dd>
    </div>
  );
}
