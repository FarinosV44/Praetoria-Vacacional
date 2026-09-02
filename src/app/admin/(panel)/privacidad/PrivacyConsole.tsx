"use client";

import { useActionState, useState } from "react";
import {
  eraseSubjectAction,
  exportSubjectAction,
  previewSubjectAction,
} from "@/domains/privacy/actions";

const ACTION_LABEL: Record<string, string> = {
  keep: "Conservar",
  anonymize: "Anonimizar",
  delete: "Eliminar",
};

export function PrivacyConsole() {
  const [preview, previewAction, previewing] = useActionState(previewSubjectAction, null);
  const [erase, eraseAction, erasing] = useActionState(eraseSubjectAction, null);
  const [email, setEmail] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function downloadExport() {
    setExporting(true);
    setExportError(null);
    const fd = new FormData();
    fd.set("email", email);
    const res = await exportSubjectAction(null, fd);
    setExporting(false);
    if (!res.ok) {
      setExportError(res.error);
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datos-${email.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-3 space-y-4">
      <form action={previewAction} className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Correo</span>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-72 rounded-lg border border-[var(--color-line)] px-3"
            placeholder="huesped@ejemplo.com"
          />
        </label>
        <button className="admin-btn" data-variant="primary" type="submit" disabled={previewing}>
          {previewing ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {preview && !preview.ok && <p className="text-sm text-red-600">{preview.error}</p>}

      {preview?.ok && !preview.found && (
        <p className="text-sm text-[var(--color-ink-soft)]">No hay datos asociados a ese correo.</p>
      )}

      {preview?.ok && preview.found && preview.plan && (
        <div className="space-y-3">
          <p className="text-sm">
            {preview.counts?.customer ? "Ficha de cliente · " : ""}
            {preview.counts?.reservations} reserva(s) · {preview.counts?.invoices} factura(s) ·{" "}
            {preview.counts?.messages} comunicación(es).
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              className="admin-btn"
              data-variant="ghost"
              type="button"
              onClick={downloadExport}
              disabled={exporting}
            >
              {exporting ? "Generando…" : "Descargar datos (JSON)"}
            </button>
          </div>
          {exportError && <p className="text-sm text-red-600">{exportError}</p>}

          <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-3 py-2">Registro</th>
                  <th className="px-3 py-2">Acción</th>
                  <th className="px-3 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {preview.plan.items.map((it) => (
                  <tr key={`${it.type}-${it.id}`} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="px-3 py-2">{it.label}</td>
                    <td className="px-3 py-2">{ACTION_LABEL[it.action] ?? it.action}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-ink-soft)]">{it.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.plan.blockedReasons.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-medium">Conservación parcial obligatoria:</p>
              <ul className="mt-1 list-disc pl-4">
                {preview.plan.blockedReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <form action={eraseAction} className="flex flex-wrap items-end gap-2 border-t border-[var(--color-line)] pt-3">
            <input type="hidden" name="email" value={email} />
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
                Escribe BORRAR para confirmar la supresión
              </span>
              <input
                name="confirm"
                required
                className="h-10 w-40 rounded-lg border border-[var(--color-line)] px-3"
                placeholder="BORRAR"
              />
            </label>
            <button className="admin-btn" data-variant="danger" type="submit" disabled={erasing}>
              {erasing ? "Aplicando…" : "Aplicar supresión"}
            </button>
          </form>
          {erase && !erase.ok && <p className="text-sm text-red-600">{erase.error}</p>}
          {erase?.ok && <p className="text-sm text-green-700">{erase.message}</p>}
        </div>
      )}
    </div>
  );
}
