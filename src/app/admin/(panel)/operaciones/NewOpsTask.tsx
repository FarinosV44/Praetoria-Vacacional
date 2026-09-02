"use client";

import { useActionState } from "react";
import { createOpsTaskAction } from "@/domains/operations/actions";

export function NewOpsTask({ properties }: { properties: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createOpsTaskAction, null);

  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Alojamiento</span>
        <select name="propertySlug" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2">
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Tipo</span>
        <select name="kind" defaultValue="maintenance" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2">
          <option value="cleaning">Limpieza</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="incident">Incidencia</option>
          <option value="turnover">Cambio de huésped</option>
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Título</span>
        <input name="title" required className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3" />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Descripción</span>
        <textarea name="description" rows={2} className="w-full rounded-lg border border-[var(--color-line)] p-2" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Prioridad</span>
        <select name="priority" defaultValue="normal" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2">
          <option value="low">Baja</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Fecha límite</span>
        <input type="date" name="dueDate" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-2" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Asignada a</span>
        <input name="assignee" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Coste estimado (€)</span>
        <input name="costEuros" inputMode="decimal" className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3" />
      </label>
      <div className="sm:col-span-2">
        <button className="admin-btn" data-variant="primary" type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear tarea"}
        </button>
        {state && !state.ok && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="ml-3 text-sm text-green-700">Creada.</span>}
      </div>
    </form>
  );
}
