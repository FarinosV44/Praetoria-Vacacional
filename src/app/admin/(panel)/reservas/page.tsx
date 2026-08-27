import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { cancelReservationAction } from "@/domains/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Reservas" };

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; status?: string }>;
}) {
  const { property, status } = await searchParams;
  const repo = getRepository();
  const properties = getAllProperties();
  const filterProp = properties.find((p) => p.slug === property);

  const reservations = await repo.listReservations({
    propertyId: filterProp?.id,
    status: status ? [status as never] : undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Reservas</h1>

      <form className="flex flex-wrap gap-2 text-sm">
        <select
          name="property"
          defaultValue={property ?? ""}
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
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los estados</option>
          {["pending", "confirmed", "cancelled", "expired"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-white">Filtrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Localizador</th>
              <th className="p-3">Alojamiento</th>
              <th className="p-3">Fechas</th>
              <th className="p-3">Huéspedes</th>
              <th className="p-3">Importe</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Contacto</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {reservations.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin reservas.
                </td>
              </tr>
            )}
            {reservations.map((r) => {
              const p = getPropertyById(r.propertyId);
              return (
                <tr key={r.id}>
                  <td className="p-3 font-mono text-xs">{r.code}</td>
                  <td className="p-3">{p?.name ?? "—"}</td>
                  <td className="p-3">{formatRange(r.checkIn, r.checkOut)}</td>
                  <td className="p-3">{guestsLabel(r.guests)}</td>
                  <td className="p-3">{formatMoney(r.totalCents)}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-xs text-[var(--color-ink-soft)]">
                    {r.guestName}
                    <br />
                    {r.guestEmail}
                  </td>
                  <td className="p-3">
                    {(r.status === "confirmed" || r.status === "pending") && (
                      <form action={cancelReservationAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmSubmit message={`¿Cancelar la reserva ${r.code}? Las fechas quedarán liberadas.`}>
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
