"use client";

import { useActionState } from "react";
import { requestPortalLinkAction } from "@/domains/portal/actions";

export function RequestLinkForm() {
  const [state, action, pending] = useActionState(requestPortalLinkAction, null);

  if (state?.ok && state.message) {
    return <p className="text-sm text-[var(--color-ink)]">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Localizador</span>
        <input
          name="code"
          required
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-[var(--color-line)] px-3 uppercase"
          placeholder="PV-XXXXXX"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Correo de la reserva</span>
        <input
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-xl border border-[var(--color-line)] px-3"
        />
      </label>
      <button type="submit" className="pv-btn pv-btn--primary w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace de acceso"}
      </button>
    </form>
  );
}
