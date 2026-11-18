import Link from "next/link";
import { requireOwner } from "@/domains/tramites/context";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { ReservationForm } from "@/components/tramites/portal-forms";
import { EmptyState } from "@/components/tramites/ui";

export const metadata = { title: "Comunicar una reserva" };
export const dynamic = "force-dynamic";

export default async function NuevaReservaPage({ searchParams }: { searchParams: Promise<{ vivienda?: string }> }) {
  const ctx = await requireOwner();
  const { vivienda } = await searchParams;
  const snap = await portalSnapshot(ctx);
  const props = [...snap.properties].sort((a, b) => (a.id === vivienda ? -1 : b.id === vivienda ? 1 : 0));
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/mi-cuenta/tramites/reservas" className="text-sm underline">
        ← Reservas
      </Link>
      <h1 className="text-2xl font-semibold">Comunicar una reserva</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Primero los datos de la reserva; después, desde su ficha, los de los viajeros. Cada reserva consume una del saldo
        ({ctx.account.reservationCredits} disponibles).
      </p>
      {ctx.account.reservationCredits === 0 && (
        <p className="pv-note pv-note--warn">
          No te queda saldo. Puedes comunicarla igualmente, pero no podremos tramitarla hasta que amplíes el saldo en{" "}
          <Link href="/mi-cuenta/tramites/pagos" className="underline">
            Pagos
          </Link>
          .
        </p>
      )}
      {props.length === 0 ? (
        <EmptyState>Añade primero una vivienda.</EmptyState>
      ) : (
        <div className="pv-card p-5">
          <ReservationForm properties={props.map((p) => ({ id: p.id, alias: p.alias }))} />
        </div>
      )}
    </div>
  );
}
