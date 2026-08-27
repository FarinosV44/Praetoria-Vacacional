import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatDateLong, guestsLabel, nightsLabel } from "@/lib/format";
import { ConfirmationTracker } from "./ConfirmationTracker";

export const metadata: Metadata = {
  title: "Reserva confirmada",
  robots: { index: false, follow: false },
};

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const reservation = code ? await getRepository().getReservationByCode(code) : null;
  const property = reservation ? getPropertyById(reservation.propertyId) : null;

  const confirmed = reservation?.status === "confirmed";

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-8 text-center">
        {confirmed ? (
          <>
            <ConfirmationTracker
              propertySlug={property?.slug ?? ""}
              totalCents={reservation!.totalCents}
              code={reservation!.code}
            />
            <p className="text-4xl">✓</p>
            <h1 className="mt-3 font-display text-2xl">Reserva confirmada</h1>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              Hemos enviado la confirmación a tu correo. Guarda tu localizador.
            </p>
            <dl className="mt-6 space-y-2 text-left text-sm">
              <Row label="Localizador" value={reservation!.code} strong />
              <Row label="Alojamiento" value={property?.name ?? "—"} />
              <Row label="Entrada" value={formatDateLong(reservation!.checkIn)} />
              <Row label="Salida" value={formatDateLong(reservation!.checkOut)} />
              <Row
                label="Estancia"
                value={`${nightsLabel(reservation!.nights)} · ${guestsLabel(reservation!.guests)}`}
              />
              <Row label="Importe pagado" value={formatMoney(reservation!.totalCents)} strong />
            </dl>
          </>
        ) : (
          <>
            <p className="text-4xl">⏳</p>
            <h1 className="mt-3 font-display text-2xl">Estamos confirmando tu pago</h1>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              {reservation
                ? "En cuanto el pago quede verificado recibirás el email de confirmación. Puedes actualizar esta página en unos segundos."
                : "No encontramos esta reserva. Si acabas de pagar, revisa tu correo en unos minutos."}
            </p>
          </>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
      <dt className="text-[var(--color-ink-soft)]">{label}</dt>
      <dd className={strong ? "font-semibold" : ""}>{value}</dd>
    </div>
  );
}
