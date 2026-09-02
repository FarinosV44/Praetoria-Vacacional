import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { env, DEMO_MODE } from "@/lib/env";
import { summarizeJobs } from "@/domains/jobs/metrics";
import type { JobStatus } from "@/domains/jobs/types";
import { retryJobAction, cancelJobAction, runJobsNowAction } from "@/domains/admin/actions";

export const metadata = { title: "Procesos" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "En cola",
  running: "Ejecutando",
  retrying: "Reintentando",
  succeeded: "Completado",
  dead_letter: "Fallido (atascado)",
  cancelled: "Cancelado",
};

const STATUS_TONE: Record<JobStatus, string> = {
  queued: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-800",
  retrying: "bg-amber-100 text-amber-900",
  succeeded: "bg-green-100 text-green-800",
  dead_letter: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-500",
};

const TYPE_LABEL: Record<string, string> = {
  "email.reservation_confirmation": "Email · confirmación de reserva",
  "email.payment_failed": "Email · pago fallido",
  "email.internal_notice": "Email · aviso interno",
  "ical.import": "Sincronización iCal",
  "holds.expire": "Expiración de reservas retenidas",
};

function ago(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const m = Math.round(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export default async function ProcesosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const repo = getRepository();
  const all = await repo.listJobs({ limit: 300 });
  const metrics = summarizeJobs(all);

  const filtered = estado
    ? all.filter((j) => j.status === estado)
    : all;

  const oldestMin = Math.round(metrics.oldestPendingAgeMs / 60000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Procesos en segundo plano</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Cola duradera de trabajo asíncrono crítico (issue #76): correos de reserva, sincronización
          de calendarios y expiración de reservas retenidas. La intención se guarda en la misma
          operación que la reserva, así que una caída del servidor no puede perder un correo de
          confirmación; los fallos temporales se reintentan con espera creciente.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "En cola / activos", value: metrics.pending },
          { label: "Trabajo más antiguo sin procesar", value: oldestMin ? `${oldestMin} min` : "—" },
          { label: "Fallidos (atascados)", value: metrics.deadLetter },
          { label: "Tasa de error", value: `${Math.round(metrics.errorRate * 100)}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
            <p className="text-xs text-[var(--color-ink-soft)]">{m.label}</p>
            <p className="mt-1 text-xl font-semibold">{m.value}</p>
          </div>
        ))}
      </div>

      {metrics.needsAttention && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Hay trabajos que necesitan atención: revisa los marcados como{" "}
          <strong>Fallido (atascado)</strong> y usa «Reintentar» cuando la causa esté resuelta.
        </div>
      )}

      {DEMO_MODE ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Modo demostración.</strong> La cola vive en memoria y se reinicia con el servidor.
          En producción (Supabase) sobrevive a los redespliegues y un cron la procesa cada 2 minutos.
        </div>
      ) : !env.CRON_SECRET ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Falta <code>CRON_SECRET</code>.</strong> Sin él, el cron{" "}
          <code>/api/cron/jobs</code> no puede ejecutarse y la cola solo avanza de forma
          oportunista (al confirmarse una reserva). Defínelo en el panel de hosting.
        </div>
      ) : null}

      {/* Filter + run */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/admin/procesos"
          className={`rounded-full px-3 py-1 ${!estado ? "bg-[var(--a-accent)] text-white" : "bg-slate-100"}`}
        >
          Todos ({all.length})
        </Link>
        {(Object.keys(STATUS_LABEL) as JobStatus[]).map((s) => {
          const n = metrics.byStatus[s];
          if (!n) return null;
          return (
            <Link
              key={s}
              href={`/admin/procesos?estado=${s}`}
              className={`rounded-full px-3 py-1 ${estado === s ? "bg-[var(--a-accent)] text-white" : "bg-slate-100"}`}
            >
              {STATUS_LABEL[s]} ({n})
            </Link>
          );
        })}
        <form action={runJobsNowAction} className="ml-auto">
          <button className="admin-btn" data-variant="ghost" type="submit">
            Procesar ahora
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Intentos</th>
              <th className="p-3">Próx. ejecución</th>
              <th className="p-3">Creado</th>
              <th className="p-3">Último error</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--color-ink-soft)]">
                  Sin procesos {estado ? "en este estado" : "todavía"}.
                </td>
              </tr>
            )}
            {filtered.map((job) => {
              const canRetry = job.status === "dead_letter" || job.status === "retrying";
              const canCancel =
                job.status === "queued" || job.status === "retrying" || job.status === "running";
              return (
                <tr key={job.id} className="align-top">
                  <td className="p-3">
                    {TYPE_LABEL[job.type] ?? job.type}
                    {job.payload?.reservationId ? (
                      <span className="block text-xs text-[var(--color-ink-soft)]">
                        reserva {String(job.payload.reservationId).slice(0, 8)}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[job.status]}`}
                    >
                      {STATUS_LABEL[job.status]}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {job.attempts}/{job.maxAttempts}
                  </td>
                  <td className="p-3 text-xs">
                    {job.status === "retrying" || job.status === "queued"
                      ? new Date(job.runAfter).toLocaleString("es-ES")
                      : "—"}
                  </td>
                  <td className="p-3 text-xs">{ago(job.createdAt)}</td>
                  <td className="p-3 text-xs text-red-700">
                    {job.lastError ? (
                      <span className="line-clamp-2 max-w-xs">{job.lastError}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {canRetry && (
                        <form action={retryJobAction}>
                          <input type="hidden" name="id" value={job.id} />
                          <button className="admin-btn" data-variant="ghost" type="submit">
                            Reintentar
                          </button>
                        </form>
                      )}
                      {canCancel && (
                        <form action={cancelJobAction}>
                          <input type="hidden" name="id" value={job.id} />
                          <button className="admin-btn" data-variant="ghost" type="submit">
                            Cancelar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
