import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import {
  COMM_KIND_LABEL,
  type ScheduledMessageStatus,
} from "@/domains/comms/types";
import { resendMessageAction } from "@/domains/comms/actions";

export const metadata = { title: "Comunicaciones" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ScheduledMessageStatus, string> = {
  planned: "Programado",
  queued: "En cola",
  sent: "Enviado",
  failed: "Fallido",
  cancelled: "Cancelado",
  skipped: "Omitido",
};
const STATUS_TONE: Record<ScheduledMessageStatus, string> = {
  planned: "bg-slate-100 text-slate-700",
  queued: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-500",
  skipped: "bg-amber-100 text-amber-900",
};

export default async function ComunicacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const repo = getRepository();
  const [messages, reservations] = await Promise.all([
    repo.listScheduledMessages({ limit: 300 }),
    repo.listReservations({}),
  ]);
  const byId = new Map(reservations.map((r) => [r.id, r]));

  const counts = messages.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});
  const rows = estado ? messages.filter((m) => m.status === estado) : messages;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Comunicaciones con el huésped</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Mensajes transaccionales programados por reserva (pre-llegada, instrucciones de entrada,
            recordatorio de salida, agradecimiento y reseña). No son marketing y no dependen del
            consentimiento comercial. Issue #69.
          </p>
        </div>
        <Link href="/admin/comunicaciones/ajustes" className="admin-btn" data-variant="ghost">
          Ajustes por alojamiento
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/admin/comunicaciones"
          className={`rounded-full px-3 py-1 ${!estado ? "bg-[var(--a-accent)] text-white" : "bg-slate-100"}`}
        >
          Todos ({messages.length})
        </Link>
        {(Object.keys(STATUS_LABEL) as ScheduledMessageStatus[]).map((s) =>
          counts[s] ? (
            <Link
              key={s}
              href={`/admin/comunicaciones?estado=${s}`}
              className={`rounded-full px-3 py-1 ${estado === s ? "bg-[var(--a-accent)] text-white" : "bg-slate-100"}`}
            >
              {STATUS_LABEL[s]} ({counts[s]})
            </Link>
          ) : null,
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Reserva</th>
              <th className="p-3">Mensaje</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Envío</th>
              <th className="p-3">Intentos</th>
              <th className="p-3">Error</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin comunicaciones {estado ? "en este estado" : "programadas"}.
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const res = byId.get(m.reservationId);
              const property = res ? getPropertyById(res.propertyId) : null;
              return (
                <tr key={m.id} className="align-top">
                  <td className="p-3">
                    {res ? (
                      <Link
                        href={`/admin/reservas/${res.id}`}
                        className="font-medium text-[var(--a-accent)]"
                      >
                        {res.code}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <span className="block text-xs text-[var(--color-ink-soft)]">
                      {property?.name ?? ""}
                    </span>
                  </td>
                  <td className="p-3">{COMM_KIND_LABEL[m.kind]}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[m.status]}`}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {m.sentAt
                      ? `enviado ${new Date(m.sentAt).toLocaleString("es-ES")}`
                      : new Date(m.sendAt).toLocaleString("es-ES")}
                  </td>
                  <td className="p-3 text-xs">{m.attempts}</td>
                  <td className="p-3 text-xs text-red-700">
                    {m.lastError ? <span className="line-clamp-2 max-w-xs">{m.lastError}</span> : "—"}
                  </td>
                  <td className="p-3">
                    {(m.status === "failed" || m.status === "sent" || m.status === "cancelled") && (
                      <form action={resendMessageAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="reservationId" value={m.reservationId} />
                        <button className="admin-btn" data-variant="ghost" type="submit">
                          {m.status === "sent" ? "Reenviar" : "Reintentar"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
