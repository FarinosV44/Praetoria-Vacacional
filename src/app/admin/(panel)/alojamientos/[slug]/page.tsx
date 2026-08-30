import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { getRepository } from "@/lib/repository";
import { resolveRateConfig } from "@/domains/pricing/resolve";
import { getRateConfig } from "@/content/rates";
import { resolveStayFees } from "@/domains/pricing/fees";
import { getImportFeedStatus, type FeedState } from "@/domains/integrations/sync-status";
import { updateRatesAction, setImportFeedUrlAction } from "@/domains/admin/actions";
import { RatesForm } from "../../precios/RatesForm";
import { ImportFeedForm } from "../../sincronizacion/ImportFeedForm";
import { formatMoney, formatRange } from "@/lib/format";
import { todayIso } from "@/lib/dates";
import { env, DEMO_MODE } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

type Tab = "general" | "precios" | "calendario" | "contenido" | "politicas" | "integraciones";
const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "precios", label: "Precios y cargos" },
  { id: "calendario", label: "Calendario" },
  { id: "contenido", label: "Contenido y SEO" },
  { id: "politicas", label: "Políticas" },
  { id: "integraciones", label: "Integraciones" },
];

const FEED_BADGE: Record<FeedState, "ok" | "neutral" | "danger"> = {
  configured: "ok",
  not_configured: "neutral",
  error: "danger",
};
const PLACEHOLDER: Record<string, string> = {
  booking: "https://ical.booking.com/v1/export?t=…",
  airbnb: "https://www.airbnb.com/calendar/ical/….ics",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: getPropertyBySlug(slug)?.name ?? "Alojamiento" };
}

export default async function AlojamientoFichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const property = getPropertyBySlug(slug);
  if (!property) notFound();
  const tab: Tab = TABS.find((t) => t.id === tabParam)?.id ?? "general";

  const rate = (await resolveRateConfig(slug)) ?? getRateConfig(slug)!;
  const repo = getRepository();
  const today = todayIso();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/alojamientos" className="text-sm text-[var(--a-accent-strong)] hover:underline">
          ← Alojamientos
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1>{property.name}</h1>
          <span className="admin-chip" data-tone="neutral">
            {property.experience === "ski" ? "Montaña" : "Playa"}
          </span>
        </div>
        <p className="admin-muted text-sm">
          {property.location.area} · {property.location.region}
        </p>
      </div>

      <nav
        aria-label="Secciones del alojamiento"
        className="flex flex-wrap gap-1 border-b border-[var(--a-line)]"
      >
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/alojamientos/${slug}?tab=${t.id}`}
            className="-mb-px border-b-2 px-3 py-2 text-sm"
            style={{
              borderColor: t.id === tab ? "var(--a-accent)" : "transparent",
              color: t.id === tab ? "var(--a-accent-strong)" : "var(--a-text-soft)",
              fontWeight: t.id === tab ? 600 : 500,
            }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "general" && <GeneralTab property={property} rate={rate} />}
      {tab === "precios" && (
        <section className="admin-card p-4">
          <RatesForm propertySlug={slug} config={rate} action={updateRatesAction} />
        </section>
      )}
      {tab === "calendario" && (
        <CalendarioTab
          blocks={(await repo.listBlocks(property.id))
            .filter((b) => b.source === "manual" && b.endDate > today)
            .sort((a, b) => a.startDate.localeCompare(b.startDate))}
        />
      )}
      {tab === "contenido" && <ContenidoTab property={property} />}
      {tab === "politicas" && <PoliticasTab property={property} />}
      {tab === "integraciones" && <IntegracionesTab slug={slug} />}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="admin-muted text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function GeneralTab({
  property,
  rate,
}: {
  property: NonNullable<ReturnType<typeof getPropertyBySlug>>;
  rate: Awaited<ReturnType<typeof resolveRateConfig>> & object;
}) {
  const fees = resolveStayFees(rate);
  return (
    <div className="space-y-4">
      <section className="admin-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Capacidad</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <Fact label="Huéspedes" value={String(property.capacity.guests)} />
          <Fact label="Dormitorios" value={String(property.capacity.bedrooms)} />
          <Fact label="Camas" value={String(property.capacity.beds)} />
          <Fact label="Baños" value={String(property.capacity.bathrooms)} />
          <div className="col-span-2 sm:col-span-4">
            <Fact label="Distribución" value={property.capacity.bedConfig} />
          </div>
        </dl>
        <p className="admin-muted mt-2 text-xs">
          La capacidad se define en el contenido del alojamiento (no en base de datos). El máximo de
          huéspedes que admite el buscador y la validación de precio se toma de aquí.
        </p>
      </section>

      <section className="admin-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Resumen operativo</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <Fact label="Precio base" value={`${formatMoney(rate.baseNightlyCents)}/noche`} />
          <Fact label="Estancia mínima" value={`${rate.minNights} noches`} />
          <Fact
            label="Estancia máxima"
            value={rate.maxNights > 0 ? `${rate.maxNights} noches` : "sin límite"}
          />
          <Fact label="Temporadas" value={String(rate.seasons.length)} />
          <Fact label="Cargos activos" value={fees.length ? fees.map((f) => f.label).join(", ") : "ninguno"} />
          <Fact
            label="Huecos exactos"
            value={rate.sellExactGaps === false ? "no se venden" : "se venden bajo mínimo"}
          />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/admin/alojamientos/${property.slug}?tab=precios`} className="admin-btn" data-variant="outline">
            Editar precios y reglas
          </Link>
          <Link href={`/${property.slug}`} target="_blank" className="admin-btn" data-variant="ghost">
            Ver ficha pública
          </Link>
        </div>
      </section>
    </div>
  );
}

