import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";

export const metadata: Metadata = {
  title: "No se completó el pago",
  robots: { index: false, follow: false },
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const reservation = code ? await getRepository().getReservationByCode(code) : null;
  const property = reservation ? getPropertyById(reservation.propertyId) : null;

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-8 text-center">
        <p className="text-4xl">↺</p>
        <h1 className="mt-3 font-display text-2xl">No se ha completado el pago</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          No se ha realizado ningún cargo. Tus fechas siguen disponibles mientras nadie más las
          reserve; puedes intentarlo de nuevo.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {property ? (
            <Link
              href={`/reservar/${property.slug}?checkIn=${reservation!.checkIn}&checkOut=${reservation!.checkOut}&guests=${reservation!.guests}`}
              className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
            >
              Reintentar la reserva
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
            >
              Volver al inicio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
