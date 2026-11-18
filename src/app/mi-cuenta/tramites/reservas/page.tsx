import Link from "next/link";
import { requireOwner } from "@/domains/tramites/context";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { nextPending, EVENT_LABEL } from "@/domains/tramites/deadlines";
import { EmptyState, fmtDate, fmtDateTime } from "@/components/tramites/ui";

export const metadata = { title: "Reservas" };
export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const ctx = await requireOwner();
  const snap = await portalSnapshot(ctx);
  const alias = new Map(snap.properties.map((p) => [p.id, p.alias]));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reservas</h1>
        <Link href="/mi-cuenta/tramites/reservas/nueva" className="pv-btn pv-btn--ink">
          Comunicar una reserva
        </Link>
      </div>
      <p className="max-w-2xl text-sm text-[var(--color-ink-soft)]">
        Cada reserva, su anulación y la entrada de los viajeros deben comunicarse a Interior en las 24 horas siguientes. Avísanos en cuanto
        se produzcan. Saldo disponible: <strong>{ctx.account.reservationCredits}</strong> reservas.
      </p>
      {snap.reports.length === 0 ? (
        <EmptyState>Todavía no nos has comunicado ninguna reserva.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-[var(--color-paper)] text-left">
              <tr>
                <th className="p-3">Vivienda</th>
                <th className="p-3">Fechas</th>
                <th className="p-3">Siguiente paso</th>
                <th className="p-3">Datos de viajeros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {snap.reports.map((r) => {
                const n = nextPending(r);
                return (
                  <tr key={r.id}>
                    <td className="p-3">
                      <Link className="font-medium underline" href={`/mi-cuenta/tramites/reservas/${r.id}`}>
                        {alias.get(r.propertyId) ?? "Vivienda"}
                      </Link>
                    </td>
                    <td className="p-3">
                      {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                      {r.cancelledAt && <span className="ml-2 text-[var(--color-ink-faint)]">(anulada)</span>}
                    </td>
                    <td className="p-3">
                      {n ? `${EVENT_LABEL[n.event]} · antes de ${fmtDateTime(n.due!.toISOString())}` : "Todo comunicado"}
                    </td>
                    <td className="p-3">{r.travellerDataAt ? "Recibidos" : r.cancelledAt ? "—" : "Pendientes"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
