"use client";

import { useActionState, useState } from "react";
import { cancelWithRefundAction } from "@/domains/reservations/actions";
import { computeRefund } from "@/domains/booking/refund";
import type { CancellationTier } from "@/domains/properties/types";

function euros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function CancelWithRefund({
  reservationId,
  code,
  checkIn,
  totalCents,
  tiers,
  policySummary,
}: {
  reservationId: string;
  code: string;
  checkIn: string;
  totalCents: number;
  tiers: CancellationTier[];
  policySummary: string;
}) {
  const [state, action, pending] = useActionState(cancelWithRefundAction, null);
  const [override, setOverride] = useState("");
  const [open, setOpen] = useState(false);

  const computed = computeRefund({ tiers }, checkIn, totalCents);
  const effectiveCents =
    override.trim() === "" ? computed.refundCents : Math.round(Number(override.replace(",", ".")) * 100);

  if (state?.ok) {
    return <p className="mt-4 text-sm text-green-700">Reserva cancelada. Reembolso procesado.</p>;
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button className="admin-btn" data-variant="ghost" type="button" onClick={() => setOpen(true)}>
          Cancelar reserva y reembolsar
        </button>
      ) : (
        <form action={action} className="space-y-3 rounded-lg border border-[var(--color-line)] p-3">
          <input type="hidden" name="id" value={reservationId} />
          <p className="text-xs text-[var(--color-ink-soft)]">{policySummary}</p>
          <p className="text-sm">
            Faltan <strong>{computed.daysBefore}</strong> días para la entrada → reembolso según
            política: <strong>{computed.refundPercent}%</strong> ={" "}
            <strong>{euros(computed.refundCents)}</strong> de {euros(totalCents)}.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
              Motivo
            </span>
            <input
              name="reason"
              defaultValue="Cancelada desde administración"
              className="h-9 w-full rounded-lg border border-[var(--color-line)] px-3 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
              Reembolso a devolver (€) — vacío = según política
            </span>
            <input
              name="overrideRefundEuros"
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              inputMode="decimal"
              placeholder={(computed.refundCents / 100).toString()}
              className="h-9 w-40 rounded-lg border border-[var(--color-line)] px-3 text-sm"
            />
          </label>
          <p className="text-sm">
            Se reembolsarán <strong>{euros(Math.max(0, effectiveCents || 0))}</strong>.
          </p>
          {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <button className="admin-btn" data-variant="danger" type="submit" disabled={pending}>
              {pending ? "Procesando…" : `Cancelar ${code}`}
            </button>
            <button className="admin-btn" data-variant="ghost" type="button" onClick={() => setOpen(false)}>
              No cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
