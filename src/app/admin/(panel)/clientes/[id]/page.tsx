import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatRange } from "@/lib/format";
import { displayName } from "@/domains/crm/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CustomerForm } from "../CustomerForm";
import { saveCustomerAction, mergeCustomersAction } from "@/domains/crm/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export const metadata = { title: "Cliente" };

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const profile = await repo.customerProfile(id);
  if (!profile) notFound();

  const [duplicates, allReservations] = await Promise.all([
    repo.findCustomerDuplicates(id),
    repo.listReservations({}),
  ]);
  const reservations = allReservations
    .filter((r) => r.customerId === id)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));

  const money = (c: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
      c / 100,
    );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link href="/admin/clientes" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Clientes
        </Link>
        <h1 className="mt-1 font-display text-2xl">{displayName(profile)}</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Alta {new Date(profile.createdAt).toLocaleDateString("es-ES")}
          {profile.channelOrigin ? ` · origen ${profile.channelOrigin}` : ""}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ["Reservas confirmadas", String(profile.confirmedCount)],
          ["Gasto total", money(profile.totalSpentCents)],
          ["Alojamientos", String(profile.propertiesVisited.length)],
          ["Última estancia", profile.lastStay ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--color-line)] bg-white p-3">
            <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
            <p className="mt-1 text-lg font-medium">{value}</p>
          </div>
        ))}
      </section>

      {profile.couponsUsed.length > 0 && (
        <p className="text-sm">
          <span className="text-[var(--color-ink-soft)]">Descuentos utilizados:</span>{" "}
          {profile.couponsUsed.join(", ")}
        </p>
      )}

      {duplicates.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-medium text-amber-900">Posibles duplicados</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {duplicates.map((d) => (
              <li key={d.customer.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <Link
                    className="text-[var(--accent-700)] hover:underline"
                    href={`/admin/clientes/${d.customer.id}`}
                  >
                    {displayName(d.customer)}
                  </Link>{" "}
                  <span className="text-xs text-amber-800">({d.reasons.join(", ")})</span>
                </span>
                <form action={mergeCustomersAction}>
                  <input type="hidden" name="primaryId" value={profile.id} />
                  <input type="hidden" name="duplicateId" value={d.customer.id} />
                  <ConfirmSubmit
                    message={`Fusionar «${displayName(d.customer)}» en esta ficha. Sus reservas pasarán aquí y la ficha duplicada se ocultará. ¿Continuar?`}
                  >
                    Fusionar aquí
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg">Reservas</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
              <tr>
                <th className="p-3">Localizador</th>
                <th className="p-3">Alojamiento</th>
                <th className="p-3">Fechas</th>
                <th className="p-3">Importe</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--color-ink-soft)]">
                    Sin reservas vinculadas.
                  </td>
                </tr>
              )}
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-mono text-xs">{r.code}</td>
                  <td className="p-3">{getPropertyById(r.propertyId)?.name ?? "—"}</td>
                  <td className="p-3">{formatRange(r.checkIn, r.checkOut)}</td>
                  <td className="p-3">{formatMoney(r.totalCents)}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-xs">{r.invoiceNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <h2 className="mb-3 font-display text-lg">Editar ficha</h2>
        <CustomerForm action={saveCustomerAction} customer={profile} submitLabel="Guardar cambios" />
      </section>
    </div>
  );
}
