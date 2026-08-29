import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { displayName } from "@/domains/crm/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { cancelReservationAction } from "@/domains/admin/actions";
import { ReservationForm } from "../ReservationForm";
import { updateReservationAction } from "@/domains/reservations/actions";

export const metadata = { title: "Reserva" };

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const reservation = await repo.getReservation(id);
  if (!reservation) notFound();

  const [customers, customer] = await Promise.all([
    repo.listCustomers(),
    reservation.customerId ? repo.getCustomer(reservation.customerId) : Promise.resolve(null),
  ]);
  const property = getPropertyById(reservation.propertyId);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link href="/admin/reservas" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Reservas
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl">
            <span className="font-mono">{reservation.code}</span>
          </h1>
          <StatusBadge status={reservation.status} />
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {property?.name} · {formatRange(reservation.checkIn, reservation.checkOut)} ·{" "}
          {guestsLabel(reservation.guests)} · {formatMoney(reservation.totalCents)}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-3">
          <p className="text-xs text-[var(--color-ink-soft)]">Cliente</p>
          <p className="mt-1">
            {customer ? (
              <Link
                className="text-[var(--accent-700)] hover:underline"
                href={`/admin/clientes/${customer.id}`}
              >
                {displayName(customer)}
              </Link>
            ) : (
              <span className="text-[var(--color-ink-soft)]">sin vincular</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-3">
          <p className="text-xs text-[var(--color-ink-soft)]">Factura</p>
          <p className="mt-1">{reservation.invoiceNumber ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-3">
          <p className="text-xs text-[var(--color-ink-soft)]">Pago</p>
          <p className="mt-1">{reservation.paymentState}</p>
        </div>
      </section>

      {(reservation.status === "confirmed" ||
        reservation.status === "pending" ||
        reservation.status === "external") && (
        <form action={cancelReservationAction}>
          <input type="hidden" name="id" value={reservation.id} />
          <ConfirmSubmit
            message={`¿Cancelar la reserva ${reservation.code}? ${
              reservation.status === "external"
                ? "El registro se marca como cancelada (el bloqueo iCal no se toca)."
                : "Las fechas quedarán liberadas."
            }`}
          >
            Cancelar reserva
          </ConfirmSubmit>
        </form>
      )}

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <h2 className="mb-3 font-display text-lg">Editar datos</h2>
        <ReservationForm
          mode="edit"
          action={updateReservationAction}
          properties={getAllProperties()}
          customers={customers}
          reservation={reservation}
        />
      </section>
    </div>
  );
}
