"use client";

import { useActionState, useState } from "react";
import { deleteOpsTaskAction, updateOpsTaskAction } from "@/domains/operations/actions";
import {
  KIND_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type OpsPriority,
  type OpsStatus,
  type OpsTask,
} from "@/domains/operations/types";

const STATUSES: OpsStatus[] = ["open", "scheduled", "in_progress", "done", "cancelled"];
const PRIORITIES: OpsPriority[] = ["low", "normal", "high", "urgent"];
const PR_TONE: Record<OpsPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-slate-100 text-slate-700",
  high: "bg-amber-100 text-amber-900",
  urgent: "bg-red-100 text-red-800",
};

export function OpsTaskRow({ task, propertyName }: { task: OpsTask; propertyName: string }) {
  const [state, action, pending] = useActionState(updateOpsTaskAction, null);
  const [open, setOpen] = useState(false);
  const done = task.status === "done" || task.status === "cancelled";

  return (
    <div className={`rounded-xl border border-[var(--color-line)] bg-white p-4 ${done ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--color-ink-faint)]">{KIND_LABEL[task.kind]}</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${PR_TONE[task.priority]}`}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            {task.dueDate && (
              <span className="text-xs text-[var(--color-ink-soft)]">vence {task.dueDate}</span>
            )}
          </div>
          <p className="mt-1 font-medium">{task.title}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {propertyName}
            {task.assignee ? ` · ${task.assignee}` : ""}
            {task.costCents != null ? ` · ${(task.costCents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}` : ""}
          </p>
          {task.description && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{task.description}</p>}
          {task.photos.length > 0 && (
            <div className="mt-2 flex gap-2">
              {task.photos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-14 w-14 rounded object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <form action={action} className="flex items-center gap-1">
            <input type="hidden" name="id" value={task.id} />
            <select
              name="status"
              defaultValue={task.status}
              className="rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button className="admin-btn" data-variant="ghost" type="submit" disabled={pending}>
              OK
            </button>
          </form>
          <button className="admin-btn" data-variant="ghost" type="button" onClick={() => setOpen(!open)}>
            {open ? "−" : "Editar"}
          </button>
        </div>
      </div>

      {open && (
        <form action={action} className="mt-3 grid gap-2 border-t border-[var(--color-line)] pt-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={task.id} />
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Prioridad</span>
            <select name="priority" defaultValue={task.priority} className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Fecha límite</span>
            <input type="date" name="dueDate" defaultValue={task.dueDate ?? ""} className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Asignada a</span>
            <input name="assignee" defaultValue={task.assignee ?? ""} className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Coste (€)</span>
            <input name="costEuros" inputMode="decimal" defaultValue={task.costCents != null ? String(task.costCents / 100) : ""} className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2" />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Foto (URL de la biblioteca de medios)</span>
            <input name="addPhoto" type="url" className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2" />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="mb-1 block text-[var(--color-ink-soft)]">Descripción</span>
            <textarea name="description" defaultValue={task.description} rows={2} className="w-full rounded-lg border border-[var(--color-line)] p-2" />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="admin-btn" data-variant="primary" type="submit" disabled={pending}>
              Guardar
            </button>
          </div>
        </form>
      )}
      {state && !state.ok && <p className="mt-1 text-xs text-red-600">{state.error}</p>}

      {open && (
        <form action={deleteOpsTaskAction} className="mt-2">
          <input type="hidden" name="id" value={task.id} />
          <button className="admin-btn" data-variant="ghost" type="submit">
            Eliminar tarea
          </button>
        </form>
      )}
    </div>
  );
}
