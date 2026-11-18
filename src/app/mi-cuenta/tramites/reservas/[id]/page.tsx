import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/domains/tramites/context";
import { ownerGet } from "@/domains/tramites/service";
import { ownerReadStore } from "@/domains/tramites/repo";
import { deadlineState, EVENT_LABEL, type DeadlineState } from "@/domains/tramites/deadlines";
import { cancelReservationAction } from "@/domains/tramites/actions/portal";
import { TravellersForm } from "@/components/tramites/portal-forms";
import { Submit } from "@/components/tramites/forms";
import { OwnerStatusBadge, fmtDate, fmtDateTime } from "@/components/tramites/ui";
import type { ReportEvent } from "@/domains/tramites/types";

export const metadata = { title: "Reserva" };
export const dynamic = "force-dynamic";

const STATE_LABEL: Record<DeadlineState, string> = {
  hecho: "Comunicada",
  a_tiempo: "Pendiente",
  vence_pronto: "Vence pronto",
  vencido: "Fuera de plazo",
  no_aplica: "No aplica",
};

export default async function ReservaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const ctx = await requireOwner();
  const { id } = await params;
  const { nueva } = await searchParams;
  const r = await ownerGet(ctx, (s) => s.getReport(id));
  if (!r) notFound();
  const filing = (await ownerReadStore().listFilings({ accountId: r.accountId })).find((f) => f.reservationReportId === r.id);
  const events: ReportEvent[] = ["reserva", "anulacion", "entrada"];

  return (
    <div className="max-w-3xl space-y-8">
      <Link href="/mi-cuenta/tramites/reservas" className="text-sm underline">
        ← Reservas
      </Link>
      {nueva && (
        <p className="pv-note pv-note--info" role="status">
          Reserva recibida. Ahora completa los datos de los viajeros para que podamos comunicar la entrada.
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Reserva del {fmtDate(r.checkIn)} al {fmtDate(r.checkOut)}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {r.travellers} viajeros · {r.channel}
            {r.externalRef && ` · localizador ${r.externalRef}`} · hecha el {fmtDateTime(r.bookedAt)}
          </p>
        </div>
        {filing && <OwnerStatusBadge status={filing.status} />}
      </div>

      {r.billing === "pendiente" && (
        <p className="pv-note pv-note--warn">
          Esta reserva está pendiente de saldo.{" "}
          <Link href="/mi-cuenta/tramites/pagos" className="underline">
            Amplía tu saldo
          </Link>{" "}
          para que podamos tramitarla.
        </p>
      )}

      <section aria-labelledby="plazos-h">
        <h2 id="plazos-h" className="text-lg font-semibold">Comunicaciones a Interior</h2>
        <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white text-sm">
          {events.map((e) => {
            const s = deadlineState(r, e);
            if (s.state === "no_aplica") return null;
            const done = e === "reserva" ? r.communicatedReservaAt : e === "anulacion" ? r.communicatedAnulacionAt : r.communicatedEntradaAt;
            return (
              <li key={e} className="flex flex-wrap justify-between gap-2 p-3">
                <span className="font-medium">{EVENT_LABEL[e]}</span>
                <span className={s.state === "vencido" ? "text-[var(--color-danger)]" : "text-[var(--color-ink-soft)]"}>
                  {STATE_LABEL[s.state]} · {done ? `presentada el ${fmtDateTime(done)}` : `límite ${fmtDateTime(s.due!.toISOString())}`}
                </span>
              </li>
            );
          })}
        </ul>
        {filing && (
          <p className="mt-3 text-sm">
            <Link href={`/mi-cuenta/tramites/expedientes/${filing.id}`} className="underline">
              Ver el expediente y los justificantes
            </Link>
          </p>
        )}
      </section>

      {!r.cancelledAt && (
        <section aria-labelledby="viajeros-h" className="pv-card p-5">
          <h2 id="viajeros-h" className="text-lg font-semibold">Datos de los viajeros</h2>
          {r.travellerDataAt ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Recibidos el {fmtDateTime(r.travellerDataAt)}. Por seguridad no los mostramos aquí; si hay que corregir algo, vuelve a
              enviarlos completos.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Los que pide el Real Decreto 933/2021 para cada persona alojada. No hace falta subir fotos de los documentos.
            </p>
          )}
          <div className="mt-5">
            <TravellersForm reportId={r.id} count={r.travellers} />
          </div>
        </section>
      )}

      {!r.cancelledAt ? (
        <section aria-labelledby="anular-h" className="pv-card p-5">
          <h2 id="anular-h" className="font-semibold">¿Se ha anulado esta reserva?</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">La anulación también se comunica en 24 horas. Avísanos en cuanto ocurra.</p>
          <form action={cancelReservationAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="reportId" value={r.id} />
            <label className="block">
              <span className="pv-label">Fecha y hora de la anulación</span>
              <input className="pv-input" type="datetime-local" name="cancelledAt" required />
            </label>
            <Submit label="Comunicar la anulación" variant="ghost" />
          </form>
        </section>
      ) : (
        <p className="pv-note pv-note--info">Anulada el {fmtDateTime(r.cancelledAt)}.</p>
      )}
    </div>
  );
}
