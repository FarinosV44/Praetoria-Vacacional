import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, faqJsonLd, absoluteUrl } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FaqBlock } from "@/components/FaqBlock";
import { company } from "@/content/company";
import { formatMoney } from "@/lib/format";
import { getActiveCatalog } from "@/domains/tramites/service";
import { withVat, type Catalog } from "@/domains/tramites/catalog";
import { contratacionActiva } from "@/domains/tramites/gate";
import { tramitesIndexable, TRAMITES_PUBLIC_PREFIX } from "@/domains/tramites/launch";
import { TramitesCta } from "@/components/tramites/TramitesCta";
import { PortalPreview } from "@/components/tramites/PortalPreview";
import {
  tramitesFaq,
  tramitesHero,
  tramitesIncluded,
  tramitesNotIncluded,
  tramitesProblems,
  tramitesSteps,
  tramitesWhatsappText,
} from "@/content/tramites-landing";

export const revalidate = 3600;

const PATH = TRAMITES_PUBLIC_PREFIX;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getActiveCatalog();
  const ses = c.services.find((s) => s.code === "ses_alta" && s.enabled);
  const res = c.services.find((s) => s.code === "comunicacion_reserva" && s.enabled);
  const prices =
    ses && res
      ? ` Alta ${formatMoney(ses.priceCents)} + IVA y ${formatMoney(res.priceCents)} + IVA por reserva.`
      : "";
  return pageMetadata({
    title: "Registro de viajeros SES.HOSPEDAJES y trámites de alquiler turístico",
    description: `Damos de alta tu vivienda en SES.HOSPEDAJES y comunicamos cada reserva y entrada de viajeros en plazo.${prices} Sin cuota ni permanencia.`,
    path: PATH,
    noindex: !tramitesIndexable(),
  });
}

const crumbs = [
  { name: "Inicio", path: "/" },
  { name: "Propietarios", path: "/propietarios" },
  { name: "Gestión de trámites", path: PATH },
];

const GUIDES = [
  {
    href: `${PATH}/registro-viajeros-ses-hospedajes`,
    eyebrow: "Guía",
    title: "Registro de viajeros en SES.HOSPEDAJES",
    body: "Qué hay que comunicar, en qué plazo, qué datos pide Interior y qué pasa si no se hace.",
  },
  {
    href: `${PATH}/registro-unico-nrua-anulado`,
    eyebrow: "Guía",
    title: "El Registro Único (NRUA), anulado por el Supremo",
    body: "Qué anuló la sentencia de 2026, qué sigue vigente y qué debes mirar en tus anuncios.",
  },
];

function serviceJsonLd(catalog: Catalog) {
  const offers = catalog.services
    .filter((s) => s.enabled && s.unit !== "quote")
    .map((s) => ({
      "@type": "Offer",
      name: s.name,
      price: (withVat(s.priceCents, catalog.vatRatePercent) / 100).toFixed(2),
      priceCurrency: "EUR",
      description: s.note ?? s.short,
      url: absoluteUrl(PATH),
    }));
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Gestión de trámites de viviendas turísticas",
    serviceType: "Comunicación de viajeros a SES.HOSPEDAJES",
    provider: { "@type": "Organization", name: company.tradeName, url: absoluteUrl("/") },
    areaServed: { "@type": "Country", name: "España" },
    url: absoluteUrl(PATH),
    offers,
  };
}

