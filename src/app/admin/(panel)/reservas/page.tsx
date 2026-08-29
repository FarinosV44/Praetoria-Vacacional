import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { cancelReservationAction } from "@/domains/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { PaymentState, ReservationSource, ReservationStatus } from "@/domains/booking/types";

export const metadata = { title: "Reservas" };

const CHANNELS: [string, string][] = [
  ["direct", "Web directa"],
  ["booking", "Booking.com"],
  ["airbnb", "Airbnb"],
  ["manual", "Manual"],
  ["other", "Otro"],
];
const PAYMENT_STATES: [string, string][] = [
  ["pending", "Pendiente"],
  ["partial", "Parcial"],
  ["paid", "Pagado"],
  ["refunded", "Reembolsado"],
];

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{
    property?: string;
    status?: string;
    channel?: string;
    payment?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const repo = getRepository();
  const properties = getAllProperties();
  const filterProp = properties.find((p) => p.slug === sp.property);

  const reservations = await repo.listReservations({
    propertyId: filterProp?.id,
    status: sp.status ? [sp.status as ReservationStatus] : undefined,
    source: (sp.channel as ReservationSource) || undefined,
    paymentState: (sp.payment as PaymentState) || undefined,
    q: sp.q || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Reservas</h1>
        <div className="flex gap-2">
          <a
            href={`/admin/reservas/export?${new URLSearchParams(
              Object.entries(sp).filter(([, v]) => v) as [string, string][],
            ).toString()}`}
            className="h-10 rounded-lg border border-[var(--color-line)] px-4 text-sm leading-10"
          >
            Exportar CSV
          </a>
          <Link
            href="/admin/reservas/nuevo"
            className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium leading-10 text-white"
          >
            Nueva reserva
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Localizador, nombre, email, documento, factura…"
          className="h-10 min-w-[240px] rounded-lg border border-[var(--color-line)] px-3"
        />
        <select
          name="property"
          defaultValue={sp.property ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los alojamientos</option>
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="channel"
          defaultValue={sp.channel ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los canales</option>
          {CHANNELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los estados</option>
          {["pending", "confirmed", "external", "cancelled", "expired"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="payment"
          defaultValue={sp.payment ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Pago: cualquiera</option>
          {PAYMENT_STATES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-white">Filtrar</button>
      </form>

      <p className="text-xs text-[var(--color-ink-soft)]">{reservations.length} reservas</p>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Localizador</th>
              <th className="p-3">Alojamiento</th>
              <th className="p-3">Canal</th>
              <th className="p-3">Fechas</th>
              <th className="p-3">Huéspedes</th>
              <th className="p-3">Importe</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Pago</th>
              <th className="p-3">Factura</th>
              <th className="p-3">Contacto</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {reservations.length === 0 && (
              <tr>
                <td colSpan={11} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin reservas.
                </td>
              </tr>
            )}
            {reservations.map((r) => {
              const p = getPropertyById(r.propertyId);
              return (
                <tr key={r.id} className="hover:bg-[var(--accent-50)]">
                  <td className="p-3 font-mono text-xs">
                    <Link
                      className="text-[var(--accent-700)] hover:underline"
                      href={`/admin/reservas/${r.id}`}
                    >
                      {r.code}
                    </Link>
                  </td>
                  <td className="p-3">{p?.name ?? "—"}</td>
                  <td className="p-3 text-xs">
                    {CHANNELS.find(([v]) => v === r.source)?.[1] ?? r.source}
                    {r.channelDetail ? (
                      <span className="block text-[var(--color-ink-soft)]">{r.channelDetail}</span>
                    ) : null}
                  </td>
                  <td className="p-3">{formatRange(r.checkIn, r.checkOut)}</td>
                  <td className="p-3">{guestsLabel(r.guests)}</td>
                  <td className="p-3">{formatMoney(r.totalCents)}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-xs">{r.paymentState}</td>
                  <td className="p-3 text-xs">{r.invoiceNumber ?? "—"}</td>
                  <td className="p-3 text-xs text-[var(--color-ink-soft)]">
                    {r.guestName}
                    <br />
                    {r.guestEmail}
                  </td>
                  <td className="p-3">
                    {(r.status === "confirmed" || r.status === "pending") && (
                      <form action={cancelReservationAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmSubmit
                          message={`¿Cancelar la reserva ${r.code}? Las fechas quedarán liberadas.`}
                        >
                          Cancelar
                        </ConfirmSubmit>
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
