"use client";

import { useActionState } from "react";
import type { PropertyContent } from "@/domains/properties/types";
import type { Segment } from "@/domains/marketing/types";

type Result = { ok: true; id?: string } | { ok: false; error: string } | null;

const CHANNELS = [
  ["direct", "Web directa"],
  ["booking", "Booking.com"],
  ["airbnb", "Airbnb"],
  ["manual", "Manual"],
  ["other", "Otro"],
] as const;

export function SegmentForm({
  action,
  properties,
  segment,
  submitLabel,
}: {
  action: (prev: unknown, fd: FormData) => Promise<Exclude<Result, null>>;
  properties: readonly PropertyContent[];
  segment?: Segment;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (p, fd) => action(p, fd),
    null,
  );
  const c = segment?.criteria ?? {};
  const input = "h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm";
  const label = "mb-1 block text-xs text-[var(--color-ink-soft)]";

  return (
    <form action={formAction} className="space-y-4">
      {segment && <input type="hidden" name="id" value={segment.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={label}>Nombre del segmento</span>
          <input name="name" defaultValue={segment?.name ?? ""} required className={input} />
        </label>
        <label>
          <span className={label}>Descripción (opcional)</span>
          <input name="description" defaultValue={segment?.description ?? ""} className={input} />
        </label>
      </div>

      <fieldset className="rounded-xl border border-[var(--color-line)] p-3">
        <legend className="px-1 text-xs text-[var(--color-ink-soft)]">Criterios (se combinan con Y)</legend>
        <div className="space-y-3">
          <div>
            <p className={label}>Alojamiento(s) visitados</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {properties.map((p) => (
                <label key={p.id} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    name="properties"
                    value={p.id}
                    defaultChecked={c.properties?.includes(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className={label}>Canal de origen</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {CHANNELS.map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    name="channels"
                    value={v}
                    defaultChecked={c.channels?.includes(v as never)}
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className={label}>Idiomas (coma)</span>
              <input name="languages" defaultValue={(c.languages ?? []).join(", ")} className={input} />
            </label>
            <label>
              <span className={label}>Origen</span>
              <select name="origin" defaultValue={c.origin ?? ""} className={input}>
                <option value="">Cualquiera</option>
                <option value="national">Nacionales</option>
                <option value="foreign">Extranjeros</option>
              </select>
            </label>
            <label>
              <span className={label}>Gasto acumulado mínimo (€)</span>
              <input
                name="minTotalEuros"
                inputMode="decimal"
                defaultValue={c.minTotalSpentCents ? c.minTotalSpentCents / 100 : ""}
                className={input}
              />
            </label>
            <label>
              <span className={label}>Última estancia antes de (win-back)</span>
              <input type="date" name="lastStayBefore" defaultValue={c.lastStayBefore ?? ""} className={input} />
            </label>
            <label>
              <span className={label}>Última estancia desde</span>
              <input type="date" name="lastStayAfter" defaultValue={c.lastStayAfter ?? ""} className={input} />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="repeatersOnly" defaultChecked={c.repeatersOnly} /> Solo
              repetidores (≥2)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="couponUsed" defaultChecked={c.couponUsed} /> Han usado cupón
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="consentOnly" defaultChecked={c.consentOnly} /> Solo con
              consentimiento
            </label>
          </div>
        </div>
      </fieldset>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-green-700">Guardado.</p>}
      <button
        className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
        disabled={pending}
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
