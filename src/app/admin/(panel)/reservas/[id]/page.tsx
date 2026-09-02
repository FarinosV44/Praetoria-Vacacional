import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import { formatDateShort, formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { todayIso } from "@/lib/dates";
import { displayName } from "@/domains/crm/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { cancelReservationAction } from "@/domains/admin/actions";
import { CancelWithRefund } from "./CancelWithRefund";
import { ReservationForm } from "../ReservationForm";
import { updateReservationAction } from "@/domains/reservations/actions";
import { draftInvoiceFromReservationAction } from "@/domains/invoicing/actions";
import { INVOICE_STATUS_LABEL } from "@/domains/invoicing/types";

export const metadata = { title: "Reserva" };

export default async function ReservaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepository();
  const reservation = await repo.getReservation(id);
  if (!reservation) notFound();

  const [customers, customer, invoices] = await Promise.all([
    repo.listCustomers(),
    reservation.customerId ? repo.getCustomer(reservation.customerId) : Promise.resolve(null),
    repo.invoicesForReservation(reservation.id),
  ]);
  const property = getPropertyById(reservation.propertyId);
  const today = todayIso();

  const paid = reservation.paymentState === "paid";
  const stay =
    reservation.status === "cancelled" || reservation.status === "expired"
      ? null
      : reservation.checkOut <= today
        ? "Finalizada"
        : reservation.checkIn <= today
          ? "En curso"
          : "Próxima";

  const timeline: { label: string; done: boolean; note?: string }[] = [
    { label: "Reserva creada", done: true, note: formatDateShort(reservation.createdAt.slice(0, 10)) },
    {
      label: "Datos del huésped",
      done: !!reservation.guestName,
      note: reservation.guestName ?? "pendiente",
    },
    {
      label: reservation.status === "external" ? "Reserva externa registrada" : "Pago",
      done: reservation.status === "confirmed" || reservation.status === "external" || paid,
      note: reservation.status === "external" ? reservation.source : reservation.paymentState,
    },
    {
      label: "Factura",
      done: invoices.length > 0,
      note: invoices.length > 0 ? invoices[0]!.number : "sin emitir",
    },
    stay ? { label: `Estancia · ${stay}`, done: stay === "Finalizada" } : null,
  ].filter(Boolean) as { label: string; done: boolean; note?: string }[];

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <Link href="/admin/reservas" className="text-sm text-[var(--a-accent-strong)] hover:underline">
          ← Reservas
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-mono">{reservation.code}</h1>
          <StatusBadge status={reservation.status} />
          {stay && (
            <span className="admin-chip" data-tone="neutral">
              {stay}
            </span>
          )}
        </div>
        <p className="admin-muted mt-1 text-sm">
          {property?.name} · {formatRange(reservation.checkIn, reservation.checkOut)} ·{" "}
          {reservation.nights} noches · {guestsLabel(reservation.guests)} ·{" "}
          {formatMoney(reservation.totalCents)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <section className="admin-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Estado</h2>
          <ol className="space-y-3">
            {timeline.map((t) => (
              <li key={t.label} className="flex gap-3 text-sm">
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full text-[10px] ${
                    t.done
                      ? "bg-[var(--a-ok)] text-white"
                      : "border border-[var(--a-line)] text-[var(--a-text-faint)]"
                  }`}
                >
                  {t.done ? "✓" : ""}
                </span>
                <span>
                  <span className={t.done ? "" : "admin-muted"}>{t.label}</span>
                  {t.note && <span className="admin-muted"> · {t.note}</span>}
                </span>
              </li>
            ))}
          </ol>

          <dl className="mt-4 space-y-2 border-t border-[var(--a-line-soft)] pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="admin-muted">Cliente</dt>
              <dd>
                {customer ? (
                  <Link className="text-[var(--a-accent-strong)] hover:underline" href={`/admin/clientes/${customer.id}`}>
                    {displayName(customer)}
                  </Link>
                ) : (
                  <span className="admin-muted">sin vincular</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="admin-muted">Factura</dt>
              <dd>{reservation.invoiceNumber ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="admin-muted">Pago</dt>
              <dd>{reservation.paymentState}</dd>
            </div>
          </dl>

          {(reservation.status === "confirmed" || reservation.status === "pending") && (
            <CancelWithRefund
              reservationId={reservation.id}
              code={reservation.code}
              checkIn={reservation.checkIn}
              totalCents={reservation.totalCents}
              tiers={property?.cancellationPolicy.tiers ?? [{ daysBefore: 0, refundPercent: 0 }]}
              policySummary={property?.cancellationPolicy.summary ?? "Sin política de cancelación definida."}
            />
          )}
          {reservation.status === "external" && (
            <form action={cancelReservationAction} className="mt-4">
              <input type="hidden" name="id" value={reservation.id} />
              <ConfirmSubmit
                message={`¿Cancelar la reserva ${reservation.code}? El registro se marca como cancelada (el bloqueo iCal no se toca).`}
              >
                Cancelar reserva
              </ConfirmSubmit>
            </form>
          )}
        </section>

        <section className="admin-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Facturación</h2>
            <form action={draftInvoiceFromReservationAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button className="admin-btn" data-variant="primary">
                Emitir factura
              </button>
            </form>
          </div>
          {invoices.length === 0 ? (
            <p className="admin-muted mt-2 text-sm">
              Sin facturas para esta reserva. «Emitir factura» crea un borrador con los datos
              precargados.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link className="font-mono text-[var(--a-accent-strong)] hover:underline" href={`/admin/facturas/${inv.id}`}>
                    {inv.number}
                  </Link>{" "}
                  <span className="admin-muted">
                    · {INVOICE_STATUS_LABEL[inv.status]} · {formatMoney(inv.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Editar datos</h2>
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
