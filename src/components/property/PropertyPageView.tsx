import Link from "next/link";
import { instagramUrl } from "@/lib/social";
import { resolveProperty } from "@/domains/properties/content";
import { propertyJsonLd, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Gallery } from "@/components/property/Gallery";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { bookingSectionId, bookingSectionHref } from "@/domains/booking/anchor";
import { AvailabilityNote } from "@/components/booking/AvailabilityNote";
import { PreferProperty } from "@/components/booking/PreferProperty";
import { DirectBookingCompare } from "@/components/booking/DirectBooking";
import { ReviewsBlock } from "@/components/ReviewsBlock";
import { FaqBlock } from "@/components/FaqBlock";
import { landingLinksFor, guideLinksFor } from "@/domains/marketing/navigation";
import { getRateConfig } from "@/content/rates";
import {
  PHOTO_KIND_LABEL,
  photoByBase,
  photoCaption,
  propertyPhotos,
  type ResponsivePhoto,
} from "@/content/properties/photos";
import { Picture } from "@/components/media/Picture";
import { localizedPath, type Locale } from "@/i18n/config";

const T = {
  es: {
    home: "Inicio",
    theProperty: "El alojamiento",
    guests: "Huéspedes",
    bedrooms: "Dormitorios",
    beds: "Camas",
    bathrooms: "Baños",
    size: "Superficie",
    amenities: "Equipamiento",
    location: "Ubicación y cómo llegar",
    gettingThere: "Cómo llegar",
    nearby: "Qué tienes cerca",
    stayInfo: "Información de la estancia",
    checkIn: "Entrada",
    checkOut: "Salida",
    deposit: "Fianza",
    rules: "Normas",
    license: "Número de licencia",
    cancellation: "Política de cancelación",
    more: "Sigue descubriendo",
    faqHeading: (n: string) => `Preguntas frecuentes sobre ${n}`,
    stickyCta: "Consultar fechas y reservar",
    ratingOn: (n: number) => `${n} opiniones en Booking`,
    bestOf: "Lo mejor de este alojamiento",
    nearbyGuides: "Qué hacer cerca",
    distances: "Distancias",
    closingHeading: (n: string) => `¿Reservamos tu estancia en ${n}?`,
    closingBody: "Consulta disponibilidad y precio total, sin comisiones y con confirmación inmediata.",
    closingCta: "Ver fechas y precio",
    closingContact: "Tengo una duda",
    galleryHeading: "La casa, tal como es.",
    upTo: "huéspedes",
    bedroomsShort: "dormitorios",
    sizeShort: "superficie",
  },
  en: {
    home: "Home",
    theProperty: "The property",
    guests: "Guests",
    bedrooms: "Bedrooms",
    beds: "Beds",
    bathrooms: "Bathrooms",
    size: "Size",
    amenities: "Amenities",
    location: "Location & how to get there",
    gettingThere: "How to get here",
    nearby: "What's nearby",
    stayInfo: "Stay information",
    checkIn: "Check-in",
    checkOut: "Check-out",
    deposit: "Deposit",
    rules: "House rules",
    license: "Licence number",
    cancellation: "Cancellation policy",
    more: "Keep exploring",
    faqHeading: (n: string) => `Frequently asked questions about ${n}`,
    stickyCta: "Check dates & book",
    ratingOn: (n: number) => `${n} reviews on Booking`,
    bestOf: "The best of this apartment",
    nearbyGuides: "What to do nearby",
    distances: "Distances",
    closingHeading: (n: string) => `Shall we book your stay at ${n}?`,
    closingBody: "Check availability and the full price — no fees, instant confirmation.",
    closingCta: "See dates & price",
    closingContact: "I have a question",
    galleryHeading: "The apartment, as it is.",
    upTo: "guests",
    bedroomsShort: "bedrooms",
    sizeShort: "floor area",
  },
} as const;

/** Short text labels for the distances table — no emoji (#99). */
const NEARBY_LABEL: Record<"es" | "en", Record<string, string>> = {
  es: { beach: "Playa", ski: "Nieve", transport: "Transporte", food: "Comer", nature: "Naturaleza", landmark: "Visitar", airport: "Aeropuerto" },
  en: { beach: "Beach", ski: "Snow", transport: "Transport", food: "Food", nature: "Nature", landmark: "Sights", airport: "Airport" },
};

/**
 * Art direction per property (#87/#88/#100): the opening is the idyllic real
 * view or destination, a portrait frame for phones where one exists, and a
 * short story sequence before the apartment itself.
 */
