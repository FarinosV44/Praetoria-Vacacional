"use client";

import { useActionState } from "react";
import { submitPortalRequestAction } from "@/domains/portal/actions";

export function PortalRequestForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(submitPortalRequestAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Hora de llegada prevista</span>
        <input
          name="arrivalTime"
          placeholder="p. ej. 18:30"
          className="h-10 w-40 rounded-xl border border-[var(--color-line)] px-3"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Peticiones o comentarios</span>
        <textarea
          name="message"
          rows={3}
          className="w-full rounded-xl border border-[var(--color-line)] p-3"
        />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">{state.message}</p>}
      <button type="submit" className="pv-btn pv-btn--primary" disabled={pending}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}
