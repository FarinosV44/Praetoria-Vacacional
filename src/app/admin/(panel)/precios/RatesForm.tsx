"use client";

import { useActionState } from "react";
import type { RateConfig, StayFee } from "@/domains/pricing/types";
import { resolveStayFees } from "@/domains/pricing/fees";

type Result = { ok: true } | { ok: false; error: string } | null;

const FIELDS: { name: keyof RateConfig; label: string }[] = [
  { name: "baseNightlyCents", label: "Precio base/noche (¢)" },
  { name: "weekendNightlyCents", label: "Precio finde/noche (¢)" },
  { name: "minNights", label: "Estancia mínima" },
  { name: "maxNights", label: "Estancia máxima (0 = sin límite)" },
  { name: "includedGuests", label: "Huéspedes incluidos" },
  { name: "extraGuestNightlyCents", label: "Suplemento huésped/noche (¢)" },
  { name: "maxGuests", label: "Huéspedes máx." },
  { name: "taxPercent", label: "Impuestos (%)" },
  { name: "bookingWindowDays", label: "Ventana de reserva (días)" },
  { name: "leadTimeDays", label: "Antelación mínima (días)" },
];

/** The charges shown in the form: the configured `fees`, or a disabled cleaning row. */
function formFees(config: RateConfig): StayFee[] {
  if (config.fees && config.fees.length) return config.fees;
  const legacy = resolveStayFees(config)[0];
  return [
    legacy ?? {
      key: "cleaning",
      label: "Limpieza",
      enabled: false,
      amountCents: 0,
    },
  ];
}

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
  const fees = formFees(config);

  return (
    <form action={formAction} className="mt-4 space-y-5 text-sm">
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

      <fieldset className="rounded-lg border border-[var(--a-line)] p-3">
        <legend className="px-1 text-xs font-medium text-[var(--a-text-soft)]">
          Reglas de estancia
        </legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="sellExactGaps"
            defaultChecked={config.sellExactGaps !== false}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Vender huecos exactos por debajo de la estancia mínima
            <span className="admin-muted block text-xs">
              Si entre dos reservas queda un hueco que un huésped puede cubrir justo (entra el día
              que sale el anterior y sale el día que entra el siguiente), se permite reservarlo
              aunque sea más corto que el mínimo.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="rounded-lg border border-[var(--color-line)] p-3">
        <legend className="px-1 text-xs font-medium text-[var(--color-ink-soft)]">
          Cargos opcionales
        </legend>
        <p className="mb-3 text-xs text-[var(--color-ink-soft)]">
          Si un cargo no está activado, el huésped no lo ve: no aparece ninguna línea ni en el
          checkout, ni en los correos, ni en las facturas.
        </p>
        <input type="hidden" name="feeCount" value={fees.length} />
        <div className="space-y-3">
          {fees.map((fee, i) => (
            <div
              key={fee.key}
              className="grid items-end gap-2 sm:grid-cols-[auto_1fr_8rem_1fr]"
            >
              <input type="hidden" name={`fee_${i}_key`} value={fee.key} />
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  name={`fee_${i}_enabled`}
                  defaultChecked={fee.enabled}
                  className="h-4 w-4"
                />
                <span className="text-xs">Activado</span>
              </label>
              <label>
                <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Concepto</span>
                <input
                  name={`fee_${i}_label`}
                  defaultValue={fee.label}
                  className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Importe (¢)</span>
                <input
                  type="number"
                  name={`fee_${i}_amount`}
                  defaultValue={fee.amountCents}
                  className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">
                  Descripción (opcional)
                </span>
                <input
                  name={`fee_${i}_description`}
                  defaultValue={fee.description ?? ""}
                  className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2"
                />
              </label>
            </div>
          ))}
        </div>
      </fieldset>

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
