import { DEMO_MODE, env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import { setImportFeedUrlAction } from "@/domains/admin/actions";
import { getImportFeedStatus, type FeedState } from "@/domains/integrations/sync-status";
import { RunSyncButton } from "./RunSyncButton";
import { ImportFeedForm } from "./ImportFeedForm";

export const metadata = { title: "Sincronización" };

const STATE_BADGE: Record<FeedState, { label: string; cls: string }> = {
  configured: { label: "Configurado", cls: "bg-green-100 text-green-800" },
  not_configured: { label: "No configurado", cls: "bg-gray-100 text-gray-600" },
  error: { label: "Error", cls: "bg-red-100 text-red-700" },
};

const PLACEHOLDER: Record<string, string> = {
  booking: "https://ical.booking.com/v1/export?t=…",
  airbnb: "https://www.airbnb.com/calendar/ical/….ics",
};

export default async function AdminSyncPage() {
  const status = await getImportFeedStatus();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Sincronización de calendarios (iCal)</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Cada alojamiento importa las reservas de Booking.com y/o Airbnb por su feed iCal y exporta
        las reservas directas por su propio feed. La URL de importación se guarda en la base de datos
        (tabla <code>channel_feeds</code>), por <code>property_id</code>, y sobrevive a refrescos,
        despliegues y reinicios del navegador.
      </p>

      {DEMO_MODE && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Modo demostración (sin base de datos).</strong> Las URLs se guardan solo en un
          fichero local del servidor; en un despliegue con sistema de archivos de solo lectura el
          guardado fallará y se mostrará un error. Configura Supabase para producción.
        </div>
      )}

      {status.map((p) => (
        <section
          key={p.slug}
          className="space-y-3 rounded-xl border border-[var(--color-line)] bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg">{p.name}</h2>
            <RunSyncButton propertySlug={p.slug} />
          </div>

          {p.channels.map((ch) => {
            const badge = STATE_BADGE[ch.state];
            return (
              <div key={ch.channel} className="rounded-lg border border-[var(--color-line)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{ch.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {ch.fromContentFileOnly && (
                    <span className="text-xs text-amber-700">
                      (definido en el fichero de contenido, no en la base de datos — guárdalo aquí)
                    </span>
                  )}
                </div>

                {ch.readError && (
                  <p className="mt-1 text-xs text-red-700">
                    No se pudo leer la URL guardada: {ch.readError}
                  </p>
                )}

                <ImportFeedForm
                  propertySlug={p.slug}
                  channel={ch.channel}
                  channelLabel={ch.label}
                  placeholder={PLACEHOLDER[ch.channel]}
                  current={ch.url}
                  action={setImportFeedUrlAction}
                />

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-[var(--color-ink-soft)] sm:grid-cols-2">
                  <div>
                    <dt className="inline font-medium">Última sincronización: </dt>
                    <dd className="inline">
                      {ch.lastRunAt ? new Date(ch.lastRunAt).toLocaleString("es-ES") : "Nunca"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Eventos importados: </dt>
                    <dd className="inline">{ch.eventsImported}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="inline font-medium">Estado del último intento: </dt>
                    <dd className={`inline ${ch.lastError ? "text-red-700" : ""}`}>
                      {ch.lastError ?? ch.lastStatus ?? "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}

          <div className="text-xs text-[var(--color-ink-soft)]">
            <p className="font-medium">Feed de exportación para Booking.com / Airbnb (esta propiedad):</p>
            {env.icalExportConfigured ? (
              <p className="mt-1 break-all rounded bg-[var(--color-paper)] p-2 font-mono text-[var(--color-ink)]">
                {absoluteUrl(`/api/ical/${p.slug}/${env.ICAL_EXPORT_TOKEN ?? ""}.ics`)}
              </p>
            ) : (
              <p className="mt-1 text-amber-700">
                Define <code>ICAL_EXPORT_TOKEN</code> para generar la URL del feed.
              </p>
            )}
            <p className="mt-1">
              Pégala tal cual (HTTPS, sin parámetros). Responde 200 directo, sin redirecciones,
              con <code>Content-Type: text/calendar</code> y un VCALENDAR válido.
            </p>
          </div>
        </section>
      ))}

      <p className="text-xs text-[var(--color-ink-soft)]">
        La sincronización automática se ejecuta por cron (<code>vercel.json</code> →{" "}
        <code>/api/ical/import</code> cada 3&nbsp;h) y usa la URL guardada en la base de datos. iCal
        no es instantáneo; por eso la disponibilidad se revalida en el checkout. «Sincronizar ahora»
        importa de inmediato desde el valor persistido y crea el registro interno de cada reserva.
      </p>
    </div>
  );
}
