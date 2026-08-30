import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { addDays, todayIso } from "@/lib/dates";
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

type SP = {
  property?: string;
  status?: string;
  channel?: string;
  payment?: string;
  q?: string;
  range?: string;
};

/** A quick filter is a set of params merged onto the current query. */
function chipHref(sp: SP, patch: Partial<SP>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) merged[k] = v as string;
  // toggle off when the patch is already active
  for (const [k, v] of Object.entries(patch)) {
    if (v && sp[k as keyof SP] === v) delete merged[k];
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/admin/reservas?${qs}` : "/admin/reservas";
}

export default async function AdminReservasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const repo = getRepository();
  const properties = getAllProperties();
  const filterProp = properties.find((p) => p.slug === sp.property);
  const today = todayIso();

  let from: string | undefined;
  let to: string | undefined;
  if (sp.range === "today") {
    from = today;
    to = today;
  } else if (sp.range === "upcoming") {
    from = today;
  } else if (sp.range === "month") {
    from = today.slice(0, 8) + "01";
    to = addDays(`${from.slice(0, 7)}-01`, 31);
  }

  const reservations = await repo.listReservations({
    propertyId: filterProp?.id,
    status: sp.status ? [sp.status as ReservationStatus] : undefined,
    source: (sp.channel as ReservationSource) || undefined,
    paymentState: (sp.payment as PaymentState) || undefined,
    q: sp.q || undefined,
    from,
    to,
  });

  const chips: { label: string; patch: Partial<SP> }[] = [
    { label: "Hoy", patch: { range: "today" } },
    { label: "Próximas", patch: { range: "upcoming" } },
    { label: "Este mes", patch: { range: "month" } },
    { label: "Javalambre", patch: { property: "javalambre" } },
    { label: "Valencia", patch: { property: "valencia" } },
    { label: "Directa", patch: { channel: "direct" } },
    { label: "Booking", patch: { channel: "booking" } },
    { label: "Pagada", patch: { payment: "paid" } },
    { label: "Pendiente de pago", patch: { payment: "pending" } },
    { label: "Canceladas", patch: { status: "cancelled" } },
  ];

  const stayState = (checkIn: string, checkOut: string) =>
    checkOut <= today ? "Finalizada" : checkIn <= today ? "En curso" : "Próxima";

  const exportQs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Reservas</h1>
        <div className="flex gap-2">
          <a href={`/admin/reservas/export?${exportQs}`} className="admin-btn" data-variant="outline">
            Exportar CSV
          </a>
          <Link href="/admin/reservas/nuevo" className="admin-btn" data-variant="primary">
            Nueva reserva
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => {
          const active = Object.entries(c.patch).every(([k, v]) => sp[k as keyof SP] === v);
          return (
            <Link
              key={c.label}
              href={chipHref(sp, c.patch)}
              className="admin-chip"
              data-tone={active ? "accent" : "neutral"}
            >
              {c.label}
            </Link>
          );
        })}
        {(sp.range || sp.property || sp.channel || sp.payment || sp.status || sp.q) && (
          <Link href="/admin/reservas" className="admin-chip" data-tone="neutral">
            × Limpiar
          </Link>
        )}
      </div>

      <form className="admin-card flex flex-wrap items-end gap-2 p-3 text-sm">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Localizador, nombre, email, documento, factura…"
          className="h-9 min-w-[240px] flex-1 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-3"
        />
        {sp.range && <input type="hidden" name="range" value={sp.range} />}
        <select name="property" defaultValue={sp.property ?? ""} className="h-9 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-2">
          <option value="">Todos los alojamientos</option>
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="channel" defaultValue={sp.channel ?? ""} className="h-9 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-2">
          <option value="">Todos los canales</option>
          {CHANNELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="h-9 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-2">
          <option value="">Todos los estados</option>
          {["pending", "confirmed", "external", "cancelled", "expired"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={sp.payment ?? ""} className="h-9 rounded-[var(--a-radius-sm)] border border-[var(--a-line)] px-2">
          <option value="">Pago: cualquiera</option>
          {PAYMENT_STATES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="admin-btn" data-variant="primary">
          Filtrar
        </button>
      </form>

      <p className="admin-muted text-xs">{reservations.length} reservas</p>

      <div className="admin-card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Localizador</th>
              <th>Huésped</th>
              <th>Alojamiento</th>
              <th>Canal</th>
              <th>Fechas</th>
              <th>Noches</th>
              <th>Huéspedes</th>
              <th>Importe</th>
              <th>Pago</th>
              <th>Reserva</th>
              <th>Estancia</th>
              <th>Factura</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 && (
              <tr>
                <td colSpan={13} className="admin-muted p-6 text-center">
                  Sin reservas con estos filtros.
                </td>
              </tr>
            )}
            {reservations.map((r) => {
              const p = getPropertyById(r.propertyId);
              return (
                <tr key={r.id}>
                  <td className="font-mono text-xs">
                    <Link className="text-[var(--a-accent-strong)] hover:underline" href={`/admin/reservas/${r.id}`}>
                      {r.code}
                    </Link>
                  </td>
                  <td>
                    <span className="block truncate">{r.guestName ?? "—"}</span>
                    <span className="admin-muted block text-xs">{r.guestEmail}</span>
                  </td>
                  <td>{p?.name?.split(" ").slice(0, 1).join(" ") ?? "—"}</td>
                  <td className="text-xs">
                    {CHANNELS.find(([v]) => v === r.source)?.[1] ?? r.source}
                    {r.channelDetail ? <span className="admin-muted block">{r.channelDetail}</span> : null}
                  </td>
                  <td className="whitespace-nowrap">{formatRange(r.checkIn, r.checkOut)}</td>
                  <td className="tabular-nums">{r.nights}</td>
                  <td>{guestsLabel(r.guests)}</td>
                  <td className="tabular-nums">{formatMoney(r.totalCents)}</td>
                  <td className="text-xs">{r.paymentState}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-xs">
                    {r.status === "cancelled" || r.status === "expired"
                      ? "—"
                      : stayState(r.checkIn, r.checkOut)}
                  </td>
                  <td className="text-xs">{r.invoiceNumber ?? "—"}</td>
                  <td>
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