function CalendarioTab({
  blocks,
}: {
  blocks: { id: string; startDate: string; endDate: string; summary: string | null }[];
}) {
  return (
    <section className="admin-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Fechas cerradas (próximas)</h2>
        <Link href="/admin/calendario" className="admin-btn" data-variant="primary">
          Abrir calendario
        </Link>
      </div>
      {blocks.length === 0 ? (
        <p className="admin-muted mt-2 text-sm">Sin cierres manuales próximos.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--a-line-soft)] text-sm">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-1.5">
              <span>{formatRange(b.startDate, b.endDate)}</span>
              <span className="admin-muted text-xs">{b.summary ?? "Cerrado"}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="admin-muted mt-3 text-xs">
        Los precios por fecha, la estancia mínima por fecha y los cierres se gestionan desde el
        calendario (selección de días → panel de acciones). Las reservas y bloqueos importados de
        Booking/Airbnb aparecen ahí y se configuran en la pestaña «Integraciones».
      </p>
    </section>
  );
}

function ContenidoTab({
  property,
}: {
  property: NonNullable<ReturnType<typeof getPropertyBySlug>>;
}) {
  return (
    <section className="admin-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">SEO actual</h2>
        <Link href="/admin/contenido" className="admin-btn" data-variant="primary">
          Editar contenido y SEO
        </Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="admin-muted text-xs">Tagline</dt>
          <dd>{property.tagline}</dd>
        </div>
        <div>
          <dt className="admin-muted text-xs">Título (meta)</dt>
          <dd>{property.seo.metaTitle}</dd>
        </div>
        <div>
          <dt className="admin-muted text-xs">Descripción (meta)</dt>
          <dd>{property.seo.metaDescription}</dd>
        </div>
        <div>
          <dt className="admin-muted text-xs">H1</dt>
          <dd>{property.seo.h1}</dd>
        </div>
      </dl>
      <p className="admin-muted mt-3 text-xs">
        Desde «Editar contenido y SEO» puedes cambiar tagline, intro, «lo mejor», puntos de interés,
        FAQ y el bloque SEO/OG con vista previa del resultado en Google — sin desplegar.
      </p>
    </section>
  );
}

