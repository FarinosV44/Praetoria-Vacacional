"use client";

import { useActionState } from "react";
import type { RateConfig } from "@/domains/pricing/types";

type Result = { ok: true } | { ok: false; error: string } | null;

const FIELDS: { name: keyof RateConfig; label: string }[] = [
  { name: "baseNightlyCents", label: "Precio base/noche (¢)" },
  { name: "weekendNightlyCents", label: "Precio finde/noche (¢)" },
  { name: "minNights", label: "Estancia mínima" },
  { name: "maxNights", label: "Estancia máxima (0 = sin límite)" },
  { name: "cleaningFeeCents", label: "Limpieza (¢)" },
  { name: "includedGuests", label: "Huéspedes incluidos" },
  { name: "extraGuestNightlyCents", label: "Suplemento huésped/noche (¢)" },
  { name: "maxGuests", label: "Huéspedes máx." },
  { name: "taxPercent", label: "Impuestos (%)" },
  { name: "bookingWindowDays", label: "Ventana de reserva (días)" },
  { name: "leadTimeDays", label: "Antelación mínima (días)" },
];

export function RatesForm({
  propertySlug,
  config,
  action,
}: {
  propertySlug: string;
  config: RateConfig;
  action: (prev: unknown, fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4 text-sm">
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.name}>
            <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">{f.label}</span>
            <input
              type="number"
              name={f.name}
              defaultValue={(config[f.name] as number | undefined) ?? ""}
              className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
            />
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Temporadas (JSON)</span>
        <textarea
          name="seasons"
          rows={6}
          defaultValue={JSON.stringify(config.seasons, null, 2)}
          className="w-full rounded-lg border border-[var(--color-line)] p-2 font-mono text-xs"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Descuentos (JSON)</span>
        <textarea
          name="discounts"
          rows={4}
          defaultValue={JSON.stringify(config.discounts, null, 2)}
          className="w-full rounded-lg border border-[var(--color-line)] p-2 font-mono text-xs"
        />
      </label>

      {state && !state.ok && <p className="text-red-600">{state.error}</p>}
      {state && state.ok && <p className="text-green-700">Guardado. Ya está activo en la web.</p>}

      <button
        className="h-10 rounded-lg bg-[var(--accent-600)] px-4 font-medium text-white"
        disabled={pending}
      >
        {pending ? "Guardando…" : "Guardar precios"}
      </button>
    </form>
  );
}
