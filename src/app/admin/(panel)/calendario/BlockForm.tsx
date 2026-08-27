"use client";

import { useActionState } from "react";

type Result = { ok: true } | { ok: false; error: string } | null;

export function BlockForm({
  propertySlug,
  action,
}: {
  propertySlug: string;
  action: (prev: unknown, formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <label>
        <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Desde</span>
        <input type="date" name="startDate" required className="h-10 rounded-lg border border-[var(--color-line)] px-2" />
      </label>
      <label>
        <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Hasta</span>
        <input type="date" name="endDate" required className="h-10 rounded-lg border border-[var(--color-line)] px-2" />
      </label>
      <label className="flex-1">
        <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Motivo (opcional)</span>
        <input
          type="text"
          name="summary"
          placeholder="Mantenimiento, uso propio…"
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
        />
      </label>
      <button className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-white" disabled={pending}>
        {pending ? "Guardando…" : "Bloquear fechas"}
      </button>
      {state && !state.ok && <p className="w-full text-red-600">{state.error}</p>}
      {state && state.ok && <p className="w-full text-green-700">Bloqueo creado.</p>}
    </form>
  );
}
