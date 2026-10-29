"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Report {
  property: string;
  channel: string;
  status: "ok" | "skipped" | "error";
  created: number;
  removed?: number;
  linkedCreated?: number;
  linkedCancelled?: number;
  conflicts?: { reservationCode: string }[];
  error?: string;
}

const CHANNEL: Record<string, string> = { booking: "Booking", airbnb: "Airbnb" };

/**
 * One tap: imports the Booking.com and Airbnb iCal feeds of every apartment
 * (POST /api/admin/sync without `property`, admin-session guarded) and shows a
 * plain summary. With `autoRun` it starts on mount — that is what makes
 * /admin/sincronizar a "quick link" (bookmark, home-screen shortcut).
 */
export function SyncAllButton({
  propertyNames,
  autoRun = false,
}: {
  propertyNames: Record<string, string>;
  autoRun?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? `Error ${res.status}`);
      } else {
        setReports((data.reports ?? []) as Report[]);
        setDoneAt(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
        router.refresh();
      }
    } catch {
      setErr("Sin conexión. Vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (autoRun && !started.current) {
      started.current = true;
      void run();
    }
  }, [autoRun, run]);

  const errors = reports?.filter((r) => r.status === "error") ?? [];
  const conflicts = reports?.flatMap((r) => r.conflicts ?? []) ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="admin-btn w-full py-4 text-base"
        data-variant="primary"
        aria-live="polite"
      >
        {busy ? "Sincronizando Booking y Airbnb…" : "↻ Sincronizar Booking y Airbnb"}
      </button>

      {err && <p className="mt-2 text-sm text-red-700">No se pudo sincronizar: {err}</p>}

      {reports && !busy && (
        <div className="mt-3 text-sm">
          <p className="font-semibold">
            {reports.length > 0 && reports.every((r) => r.status === "skipped")
              ? "No hay enlaces iCal configurados"
              : errors.length === 0
                ? "✓ Calendarios sincronizados"
                : "Sincronizado con avisos"}
            {doneAt ? ` · ${doneAt}` : ""}
          </p>
          <ul className="mt-1 space-y-0.5 text-[var(--a-text-soft,#555)]">
            {reports.map((r, i) => (
              <li key={i} className={r.status === "error" ? "text-red-700" : undefined}>
                {propertyNames[r.property] ?? r.property} · {CHANNEL[r.channel] ?? r.channel}:{" "}
                {r.status === "ok"
                  ? r.created || r.removed || r.linkedCreated || r.linkedCancelled
                    ? [
                        r.linkedCreated ? `${r.linkedCreated} reserva(s) nueva(s)` : null,
                        r.linkedCancelled ? `${r.linkedCancelled} cancelada(s)` : null,
                        r.created && !r.linkedCreated ? `${r.created} bloqueo(s) nuevo(s)` : null,
                        r.removed && !r.linkedCancelled ? `${r.removed} liberado(s)` : null,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : "sin cambios"
                  : r.status === "skipped"
                    ? "sin enlace iCal configurado"
                    : `error — ${r.error ?? "desconocido"}`}
              </li>
            ))}
          </ul>
          {conflicts.length > 0 && (
            <p className="mt-2 font-semibold text-red-700">
              ⚠ {conflicts.length} choque(s) con reservas directas:{" "}
              {conflicts.map((c) => c.reservationCode).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
