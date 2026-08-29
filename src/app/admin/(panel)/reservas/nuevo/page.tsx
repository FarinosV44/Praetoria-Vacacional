import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { ReservationForm } from "../ReservationForm";
import { createReservationAndRedirect } from "@/domains/reservations/actions";

export const metadata = { title: "Nueva reserva" };

export default async function NuevaReservaPage() {
  const customers = await getRepository().listCustomers();
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/reservas" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Reservas
        </Link>
        <h1 className="mt-1 font-display text-2xl">Nueva reserva</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Registra una reserva de web directa, Booking, Airbnb o manual. Si no vinculas un cliente,
          se creará o vinculará automáticamente a partir del email/teléfono/documento del huésped.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <ReservationForm
          mode="create"
          action={createReservationAndRedirect}
          properties={getAllProperties()}
          customers={customers}
        />
      </div>
    </div>
  );
}
