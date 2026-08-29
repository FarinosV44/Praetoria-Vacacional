"use client";

import { useActionState, useState } from "react";
import type { InvoiceSettings } from "@/domains/invoicing/types";

type Result = { ok: true } | { ok: false; error: string } | null;

export function InvoiceSettingsForm({
  action,
  propertySlug,
  propertyName,
  settings,
}: {
  action: (prev: unknown, fd: FormData) => Promise<Exclude<Result, null>>;
  propertySlug: string;
  propertyName: string;
  settings: InvoiceSettings;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );
  const [exempt, setExempt] = useState(settings.taxExempt);

  const input = "h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm";
  const label = "mb-1 block text-xs text-[var(--color-ink-soft)]";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <p className="font-medium">{propertyName}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className={label}>Serie</span>
          <input name="series" defaultValue={settings.series} className={`${input} font-mono`} />
        </label>
        <label className="flex items-end gap-2 text-sm">
          <input
            type="checkbox"
            name="taxExempt"
            value="true"
            checked={exempt}
            onChange={(e) => setExempt(e.target.checked)}
          />
          Exenta de IVA por defecto
        </label>
        <label>
          <span className={label}>Tipo de IVA (%)</span>
          <input
            name="taxRate"
            defaultValue={settings.taxRate}
            inputMode="decimal"
            disabled={exempt}
            className={input}
          />
        </label>
      </div>
      <label className="block">
        <span className={label}>Texto fiscal por defecto</span>
        <input name="taxNote" defaultValue={settings.taxNote} className={input} />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-green-700">Guardado.</p>}
      <button
        className="h-9 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
        disabled={pending}
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
