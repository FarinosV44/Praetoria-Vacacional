"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Triggers an on-demand iCal import for one property via /api/admin/sync
 *  (guarded by the admin session, not the cron token). */
export function RunSyncButton({ propertySlug }: { propertySlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/sync?property=${propertySlug}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Error");
      else {
        setMsg("Sincronización lanzada");
        router.refresh();
      }
    } catch {
      setMsg("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-[var(--color-ink-soft)]">{msg}</span>}
      <button
        onClick={run}
        disabled={busy}
        className="h-9 rounded-full px-3 text-xs font-medium ring-1 ring-[var(--color-line)] hover:bg-[var(--accent-50)]"
      >
        {busy ? "Sincronizando…" : "Sincronizar ahora"}
      </button>
    </div>
  );
}
