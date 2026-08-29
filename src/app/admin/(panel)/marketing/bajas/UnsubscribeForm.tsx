"use client";

import { useActionState } from "react";
import { addUnsubscribeAction } from "@/domains/marketing/actions";

type Result = { ok: true } | { ok: false; error: string } | null;

export function UnsubscribeForm() {
  const [state, action, pending] = useActionState<Result, FormData>(
    (p, fd) => addUnsubscribeAction(p, fd),
    null,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Email a dar de baja</span>
        <input
          name="email"
          type="email"
          required
          className="h-9 w-72 rounded-lg border border-[var(--color-line)] px-2 text-sm"
        />
      </label>
      <button
        className="h-9 rounded-lg bg-[var(--accent-600)] px-4 text-sm text-white"
        disabled={pending}
      >
        Dar de baja
      </button>
      {state && !state.ok && <span className="text-sm text-red-600">{state.error}</span>}
      {state && state.ok && <span className="text-sm text-green-700">Hecho.</span>}
    </form>
  );
}
