"use client";

import { useState } from "react";
import { sendCampaignAction } from "@/domains/marketing/actions";

/**
 * Double-confirmation send. Real bulk sending is not wired: this records the
 * send intent and marks recipients skipped. The admin must type ENVIAR.
 */
export function SendCampaignForm({ campaignId, recipients }: { campaignId: string; recipients: number }) {
  const [value, setValue] = useState("");
  return (
    <form action={sendCampaignAction} className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
      <input type="hidden" name="id" value={campaignId} />
      <p className="font-medium text-amber-900">Enviar la campaña ({recipients} destinatarios)</p>
      <p className="text-amber-800">
        El envío masivo real todavía no está configurado. Al confirmar se registra la intención de
        envío y la campaña queda marcada como enviada; los destinatarios se marcan como no enviados.
        Para evitar envíos accidentales, escribe <strong>ENVIAR</strong> para confirmar.
      </p>
      <input
        name="confirm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ENVIAR"
        className="h-9 w-40 rounded-lg border border-[var(--color-line)] px-2"
      />
      <button
        className="h-9 rounded-lg bg-amber-700 px-4 text-white disabled:opacity-50"
        disabled={value !== "ENVIAR"}
      >
        Confirmar envío
      </button>
    </form>
  );
}