const STORY: Record<string, { mobile?: string; heroAlt?: { es: string; en: string }; heading: { es: string; en: string }; lede: { es: string; en: string } }> = {
  valencia: {
    mobile: "vista-verano",
    heroAlt: {
      es: "El mar Mediterráneo y la playa de la Llastra vistos desde el apartamento",
      en: "The Mediterranean and la Llastra beach seen from the apartment",
    },
    heading: { es: "Despertarse frente al Mediterráneo.", en: "Waking up facing the Mediterranean." },
    lede: {
      es: "Las vistas son reales: el mar cambia cada mañana al otro lado del ventanal.",
      en: "The views are real: the sea changes every morning beyond the window.",
    },
  },
  javalambre: {
    heading: { es: "Tu base para esquiar en Javalambre.", en: "Your base for skiing Javalambre." },
    lede: {
      es: "Pistas amplias y suaves a unos diez minutos en coche. La nieve depende de la temporada; el refugio, no.",
      en: "Wide, gentle slopes about ten minutes away by car. Snow depends on the season; the warm apartment doesn't.",
    },
  },
};

export async function PropertyPageView({ slug, locale }: { slug: string; locale: Locale }) {
  const p = await resolveProperty(slug, locale === "en" ? "en" : "es");
  if (!p) return null;
  const t = T[locale];
  const photos = propertyPhotos(slug);
  const lang = locale === "en" ? "en" : "es";
  const art = STORY[slug];
  const hero = photos[0];
  const heroMobile = art?.mobile ? photoByBase(slug, art.mobile) : undefined;
  // Idyllic sequence: the next views / surroundings after the hero, before the apartment.
  const story = photos.slice(1).filter((ph) => ph.kind !== "alojamiento").slice(0, 3);
  const path = (n: string) => localizedPath(locale, n);
  const links =
    locale === "es" ? [...landingLinksFor(slug), ...(await guideLinksFor(slug))] : [];

  const facts: [string, string | number][] = [
    [t.guests, p.capacity.guests],
    [t.bedrooms, p.capacity.bedrooms],
    [t.beds, p.capacity.bedConfig],
    [t.bathrooms, p.capacity.bathrooms],
  ];
  if (p.capacity.sizeSqm) facts.push([t.size, `${p.capacity.sizeSqm} m²`]);

  return (
    <div data-experience={p.experience} lang={locale === "en" ? "en" : undefined}>
      <PreferProperty slug={p.slug} />
      <JsonLd
        data={[
          propertyJsonLd(p, p.rating ? { ratingValue: p.rating.value, reviewCount: p.rating.count } : {}),
          faqJsonLd(p.faq),
        ]}
      />
      {/* Opening — the signature real view or destination, full-bleed (#87/#88) */}
      <section className="pv-scrim on-photo relative flex h-[76svh] min-h-[520px] items-end overflow-hidden bg-[var(--color-ink)] text-white md:h-[calc(92svh-4rem)] md:max-h-[920px]">
        {hero && (
          <Picture
            photo={hero}
            mobilePhoto={heroMobile}
            alt={heroMobile && art?.heroAlt ? art.heroAlt[lang] : undefined}
            priority
            sizes="100vw"
            imgClassName="h-full w-full object-cover"
          />
        )}
        <div className="container-page relative z-10 pb-8 md:pb-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/85">
            {p.location.area} · {p.location.region}
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.1rem,1.2rem+3.6vw,4.75rem)] font-semibold leading-[1] tracking-[-0.032em] !text-white">
            {p.seo.h1}
          </h1>
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <p className="text-sm text-white/90">
              {p.name}
              {p.rating && (
                <>
                  {" · "}
                  {p.rating.value.toLocaleString(lang, { minimumFractionDigits: 1 })} ·{" "}
                  {t.ratingOn(p.rating.count)}
                </>
              )}
            </p>
            {hero?.kind && !heroMobile && (
              <p className="photo-caption">
                <span className="photo-tag">{PHOTO_KIND_LABEL[lang][hero.kind]}</span>
                {photoCaption(hero, lang)}
              </p>
            )}
            {heroMobile && (
              <p className="photo-caption">
                <span className="photo-tag">{PHOTO_KIND_LABEL[lang].vista}</span>
                {lang === "en" ? "From the apartment" : "Desde el apartamento"}
              </p>
            )}
          </div>
        </div>
      </section>

      <Breadcrumbs
        items={[
          { name: t.home, path: path("/") },
          { name: p.name, path: path(`/${p.slug}`) },
        ]}
      />

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="min-w-0 space-y-16">
          {/* Impact figures — the essentials at a glance (#87/#88) */}
          <section aria-label={t.theProperty}>
            <dl className="grid grid-cols-2 border-t border-[var(--color-ink)] sm:grid-cols-4">
              <Fact
                value={p.headlineDistance.value.split(" ").slice(0, 2).join(" ")}
                label={
                  p.experience === "ski"
                    ? `${p.headlineDistance.label}, ${p.headlineDistance.value.split(" ").slice(2).join(" ")}`
                    : p.headlineDistance.label
                }
              />
              <Fact value={String(p.capacity.guests)} label={t.upTo} />
              <Fact value={String(p.capacity.bedrooms)} label={t.bedroomsShort} />
              {p.capacity.sizeSqm && <Fact value={`${p.capacity.sizeSqm} m²`} label={t.sizeShort} />}
            </dl>
            <p className="mt-8 max-w-2xl text-[clamp(1.1rem,1rem+0.45vw,1.4rem)] leading-relaxed">{p.shortIntro}</p>
            <AvailabilityNote propertySlug={p.slug} locale={lang} />
          </section>

          {/* Story — real views and destination first, before the rooms (#100/#103) */}
          {art && story.length > 0 && (
            <section aria-labelledby="story-heading">
              <h2 id="story-heading" className="display-2 max-w-2xl">
                {art.heading[lang]}
              </h2>
              <p className="lede mt-4 max-w-xl">{art.lede[lang]}</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {story.map((ph, i) => (
                  <StoryFigure key={ph.base} photo={ph} lang={lang} wide={i === 0} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="display-3">
              {t.galleryHeading}
            </h2>
            <Gallery photos={photos} name={p.name} locale={lang} />
          </section>

          {/* Quick facts */}
          <section aria-labelledby="cap-heading">
            <h2 id="cap-heading" className="display-3">
              {t.theProperty}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map(([label, value]) => (
                <div key={label} className="border-t border-[var(--color-line)] pt-3">
                  <dt className="text-xs text-[var(--color-ink-soft)]">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Lo mejor de este alojamiento — real, property-specific (issue #44) */}
          {p.highlights.length > 0 && (
            <section aria-labelledby="best-heading">
              <h2 id="best-heading" className="display-3">
                {t.bestOf}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h.title} className="border-t border-[var(--color-line)] pt-4">
                    <p className="font-semibold">{h.title}</p>
                    <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">{h.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {locale === "es" && p.idealFor && p.idealFor.length > 0 && (
            <section aria-labelledby="ideal-heading">
              <h2 id="ideal-heading" className="display-3">
                Ideal para
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.idealFor.map((item) => (
                  <li key={item} className="pv-chip pv-chip--accent">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {locale === "es" && p.weekendPlan && p.weekendPlan.length > 0 && (
            <section aria-labelledby="weekend-heading">
              <h2 id="weekend-heading" className="display-3">
                Cómo sería tu fin de semana
              </h2>
              <ol className="mt-4 space-y-4">
                {p.weekendPlan.map((d) => (
                  <li key={d.day} className="flex gap-4">
                    <span className="w-20 flex-none pt-0.5 text-sm font-semibold text-[var(--accent-700)]">
                      {d.day}
                    </span>
                    <p className="text-sm text-[var(--color-ink-soft)]">{d.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {p.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="display-3">{s.heading}</h2>
              {s.body.map((para, i) => (
                <p key={i} className="mt-3 text-[var(--color-ink-soft)]">
                  {para}
                </p>
              ))}
            </section>
          ))}

          {p.instagram && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              {lang === "en" ? "See more of the apartment on Instagram: " : "Más fotos y novedades del apartamento en Instagram: "}
              <a
                className="font-semibold text-[var(--color-ink)] underline underline-offset-4"
                href={instagramUrl(p.instagram)}
                target="_blank"
                rel="noopener"
              >
                @{p.instagram}
              </a>
            </p>
          )}

          {/* Amenities grouped */}
          <section aria-labelledby="amenities-heading">
            <h2 id="amenities-heading" className="display-3">
              {t.amenities}
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {p.amenityGroups.map((g) => (
                <div key={g.category}>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{g.category}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-ink-soft)]">
                    {g.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 before:mt-px before:text-[var(--color-ink-faint)] before:content-['—']">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Location */}
          <section aria-labelledby="loc-heading">
            <h2 id="loc-heading" className="display-3">
              {t.location}
            </h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              {p.name} — {p.location.addressLine}, {p.location.postalCode} {p.location.region}.
            </p>

            <figure className="mt-4 overflow-hidden rounded-[var(--radius-lg)] shadow-[inset_0_0_0_1px_var(--color-line)]">
              <iframe
                title={
                  locale === "en"
                    ? `Approximate location of ${p.name} on the map`
                    : `Ubicación aproximada de ${p.name} en el mapa`
                }
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-64 w-full border-0 sm:h-72"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  p.location.geo.lng - 0.035
                }%2C${p.location.geo.lat - 0.02}%2C${p.location.geo.lng + 0.035}%2C${
                  p.location.geo.lat + 0.02
                }&layer=mapnik&marker=${p.location.geo.lat}%2C${p.location.geo.lng}`}
              />
              <figcaption className="bg-[var(--color-mist)] px-3 py-1.5 text-xs text-[var(--color-ink-faint)]">
                {locale === "en"
                  ? "Approximate area — the exact address is shared after booking. Map © OpenStreetMap."
                  : "Zona aproximada — la dirección exacta se facilita al confirmar la reserva. Mapa © OpenStreetMap."}
              </figcaption>
            </figure>

            <h3 className="mt-6 text-sm font-semibold">{t.gettingThere}</h3>
            {p.location.gettingThere.map((para, i) => (
              <p key={i} className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {para}
              </p>
            ))}

            <h3 className="mt-6 text-sm font-semibold">{t.distances}</h3>
            <table className="mt-3 w-full border-collapse text-sm">
              <caption className="sr-only">{t.nearby}</caption>
              <tbody>
                {p.nearby.map((n) => (
                  <tr key={n.name} className="border-b border-[var(--color-line)]">
                    <td className="py-2 pr-4">
                      <span className="mr-3 inline-block w-24 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                        {NEARBY_LABEL[lang][n.category] ?? n.category}
                      </span>
                      {n.name}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums whitespace-nowrap text-[var(--color-ink-soft)]">
                      {n.distance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
              Distancias estimadas (fuente: Booking.com / OpenStreetMap).
            </p>
          </section>

          {/* Stay info */}
          <section aria-labelledby="stay-heading">
            <h2 id="stay-heading" className="display-3">
              {t.stayInfo}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t.checkIn} value={p.stayInfo.checkIn} />
              <Row label={t.checkOut} value={p.stayInfo.checkOut} />
              {p.stayInfo.deposit && <Row label={t.deposit} value={p.stayInfo.deposit} />}
              {p.stayInfo.licenseNumber && (
                <Row label={t.license} value={p.stayInfo.licenseNumber} />
              )}
            </dl>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-soft)]">
              {p.stayInfo.notes.map((n) => (
                <li key={n}>· {n}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-semibold">{t.cancellation}</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{p.cancellationPolicy.summary}</p>
          </section>

          {links.length > 0 && (
            <section aria-labelledby="more-heading">
              <h2 id="more-heading" className="display-3">
                {t.more}
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {links.map((l) => (
                  <li key={l.path}>
                    <Link
                      href={l.path}
                      className="pv-card pv-card--interactive block !p-4 text-sm font-medium"
                    >
                      {l.label} <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside
          id={bookingSectionId(p.slug)}
          className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
        >
          <BookingWidget
            propertySlug={p.slug}
            maxGuests={p.capacity.guests}
            minNightsHint={getRateConfig(p.slug)?.minNights}
            locale={locale}
            rating={p.rating}
          />
        </aside>
      </div>

      <div id="opiniones" className="scroll-mt-24">
        <ReviewsBlock reviews={p.reviews} propertyName={p.name} rating={p.rating} />
      </div>
      <FaqBlock items={p.faq} heading={t.faqHeading(p.name)} />

      {/* Closing CTA (issue #44 §14) */}
      <section
        data-experience={p.experience}
        className="border-t border-[var(--color-line)] bg-[var(--accent-50)] section-y-tight"
      >
        <div className="container-page">
          <h2 className="display-3">{t.closingHeading(p.name)}</h2>
          <p className="lede mt-2 max-w-xl">{t.closingBody}</p>
          <div className="mt-6">
            <DirectBookingCompare locale={locale} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={bookingSectionHref(p.slug)} className="pv-btn pv-btn--primary">
              {t.closingCta}
            </a>
            <Link href="/contacto" className="pv-btn pv-btn--secondary">
              {t.closingContact}
            </Link>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 p-3 backdrop-blur-sm lg:hidden">
        <a href={bookingSectionHref(p.slug)} className="pv-btn pv-btn--primary pv-btn--block">
          {t.stickyCta}
        </a>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--color-line)] pb-2 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="sm:text-right">{value}</dd>
    </div>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse border-b border-[var(--color-line)] py-4 pr-3">
      <dt className="mt-1.5 text-xs leading-snug text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="text-[clamp(1.4rem,1.1rem+1vw,2.1rem)] font-semibold leading-none tracking-[-0.03em]">
        {value}
      </dd>
    </div>
  );
}

function StoryFigure({ photo, lang, wide }: { photo: ResponsivePhoto; lang: "es" | "en"; wide: boolean }) {
  const ratio = photo.aspect < 1 ? "aspect-[3/4]" : "aspect-[4/3]";
  return (
    <figure className={wide ? "col-span-2 sm:col-span-1" : ""}>
      <div className={`relative overflow-hidden bg-[var(--color-mist)] ${ratio}`}>
        <Picture photo={photo} sizes="(max-width: 640px) 100vw, 30vw" imgClassName="h-full w-full object-cover" />
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
