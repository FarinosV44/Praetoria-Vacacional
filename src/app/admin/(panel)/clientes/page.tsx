import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { displayName } from "@/domains/crm/types";
import type { ReservationSource } from "@/domains/booking/types";

export const metadata = { title: "Clientes" };

const CHANNEL_LABELS: Record<string, string> = {
  direct: "Web directa",
  booking: "Booking.com",
  airbnb: "Airbnb",
  manual: "Manual",
  other: "Otro",
};

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    channel?: string;
    property?: string;
    consent?: string;
    repeaters?: string;
  }>;
}) {
  const sp = await searchParams;
  const repo = getRepository();
  const properties = getAllProperties();

  const customers = await repo.listCustomers({
    q: sp.q || undefined,
    channel: (sp.channel as ReservationSource) || undefined,
    property: properties.find((p) => p.slug === sp.property)?.id,
    consentOnly: sp.consent === "1",
    repeatersOnly: sp.repeaters === "1",
  });

  const profiles = await Promise.all(customers.map((c) => repo.customerProfile(c.id)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Clientes</h1>
        <div className="flex gap-2">
          <a
            href={`/admin/clientes/export?${new URLSearchParams(
              Object.entries(sp).filter(([, v]) => v) as [string, string][],
            ).toString()}`}
            className="h-10 rounded-lg border border-[var(--color-line)] px-4 text-sm leading-10"
          >
            Exportar CSV
          </a>
          <Link
            href="/admin/clientes/nuevo"
            className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium leading-10 text-white"
          >
            Nuevo cliente
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Nombre, email, teléfono, documento…"
          className="h-10 min-w-[240px] rounded-lg border border-[var(--color-line)] px-3"
        />
        <select
          name="channel"
          defaultValue={sp.channel ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Todos los canales</option>
          {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          name="property"
          defaultValue={sp.property ?? ""}
          className="h-10 rounded-lg border border-[var(--color-line)] px-2"
        >
          <option value="">Cualquier alojamiento</option>
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="consent" value="1" defaultChecked={sp.consent === "1"} /> Con
          consentimiento
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="repeaters" value="1" defaultChecked={sp.repeaters === "1"} />{" "}
          Repetidores
        </label>
        <button className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-white">Filtrar</button>
      </form>

      <p className="text-xs text-[var(--color-ink-soft)]">{customers.length} clientes</p>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Contacto</th>
              <th className="p-3">Canal</th>
              <th className="p-3">Reservas</th>
              <th className="p-3">Gasto</th>
              <th className="p-3">Última estancia</th>
              <th className="p-3">Marketing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin clientes.
                </td>
              </tr>
            )}
            {customers.map((c, i) => {
              const prof = profiles[i];
              return (
                <tr key={c.id} className="hover:bg-[var(--accent-50)]">
                  <td className="p-3">
                    <Link
                      className="font-medium text-[var(--accent-700)] hover:underline"
                      href={`/admin/clientes/${c.id}`}
                    >
                      {displayName(c)}
                    </Link>
                    {c.docNumber && (
                      <span className="block text-xs text-[var(--color-ink-soft)]">{c.docNumber}</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-[var(--color-ink-soft)]">
                    {c.email}
                    <br />
                    {c.phone}
                  </td>
                  <td className="p-3 text-xs">
                    {c.channelOrigin ? CHANNEL_LABELS[c.channelOrigin] ?? c.channelOrigin : "—"}
                  </td>
                  <td className="p-3">{prof?.confirmedCount ?? 0}</td>
                  <td className="p-3">
                    {prof
                      ? new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(prof.totalSpentCents / 100)
                      : "—"}
                  </td>
                  <td className="p-3 text-xs">{prof?.lastStay ?? "—"}</td>
                  <td className="p-3 text-xs">
                    {c.marketingConsent ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">sí</span>
                    ) : (
                      <span className="text-[var(--color-ink-soft)]">no</span>
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