function PoliticasTab({
  property,
}: {
  property: NonNullable<ReturnType<typeof getPropertyBySlug>>;
}) {
  const s = property.stayInfo;
  const c = property.cancellationPolicy;
  return (
    <div className="space-y-4">
      <section className="admin-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Estancia</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <Fact label="Entrada" value={s.checkIn} />
          <Fact label="Salida" value={s.checkOut} />
          <Fact label="Fianza" value={s.deposit ?? "—"} />
          <Fact label="Licencia turística" value={s.licenseNumber ?? "—"} />
        </dl>
        {s.notes.length > 0 && (
          <ul className="admin-muted mt-2 list-disc pl-5 text-xs">
            {s.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Cancelación</h2>
        <p className="text-sm">{c.summary}</p>
        {c.tiers.length > 0 && (
          <ul className="admin-muted mt-2 text-xs">
            {c.tiers.map((t, i) => (
              <li key={i}>
                Hasta {t.daysBefore} días antes: {t.refundPercent}% de reembolso
              </li>
            ))}
          </ul>
        )}
        <p className="admin-muted mt-3 text-xs">
          Los textos legales completos (aviso legal, privacidad, cookies, condiciones de reserva) y
          los datos de PRAETORIA, S.L. se editan en{" "}
          <Link href="/admin/configuracion" className="text-[var(--a-accent-strong)] underline">
            Configuración
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

async function IntegracionesTab({ slug }: { slug: string }) {
  const status = (await getImportFeedStatus()).find((p) => p.slug === slug);
  if (!status) return null;
  return (
    <section className="admin-card space-y-3 p-4">
      <h2 className="text-sm font-semibold">Feeds iCal de este alojamiento</h2>
      {DEMO_MODE && (
        <p className="admin-chip" data-tone="warn">
          modo demo — usa variables de entorno para que las URLs sobrevivan a los redespliegues
        </p>
      )}
      {status.channels.map((ch) => (
        <div key={ch.channel} className="rounded-[var(--a-radius-sm)] border border-[var(--a-line)] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{ch.label}</span>
            <span className="admin-chip" data-tone={FEED_BADGE[ch.state]}>
              {ch.state === "configured" ? "Configurado" : ch.state === "error" ? "Error" : "No configurado"}
            </span>
            {ch.fromEnv && <span className="admin-muted text-xs">(variable de entorno)</span>}
          </div>
          <ImportFeedForm
            propertySlug={slug}
            channel={ch.channel}
            channelLabel={ch.label}
            placeholder={PLACEHOLDER[ch.channel]}
            current={ch.url}
            action={setImportFeedUrlAction}
          />
          <p className="admin-muted mt-2 text-xs">
            Última sincronización:{" "}
            {ch.lastRunAt ? new Date(ch.lastRunAt).toLocaleString("es-ES") : "nunca"} · eventos
            importados: {ch.eventsImported} · {ch.lastError ?? ch.lastStatus ?? "—"}
          </p>
        </div>
      ))}
      <div className="text-xs">
        <p className="admin-muted font-medium">Feed de exportación (esta propiedad):</p>
        {env.icalExportConfigured ? (
          <p className="mt-1 break-all rounded bg-[var(--a-surface-2)] p-2 font-mono">
            {absoluteUrl(`/api/ical/${slug}/${env.ICAL_EXPORT_TOKEN ?? ""}.ics`)}
          </p>
        ) : (
          <p className="admin-muted mt-1">
            Define <code>ICAL_EXPORT_TOKEN</code> para generar la URL del feed.
          </p>
        )}
      </div>
      <Link href="/admin/sincronizacion" className="admin-btn" data-variant="ghost">
        Ver todas las integraciones
      </Link>
    </section>
  );
}
