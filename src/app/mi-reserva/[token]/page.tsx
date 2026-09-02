import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney, formatRange, guestsLabel } from "@/lib/format";
import { portalDataForToken } from "@/domains/portal/service";
import { payBalanceAction } from "@/domains/portal/actions";
import { PortalRequestForm } from "./PortalRequestForm";

export const metadata: Metadata = {
  title: "Tu reserva",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente de pago",
  confirmed: "Confirmada",
  external: "Registrada",
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pago?: string }>;
}) {
  const { token } = await params;
  const { pago } = await searchParams;
  const data = await portalDataForToken(token);
  if (!data) {
    return (
      <div className="container-page max-w-lg py-14 text-center">
        <h1 className="display-3">Enlace no válido</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Este enlace no es válido o ha caducado (duran 7 días).
        </p>
        <Link href="/mi-reserva" className="pv-btn pv-btn--primary mt-6 inline-flex">
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  const r = data.reservation;

  return (
    <div className="container-page max-w-2xl py-10">
      <p className="text-sm text-[var(--color-ink-faint)]">Reserva {r.code}</p>
      <h1 className="display-2 mt-1">{data.propertyName}</h1>

      {pago === "ok" && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Pago recibido. Puede tardar un momento en reflejarse aquí.
        </p>
      )}
      {pago === "cancelado" && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Pago cancelado.</p>
      )}
      {(pago === "error" || pago === "no-disponible") && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          No se pudo iniciar el pago online. Escríbenos y lo resolvemos.
        </p>
      )}

      <dl className="pv-card pv-card--pad mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-[var(--color-ink-faint)]">Estado</dt>
          <dd className="font-medium">{STATUS_LABEL[r.status] ?? r.status}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-ink-faint)]">Fechas</dt>
          <dd className="font-medium">{formatRange(r.checkIn, r.checkOut)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-ink-faint)]">Huéspedes</dt>
          <dd className="font-medium">{guestsLabel(r.guests)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-ink-faint)]">Total</dt>
          <dd className="font-medium">{formatMoney(r.totalCents)}</dd>
        </div>
        {data.paidCents > 0 && (
          <div>
            <dt className="text-[var(--color-ink-faint)]">Pagado</dt>
            <dd className="font-medium">{formatMoney(data.paidCents)}</dd>
          </div>
        )}
        {data.outstandingCents > 0 && (
          <div>
            <dt className="text-[var(--color-ink-faint)]">Pendiente</dt>
            <dd className="font-medium text-[var(--accent-700)]">{formatMoney(data.outstandingCents)}</dd>
          </div>
        )}
      </dl>

      {data.outstandingCents > 0 && (
        <form action={payBalanceAction} className="mt-4">
          <input type="hidden" name="token" value={token} />
          <button className="pv-btn pv-btn--primary" type="submit">
            Pagar {formatMoney(data.outstandingCents)} pendientes
          </button>
        </form>
      )}

      {data.invoices.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg">Facturas</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {data.invoices.map((inv) => (
              <li key={inv.id}>
                <Link
                  className="text-[var(--accent-700)] hover:underline"
                  href={`/mi-reserva/${token}/factura/${inv.id}`}
                >
                  {inv.number}
                </Link>{" "}
                · {formatMoney(inv.totalCents)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg">Check-in online (obligatorio)</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Antes de tu llegada, registra los datos de todas las personas que se alojan (normativa
          RD 933/2021).
        </p>
        <Link href={`/mi-reserva/${token}/checkin`} className="pv-btn pv-btn--primary mt-3 inline-flex">
          Completar el check-in
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">Tu llegada y peticiones</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Indícanos a qué hora prevés llegar y cuéntanos cualquier petición (cuna, llegada tardía,
          alergias…).
        </p>
        <div className="pv-card pv-card--pad mt-3">
          <PortalRequestForm token={token} />
        </div>
      </section>
    </div>
  );
}
