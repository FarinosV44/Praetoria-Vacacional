import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { absoluteUrl } from "@/lib/seo";
import { env } from "@/lib/env";
import { setImportFeedUrlAction } from "@/domains/admin/actions";
import { RunSyncButton } from "./RunSyncButton";
import { ImportFeedForm } from "./ImportFeedForm";

export const metadata = { title: "Sincronización" };

export default async function AdminSyncPage() {
  const repo = getRepository();
  const rows = await repo.getSyncRows();
  const properties = getAllProperties();
  const feeds = Object.fromEntries(
    await Promise.all(
      properties.map(async (p) => [
        p.slug,
        {
          booking: await repo.getImportFeedUrl(p.id, "booking").catch(() => null),
          airbnb: await repo.getImportFeedUrl(p.id, "airbnb").catch(() => null),
        },
      ]),
    ),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Sincronización de calendarios (iCal)</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Cada alojamiento importa las reservas de Booking.com por su feed iCal y exporta las reservas
        directas por su propio feed. iCal no es instantáneo: Booking actualiza cada pocas horas, así
        que se revalida la disponibilidad justo antes de confirmar cualquier reserva directa.
      </p>

      {/* Import feed URLs — editable */}
      {properties.map((p) => (
        <section key={p.slug} className="rounded-xl border border-[var(--color-line)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg">{p.name}</h2>
            <RunSyncButton propertySlug={p.slug} />
          </div>
          {!feeds[p.slug]?.booking && !feeds[p.slug]?.airbnb && !p.icalImportUrls[0]?.url && (
            <p className="mt-1 text-sm text-amber-700">
              Aún no configurado — pega la URL iCal de Booking y/o Airbnb.
            </p>
          )}
          <ImportFeedForm
            propertySlug={p.slug}
            channel="booking"
            channelLabel="Booking.com"
            placeholder="https://ical.booking.com/v1/export?t=…"
            current={feeds[p.slug]?.booking ?? p.icalImportUrls[0]?.url ?? null}
            action={setImportFeedUrlAction}
          />
          <ImportFeedForm
            propertySlug={p.slug}
            channel="airbnb"
            channelLabel="Airbnb"
            placeholder="https://www.airbnb.com/calendar/ical/…"
            current={feeds[p.slug]?.airbnb ?? null}
            action={setImportFeedUrlAction}
          />
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            Cada reserva importada crea también un registro interno (cliente por completar y reserva
            «externa») visible en Reservas y en el calendario.
          </p>
          <p className="mt-3 break-all font-mono text-xs text-[var(--color-ink-soft)]">
            Feed de exportación para Booking:{" "}
            {absoluteUrl(`/api/ical/${p.slug}.ics?token=${env.icalExportConfigured ? "•••" : "PENDIENTE"}`)}
          </p>
        </section>
      ))}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Alojamiento</th>
              <th className="p-3">Canal</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Última ejecución</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Eventos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {rows.map((row) => (
              <tr key={row.id} className={row.lastError ? "bg-red-50" : ""}>
                <td className="p-3">{getPropertyById(row.propertyId)?.name ?? "—"}</td>
                <td className="p-3">{row.channel}</td>
                <td className="p-3">{row.direction === "import" ? "Importar" : "Exportar"}</td>
                <td className="p-3">
                  {row.lastRunAt ? new Date(row.lastRunAt).toLocaleString("es-ES") : "Nunca"}
                </td>
                <td className="p-3">
                  {row.lastError ? (
                    <span className="text-red-700">{row.lastError}</span>
                  ) : (
                    (row.lastStatus ?? "—")
                  )}
                </td>
                <td className="p-3">{row.eventsImported}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-ink-soft)]">
        La sincronización automática se ejecuta por cron (<code>vercel.json</code> →{" "}
        <code>/api/ical/import</code> cada 3&nbsp;h). iCal no es instantáneo; retrasos de hasta unas
        horas son normales, por eso la disponibilidad se revalida en el checkout.
      </p>
    </div>
  );
}
