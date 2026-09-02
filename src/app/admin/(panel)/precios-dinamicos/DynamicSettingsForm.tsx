"use client";

import { useActionState } from "react";
import { saveDynamicPricingSettingsAction } from "@/domains/pricing/dynamic-actions";
import type { DynamicPricingSettings } from "@/domains/pricing/dynamic";

export function DynamicSettingsForm({
  propertySlug,
  settings,
}: {
  propertySlug: string;
  settings: DynamicPricingSettings;
}) {
  const [state, action, pending] = useActionState(saveDynamicPricingSettingsAction, null);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <label className="flex items-center gap-2 text-sm sm:col-span-4">
        <input type="checkbox" name="enabled" defaultChecked={settings.enabled} />
        Aplicar automáticamente cada día
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Precio suelo (€)</span>
        <input
          name="floorEuros"
          type="number"
          step="1"
          defaultValue={settings.floorCents / 100}
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Banda máx. (±%)</span>
        <input
          name="bandPct"
          type="number"
          step="1"
          defaultValue={settings.bandPct}
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Horizonte (días)</span>
        <input
          name="horizonDays"
          type="number"
          step="1"
          defaultValue={settings.horizonDays}
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3"
        />
      </label>
      <div>
        <button className="admin-btn" data-variant="ghost" type="submit" disabled={pending}>
          {pending ? "…" : "Guardar"}
        </button>
      </div>
      {state && !state.ok && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700 sm:col-span-4">{state.message}</p>}
    </form>
  );
}
