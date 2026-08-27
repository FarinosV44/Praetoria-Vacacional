import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { absoluteUrl } from "@/lib/seo";
import { env } from "@/lib/env";

export const metadata = { title: "Sincronización" };

export default async function AdminSyncPage() {
  const repo = getRepository();
  const rows = await repo.getSyncRows();
  const properties = getAllProperties();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Sincronización de calendarios (iCal)</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Cada alojamiento importa las reservas de Booking.com por su feed iCal y exporta las reservas
        directas por su propio feed. iCal no es instantáneo: Booking suele actualizar cada pocas
        horas, así que se revalida la disponibilidad antes de confirmar cualquier reserva directa.
      </p>

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
                <td className="p-3">{row.lastRunAt ? new Date(row.lastRunAt).toLocaleString("es-ES") : "Nunca"}</td>
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

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Feeds de exportación</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Añade estas URLs en Booking.com → Calendario → Sincronizar calendarios. Requiere que{" "}
          <code>ICAL_EXPORT_TOKEN</code> esté configurado.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {properties.map((p) => (
            <li key={p.slug} className="break-all font-mono text-xs">
              {absoluteUrl(`/api/ical/${p.slug}.ics?token=${env.icalExportConfigured ? "•••" : "PENDIENTE"}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Importación</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Pega la URL de exportación iCal de cada alojamiento en Booking dentro de{" "}
          <code>src/content/properties/&lt;slug&gt;.ts</code> (<code>icalImportUrls</code>) y lanza{" "}
          <code>POST /api/ical/import</code> (protegido con <code>ICAL_EXPORT_TOKEN</code>) o el cron
          programado.
        </p>
      </section>
    </div>
  );
}
