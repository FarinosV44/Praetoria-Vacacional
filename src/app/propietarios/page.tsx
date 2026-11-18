import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, faqJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FaqBlock } from "@/components/FaqBlock";
import { Picture } from "@/components/media/Picture";
import { photoByBase } from "@/content/properties/photos";
import { company } from "@/content/company";
import { ownerFaq, ownerReasons, ownerServices, ownerSteps } from "@/content/owners";
import { OwnerLeadForm } from "./OwnerLeadForm";

export const metadata: Metadata = pageMetadata({
  title: "Gestión de apartamentos turísticos en El Perelló y Cullera",
  description:
    "Gestión integral de tu apartamento turístico: licencia, reservas, huéspedes, limpieza con equipo propio y mantenimiento. Costa sur de Valencia y Javalambre.",
  path: "/propietarios",
});

const crumbs = [
  { name: "Inicio", path: "/" },
  { name: "Propietarios", path: "/propietarios" },
];

const ZONES = [
  {
    photo: "vista-tormenta",
    slug: "valencia",
    eyebrow: "Mar",
    title: "Costa sur de Valencia",
    places: "El Perelló · Les Palmeres · La Llastra · Mareny · Cullera",
    body: "Especialistas en apartamentos en primera línea de playa. Demanda todo el verano y escapadas el resto del año, a media hora de Valencia.",
  },
  {
    photo: "camarena-atardecer-otono",
    slug: "javalambre",
    eyebrow: "Montaña",
    title: "Sierra de Javalambre",
    places: "Camarena de la Sierra y alrededores",
    body: "El pueblo más cercano a las pistas de Javalambre: esquí en invierno, setas en otoño y montaña en primavera y verano.",
  },
] as const;

const PAPERWORK_GUIDES = [
  {
    href: "/blog/gestion-administrativa-apartamentos-turisticos",
    eyebrow: "Registros y viajeros",
    title: "Tu apartamento turístico, sin papeleo ni complicaciones",
    body: "SES.HOSPEDAJES, registro de turismo de la Comunitat Valenciana y qué ha pasado con el Registro Único.",
  },
  {
    href: "/blog/iva-apartamentos-turisticos-diciembre-2026",
    eyebrow: "Facturas e IVA",
    title: "El IVA del 10 % en apartamentos turísticos desde diciembre de 2026",
    body: "Qué estancias llevan IVA, cuándo hay que facturar y cómo encaja el modelo 303.",
  },
] as const;

const PAPERWORK_WA =
  "Hola, tengo un apartamento turístico y me gustaría que Praetoria Vacacional se encargara de mis registros y obligaciones administrativas. ¿Podéis informarme?";