export default async function TramitesLanding() {
  const catalog = await getActiveCatalog();
  const active = contratacionActiva();
  const ses = catalog.services.find((s) => s.code === "ses_alta" && s.enabled);
  const reserva = catalog.services.find((s) => s.code === "comunicacion_reserva" && s.enabled);
  const historica = catalog.services.find((s) => s.code === "revision_historica" && s.enabled);
  const porUso = catalog.plans.find((p) => p.code === "por_uso" && p.visible);
  const continua = catalog.plans.find((p) => p.code === "gestion_continua" && p.visible);
  const wa = company.whatsapp.replace(/[^\d]/g, "");
  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent(tramitesWhatsappText)}`;

  return (
    <>
      <JsonLd data={serviceJsonLd(catalog)} />
      <JsonLd data={faqJsonLd(tramitesFaq)} />
      <Breadcrumbs items={crumbs} />

      {/* Hero */}
      <section aria-labelledby="tramites-h1" className="bg-[var(--color-ink)] text-white">
        <div className="container-page grid items-center gap-12 py-[clamp(3rem,2rem+4vw,6rem)] lg:grid-cols-[1.05fr_1fr]">
          <div className="min-w-0">
            <p className="eyebrow !text-white/70">{tramitesHero.eyebrow}</p>
            <h1 id="tramites-h1" className="display-2 mt-3 text-balance !text-white">
              {tramitesHero.h1}
            </h1>
            <p className="mt-5 text-xl font-semibold text-white">{tramitesHero.claim}</p>
            <p className="mt-4 max-w-xl text-white/80">{tramitesHero.lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <TramitesCta active={active} where="hero" tone="light" />
              <a
                href={waHref}
                target="_blank"
                rel="noopener"
                className="pv-btn pv-btn--lg pv-btn--ondark-ghost"
              >
                Pregúntanos por WhatsApp
              </a>
            </div>
            {ses && reserva && (
              <p className="mt-5 text-sm text-white/70">
                Alta {formatMoney(ses.priceCents)} + IVA, una vez ·{" "}
                {formatMoney(reserva.priceCents)} + IVA por reserva · sin cuota ni permanencia
              </p>
            )}
          </div>
          <PortalPreview />
        </div>
      </section>

      {/* Problema */}
      <section aria-labelledby="pain-h" className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page">
          <p className="eyebrow">Por qué se complica</p>
          <h2 id="pain-h" className="display-3 mt-3 max-w-2xl">
            Comunicar viajeros parece poca cosa hasta que tienes tres reservas el mismo fin de
            semana
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {tramitesProblems.map((p) => (
              <li key={p.title} className="pv-card !p-6">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-[var(--color-ink-soft)]">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Precios */}
      <section
        id="precios"
        aria-labelledby="precios-h"
        className="border-t border-[var(--color-line)] bg-white py-[clamp(3.5rem,2.5rem+3vw,6rem)]"
      >
        <div className="container-page">
          <p className="eyebrow">Precios</p>
          <h2 id="precios-h" className="display-3 mt-3 max-w-2xl">
            Pagas lo que usas, y sabes cuánto antes de empezar
          </h2>
          <p className="lede mt-4 max-w-2xl">
            Precios sin IVA ({catalog.vatRatePercent} %). En el alta ves el total con IVA antes de
            pagar y recibes factura de cada cobro.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ses && (
              <PriceCard
                title={ses.name}
                price={formatMoney(ses.priceCents)}
                unit="una sola vez por vivienda"
                note={ses.note}
              >
                {ses.short}
              </PriceCard>
            )}
            {reserva && porUso && (
              <PriceCard
                title={reserva.name}
                price={formatMoney(porUso.reservationCents)}
                unit="por reserva"
                note={reserva.note}
                highlight
              >
                {reserva.short}
              </PriceCard>
            )}
            {historica && (
              <PriceCard
                title={historica.name}
                price={`desde ${formatMoney(historica.priceCents)}`}
                unit="presupuesto previo"
                note={historica.note}
              >
                {historica.short}
              </PriceCard>
            )}
          </div>

          {continua && (
            <div className="mt-8 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="font-semibold">
                  {continua.name} <span className="pv-chip ml-1 align-middle">Próximamente</span>
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  {formatMoney(continua.monthlyFeeCents)} + IVA al mes por vivienda, con{" "}
                  {continua.includedReservationsPerMonth} reservas incluidas y{" "}
                  {formatMoney(continua.reservationCents)} + IVA cada reserva adicional. Aún no se
                  puede contratar.
                </p>
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener"
                className="pv-btn pv-btn--ghost mt-4 sm:mt-0"
              >
                Avisadme cuando esté
              </a>
            </div>
          )}

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">Qué incluye</h3>
              <ul className="mt-3 space-y-2 text-[var(--color-ink-soft)]">
                {tramitesIncluded.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span aria-hidden className="text-[var(--color-sea-500)]">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Qué no incluye</h3>
              <ul className="mt-3 space-y-2 text-[var(--color-ink-soft)]">
                {tramitesNotIncluded.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span aria-hidden>·</span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm">
                ¿Quieres que llevemos también reservas, huéspedes y limpieza?{" "}
                <Link href="/propietarios" className="underline">
                  Mira la gestión integral
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pasos */}
      <section aria-labelledby="pasos-h" className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="pasos-h" className="display-3 mt-3 max-w-2xl">
            Cuatro pasos, y el único que se repite es avisarnos de la reserva
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tramitesSteps.map((s, i) => (
              <li key={s.title} className="pv-card !p-6">
                <span className="text-sm font-semibold text-[var(--color-sea-500)]">
                  Paso {i + 1}
                </span>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[var(--color-ink-soft)]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Responsabilidad y datos */}
      <section
        aria-labelledby="datos-h"
        className="border-t border-[var(--color-line)] bg-white py-[clamp(3.5rem,2.5rem+3vw,6rem)]"
      >
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Lo que conviene saber</p>
            <h2 id="datos-h" className="display-3 mt-3">
              Presentamos por ti, pero la obligación sigue siendo tuya
            </h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              El Real Decreto 933/2021 obliga al titular de la vivienda a comunicar cada reserva y
              cada entrada en 24 horas. Con la autorización que firmas, presentamos en tu nombre.
              Para llegar a tiempo necesitamos que nos registres la reserva en cuanto la recibas.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              Si una reserva nos llega con el plazo vencido, la presentamos igualmente y queda
              anotada como tardía. Comunicar tarde no borra un incumplimiento anterior, y no te
              diremos lo contrario.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              No presentamos nada de forma automática: cada comunicación la revisa y la hace una
              persona en la sede oficial del Ministerio, y el resguardo va a tu carpeta.
            </p>
          </div>
          <div className="pv-card !p-6">
            <h3 className="text-lg font-semibold">Los datos de tus huéspedes</h3>
            <ul className="mt-3 space-y-3 text-[var(--color-ink-soft)]">
              <li>Se guardan cifrados, separados de tus datos de cliente y de facturación.</li>
              <li>
                Solo los ve la persona que presenta el parte. Cada consulta queda registrada con
                fecha y autor.
              </li>
              <li>
                Los usamos únicamente para comunicarlos a Interior, como encargados del tratamiento
                (art. 28 RGPD).
              </li>
              <li>Nunca te pedimos la contraseña de Booking, Airbnb ni de ninguna plataforma.</li>
            </ul>
            <p className="mt-4 text-sm">
              <Link href="/legal/condiciones-tramites#privacidad" className="underline">
                Condiciones, autorización y privacidad del servicio
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Guías */}
      <section aria-labelledby="guias-h" className="py-[clamp(3.5rem,2.5rem+3vw,6rem)]">
        <div className="container-page max-w-4xl">
          <p className="eyebrow">Para saber más</p>
          <h2 id="guias-h" className="display-3 mt-3">
            Guías sobre las obligaciones de las viviendas turísticas
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="pv-card pv-card--interactive block h-full !p-5">
                  <span className="eyebrow">{g.eyebrow}</span>
                  <span className="mt-2 block text-base font-semibold">{g.title}</span>
                  <span className="mt-2 block text-sm text-[var(--color-ink-soft)]">{g.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqBlock items={tramitesFaq} />

      {/* CTA final */}
      <section aria-labelledby="cta-h" className="bg-[var(--color-ink)] text-white">
        <div className="container-page flex flex-col items-start gap-6 py-[clamp(3rem,2rem+3vw,5rem)] lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 id="cta-h" className="display-3 !text-white">
              Deja de mirar el reloj cada vez que entra una reserva
            </h2>
            <p className="mt-3 text-white/80">
              {active
                ? "El alta se hace en unos minutos. Ves el precio exacto antes de pagar."
                : "Déjanos tus datos y te llamamos para explicarte el servicio. No se cobra nada."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <TramitesCta active={active} where="final" tone="light" />
            <a
              href={waHref}
              target="_blank"
              rel="noopener"
              className="pv-btn pv-btn--lg pv-btn--ondark-ghost"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function PriceCard({
  title,
  price,
  unit,
  note,
  highlight,
  children,
}: {
  title: string;
  price: string;
  unit: string;
  note?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pv-card flex flex-col !p-6 ${highlight ? "ring-2 ring-[var(--color-ink)]" : ""}`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3">
        <span className="text-3xl font-semibold">{price}</span>{" "}
        <span className="text-sm text-[var(--color-ink-soft)]">+ IVA · {unit}</span>
      </p>
      <p className="mt-3 text-[var(--color-ink-soft)]">{children}</p>
      {note && <p className="mt-auto pt-4 text-sm text-[var(--color-ink-faint)]">{note}</p>}
    </div>
  );
}
