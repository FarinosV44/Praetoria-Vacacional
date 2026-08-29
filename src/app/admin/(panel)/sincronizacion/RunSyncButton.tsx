"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Report {
  channel: string;
  status: "ok" | "skipped" | "error";
  created: number;
  removed?: number;
  kept?: number;
  linkedCreated?: number;
  error?: string;
}

/** Triggers an on-demand iCal import for one property via /api/admin/sync
 *  (guarded by the admin session). Uses the URL persisted in the database. */
export function RunSyncButton({ propertySlug }: { propertySlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    setReports(null);
    try {
      const res = await fetch(`/api/admin/sync?property=${propertySlug}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Error");
      } else {
        setReports((data.reports ?? []) as Report[]);
        router.refresh();
      }
    } catch {
      setErr("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={busy}
        className="h-9 rounded-full px-3 text-xs font-medium ring-1 ring-[var(--color-line)] hover:bg-[var(--accent-50)] disabled:opacity-60"
      >
        {busy ? "Sincronizando…" : "Sincronizar ahora"}
      </button>
      {err && <span className="text-xs text-red-700">{err}</span>}
      {reports?.map((r, i) => (
        <span
          key={i}
          className={`text-xs ${r.status === "error" ? "text-red-700" : "text-[var(--color-ink-soft)]"}`}
        >
          {r.channel}:{" "}
          {r.status === "ok"
            ? `${r.created} nuevos${r.linkedCreated ? `, ${r.linkedCreated} reservas` : ""}`
            : r.status === "skipped"
              ? "sin URL configurada"
              : `error — ${r.error ?? ""}`}
        </span>
      ))}
    </div>
  );
}
