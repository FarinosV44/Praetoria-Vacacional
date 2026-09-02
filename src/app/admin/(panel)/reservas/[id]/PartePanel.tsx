"use client";

import { useActionState, useState } from "react";
import { markParteSentAction, submitParteAction } from "@/domains/registry/actions";
import { getReservationParteAction } from "@/domains/registry/download-action";
import { registryStatus } from "@/domains/registry/parte";
import type { Traveller } from "@/domains/registry/types";

export function PartePanel({
  reservationId,
  code,
  guests,
  checkIn,
  travellers,
}: {
  reservationId: string;
  code: string;
  guests: number;
  checkIn: string;
  travellers: Traveller[];
}) {
  const status = registryStatus(travellers, guests, checkIn);
  const [submitState, submit, submitting] = useActionState(submitParteAction, null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    const res = await getReservationParteAction(reservationId);
    setDownloading(false);
    if (!res.ok) return;
    const blob = new Blob([JSON.stringify(res.parte, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parte-viajeros-${code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-card p-4">
      <h2 className="mb-2 text-sm font-semibold">Parte de viajeros (SES.HOSPEDAJES)</h2>
      <p className="admin-muted text-sm">
        {status.sent
          ? `Enviado (${travellers.length} viajeros).`
          : status.complete
            ? `Completo: ${travellers.length}/${guests}, sin enviar.`
            : `Faltan ${status.missing} viajero(s)${status.invalid ? ` · ${status.invalid} con datos incompletos` : ""}. El huésped los añade desde el check-in online.`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="admin-btn" data-variant="ghost" type="button" onClick={download} disabled={downloading}>
          {downloading ? "…" : "Descargar parte (JSON)"}
        </button>
        {!status.sent && status.complete && (
          <>
            <form action={submit}>
              <input type="hidden" name="reservationId" value={reservationId} />
              <button className="admin-btn" data-variant="primary" type="submit" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar a SES.HOSPEDAJES"}
              </button>
            </form>
            <form action={markParteSentAction}>
              <input type="hidden" name="reservationId" value={reservationId} />
              <input type="hidden" name="ref" value="manual" />
              <button className="admin-btn" data-variant="ghost" type="submit">
                Marcar como enviado (manual)
              </button>
            </form>
          </>
        )}
      </div>
      {submitState && !submitState.ok && (
        <p className="mt-2 text-sm text-red-600">{submitState.error}</p>
      )}
      {submitState?.ok && <p className="mt-2 text-sm text-green-700">Enviado. Ref: {submitState.ref}</p>}
    </section>
  );
}