export default function PropietariosPage() {
  // Evocative, owner-supplied view of the coast — not an interior shot.
  const hero = photoByBase("valencia", "dunas-llastra") ?? photoByBase("valencia", "vista-tormenta");
  const tel = company.phone.replace(/\s+/g, "");
  const wa = company.whatsapp.replace(/[^\d]/g, "");

  return (
    <div>
      <JsonLd data={faqJsonLd(ownerFaq)} />
      <Breadcrumbs items={crumbs} />

      {/* 1 · Hero — the promise, one action */}
      <section aria-labelledby="owners-title" className="bg-[var(--color-ink)] text-white">
        <div className="container-page grid items-center gap-10 py-[clamp(3rem,2rem+4vw,6rem)] lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/75">
              Propietarios · Gestión integral
            </p>
            <h1 id="owners-title" className="mt-4 display-2 !text-white">
              Tu apartamento turístico, gestionado de principio a fin
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
              Licencia, anuncio, reservas, huéspedes, limpieza y mantenimiento. Nosotros nos ocupamos de
              todo; <strong className="text-white">tú solo recibes tus ingresos</strong>.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#propuesta" className="pv-btn pv-btn--ondark pv-btn--lg">
                Pide tu propuesta <span aria-hidden>→</span>
              </a>
              <a href={`tel:${tel}`} className="border-b border-white/60 pb-0.5 text-sm font-semibold">
                o llámanos al {company.phone}
              </a>
            </div>
            <p className="mt-6 text-sm text-white/70">
              El Perelló · Les Palmeres · La Llastra · Cullera · Camarena de la Sierra
            </p>
          </div>
          {hero && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
              <Picture
                photo={hero}
                alt="Dunas y playa de la Llastra bajo un cielo de nubes y rayos de sol, en la costa sur de Valencia"
                sizes="(min-width: 1024px) 45vw, 100vw"
                priority
                imgClassName="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* 2 · Pain → relief */}
      <section aria-labelledby="pain-heading" className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">¿Te suena?</p>
          <h2 id="pain-heading" className="mt-3 display-3">
            Alquilar por días da dinero. Gestionarlo, también da trabajo.
          </h2>
          <p className="lede mt-4">
            Mensajes de huéspedes a cualquier hora, llaves, limpiezas entre reservas, calendarios en
            varias plataformas, precios, registro de viajeros, facturas, licencias y averías en pleno
            agosto. Si tu apartamento está en la costa o en la montaña y tú vives en otro sitio, todo se
            complica. En la costa sur de Valencia cuesta encontrar a alguien que se ocupe de todo, de la
            licencia a la limpieza. <strong>Nosotros lo hacemos.</strong>
          </p>
        </div>
      </section>

      {/* 3 · Services */}
      <section aria-labelledby="services-heading" className="border-t border-[var(--color-line)] bg-white py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page">
          <p className="eyebrow">Qué hacemos por ti</p>
          <h2 id="services-heading" className="mt-3 display-3 max-w-2xl">
            Gestión integral: un único equipo para todo
          </h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 border-t border-[var(--color-ink)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {ownerServices.map((s) => (
              <div key={s.title}>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3b · Paperwork only — for owners who already rent on their own */}
      <section
        id="tramites"
        aria-labelledby="paperwork-heading"
        className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]"
      >
        <div className="container-page max-w-4xl">
          <p className="eyebrow">Gestión integral para propietarios</p>
          <h2 id="paperwork-heading" className="mt-3 display-3 max-w-2xl">
            ¿Ya alquilas por tu cuenta? Te quitamos el papeleo
          </h2>
          <p className="lede mt-4 max-w-2xl">
            Registros turísticos, comunicaciones de viajeros, facturación, IVA y seguimiento de
            obligaciones. No hace falta que cambies de plataforma ni que nos des las llaves: tú sigues
            con tus reservas y nosotros nos ocupamos de los trámites que nos encargues.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {PAPERWORK_GUIDES.map((g) => (
              <li key={g.href}>
                <Link
                  href={g.href}
                  className="pv-card pv-card--interactive block h-full !p-5"
                >
                  <span className="eyebrow">{g.eyebrow}</span>
                  <span className="mt-2 block text-base font-semibold">{g.title}</span>
                  <span className="mt-2 block text-sm text-[var(--color-ink-soft)]">{g.body}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex flex-wrap gap-3">
            <Link href="/gestion-tramites-alquiler-turistico" className="pv-btn pv-btn--lg pv-btn--ink">
              Ver el servicio de trámites y precios
            </Link>
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(PAPERWORK_WA)}`}
              target="_blank"
              rel="noopener"
              className="pv-btn pv-btn--lg pv-btn--secondary"
            >
              Preguntar por WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* 4 · Zones */}
      <section aria-labelledby="zones-heading" className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page">
          <p className="eyebrow">Dónde trabajamos</p>
          <h2 id="zones-heading" className="mt-3 display-3 max-w-2xl">
            Del Mediterráneo a la nieve
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {ZONES.map((z) => {
              const photo = photoByBase(z.slug, z.photo);
              return (
                <article key={z.title} className="pv-card overflow-hidden">
                  {photo && (
                    <div className="relative aspect-[16/9]">
                      <Picture
                        photo={photo}
                        alt={`${z.title}: ${z.places}`}
                        sizes="(min-width: 768px) 50vw, 100vw"
                        imgClassName="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="eyebrow">{z.eyebrow}</p>
                    <h3 className="mt-2 font-display text-2xl">{z.title}</h3>
                    <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{z.places}</p>
                    <p className="mt-3 text-[var(--color-ink-soft)]">{z.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5 · Why us */}
      <section aria-labelledby="why-heading" className="border-t border-[var(--color-line)] bg-white py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page">
          <p className="eyebrow">Por qué con nosotros</p>
          <h2 id="why-heading" className="mt-3 display-3 max-w-2xl">
            Especialistas en gestión integral de apartamentos turísticos
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ownerReasons.map((r) => (
              <div key={r.title} className="pv-card pv-card--pad">
                <h3 className="font-display text-lg">{r.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · How it works */}
      <section aria-labelledby="steps-heading" className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="steps-heading" className="mt-3 display-3 max-w-2xl">
            Cuatro pasos y te olvidas
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ownerSteps.map((s, i) => (
              <li key={s.title} className="border-t border-[var(--color-ink)] pt-4">
                <span className="font-display text-3xl text-[var(--accent-600)]">{i + 1}</span>
                <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7 · Form */}
      <section
        id="propuesta"
        aria-labelledby="form-heading"
        className="scroll-mt-24 border-t border-[var(--color-line)] bg-white py-[clamp(3.5rem,2.5rem+3vw,6rem)]"
      >
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Sin compromiso</p>
            <h2 id="form-heading" className="mt-3 display-3">
              Pide tu propuesta personalizada
            </h2>
            <p className="lede mt-4">
              Cuéntanos cómo es tu alojamiento y te llamamos para conocerlo. Te presentaremos lo que
              haríamos, una estimación de ingresos realista y nuestras condiciones.
            </p>
            <ul className="mt-6 space-y-2 text-[var(--color-ink-soft)]">
              {[
                "Respuesta rápida, por teléfono o WhatsApp",
                "Propuesta adaptada a tu alojamiento",
                "Tramitamos la licencia si aún no la tienes",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span aria-hidden className="text-[var(--accent-600)]">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
              ¿Prefieres hablar?{" "}
              <a className="font-semibold underline" href={`tel:${tel}`}>
                {company.phone}
              </a>{" "}
              ·{" "}
              <a className="font-semibold underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener">
                WhatsApp
              </a>
            </p>
          </div>
          <div className="pv-card pv-card--pad">
            <OwnerLeadForm />
          </div>
        </div>
      </section>

      <FaqBlock items={ownerFaq} heading="Preguntas de propietarios" />
    </div>
  );
}
