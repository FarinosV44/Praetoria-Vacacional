import Link from "next/link";
import { requireOwner } from "@/domains/tramites/context";
import { attention, portalSnapshot } from "@/domains/tramites/portal-data";
import { EVENT_LABEL } from "@/domains/tramites/deadlines";
import { isOpen } from "@/domains/tramites/workflow";
import { OwnerStatusBadge, EmptyState, fmtDate, fmtDateTime } from "@/components/tramites/ui";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Resumen" };
export const dynamic = "force-dynamic";

export default async function CarpetaResumen() {
  const ctx = await requireOwner();
  const snap = await portalSnapshot(ctx);
  const a = attention(snap);
  const open = snap.filings.filter((f) => isOpen(f.status));
  const recent = [...snap.filings].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)).slice(0, 5);
  const todo =
    a.unpaid.length + a.docsPending.length + a.reportsMissingData.length + a.deadlines.length + a.unpaidReports.length;

  return (
    <div className="space-y-10">
      <section aria-labelledby="todo-h">
        <h1 id="todo-h" className="text-2xl font-semibold">
          {todo === 0 ? "Todo en orden" : `Tienes ${todo} ${todo === 1 ? "asunto pendiente" : "asuntos pendientes"}`}
        </h1>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {a.unpaid.map((o) => (
            <Todo key={o.id} href={`/mi-cuenta/tramites/pagos/${o.id}`} tone="warn" title={`Pago pendiente · ${o.reference}`}>
              {formatMoney(o.totalCents)} IVA incluido. Empezamos cuando el pago está confirmado.
            </Todo>
          ))}
          {a.docsPending.map((f) => (
            <Todo key={f.id} href={`/mi-cuenta/tramites/expedientes/${f.id}`} tone="warn" title={`Falta documentación · ${f.title}`}>
              {f.requestedDocuments.length > 0 ? `Nos faltan ${f.requestedDocuments.length} documento(s).` : "Revisa lo que te hemos pedido."}
            </Todo>
          ))}
          {a.unpaidReports.length > 0 && (
            <Todo href="/mi-cuenta/tramites/pagos" tone="warn" title="Sin saldo de reservas">
              Tienes {a.unpaidReports.length} reserva(s) sin saldo. Amplíalo para que podamos tramitarlas.
            </Todo>
          )}
          {a.deadlines.map(({ r, n }) => (
            <Todo key={r.id} href={`/mi-cuenta/tramites/reservas/${r.id}`} tone={n!.state === "vencido" ? "danger" : "warn"} title={`${EVENT_LABEL[n!.event]} · entrada ${fmtDate(r.checkIn)}`}>
              {n!.state === "vencido" ? "El plazo de 24 horas ha pasado." : `Vence el ${fmtDateTime(n!.due!.toISOString())}.`}
            </Todo>
          ))}
          {a.reportsMissingData.map((r) => (
            <Todo key={r.id} href={`/mi-cuenta/tramites/reservas/${r.id}`} tone="info" title={`Datos de viajeros · entrada ${fmtDate(r.checkIn)}`}>
              Envíanos los datos de los viajeros antes de su llegada.
            </Todo>
          ))}
        </ul>
        {todo === 0 && (
          <p className="mt-2 text-[var(--color-ink-soft)]">No hay nada que necesitemos de ti ahora mismo.</p>
        )}
      </section>

      <section aria-labelledby="quick-h" className="flex flex-wrap gap-3">
        <h2 id="quick-h" className="sr-only">Acciones rápidas</h2>
        <Link href="/mi-cuenta/tramites/reservas/nueva" className="pv-btn pv-btn--ink">
          Comunicar una reserva
        </Link>
        <Link href="/mi-cuenta/tramites/documentos" className="pv-btn pv-btn--ghost">
          Subir un documento
        </Link>
        <Link href="/mi-cuenta/tramites/mensajes" className="pv-btn pv-btn--ghost">
          Escribirnos
        </Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="props-h">
          <div className="flex items-baseline justify-between">
            <h2 id="props-h" className="text-lg font-semibold">Tus viviendas</h2>
            <span className="text-sm text-[var(--color-ink-soft)]">Saldo: {ctx.account.reservationCredits} reservas</span>
          </div>
          {snap.properties.length === 0 ? (
            <EmptyState>Aún no tienes viviendas.</EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
              {snap.properties.map((p) => {
                const pf = open.filter((f) => f.propertyId === p.id);
                return (
                  <li key={p.id}>
                    <Link href={`/mi-cuenta/tramites/viviendas/${p.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-[var(--color-paper)]">
                      <span>
                        <span className="font-semibold">{p.alias}</span>
                        <span className="block text-sm text-[var(--color-ink-soft)]">{p.municipality}</span>
                      </span>
                      <span className="text-sm text-[var(--color-ink-soft)]">
                        {pf.length === 0 ? "Sin trámites abiertos" : `${pf.length} en curso`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="text-lg font-semibold">Trámites recientes</h2>
          {recent.length === 0 ? (
            <EmptyState>Cuando contrates un servicio o nos comuniques una reserva, aparecerá aquí.</EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
              {recent.map((f) => (
                <li key={f.id}>
                  <Link href={`/mi-cuenta/tramites/expedientes/${f.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-[var(--color-paper)]">
                    <span>
                      <span className="font-medium">{f.title}</span>
                      <span className="block text-xs text-[var(--color-ink-faint)]">
                        {f.reference} · actualizado {fmtDateTime(f.updatedAt)}
                      </span>
                    </span>
                    <OwnerStatusBadge status={f.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Todo({ href, title, tone, children }: { href: string; title: string; tone: "warn" | "info" | "danger"; children: React.ReactNode }) {
  const bar = tone === "danger" ? "border-l-[var(--color-danger)]" : tone === "warn" ? "border-l-[var(--color-warning)]" : "border-l-[var(--color-sea-500)]";
  return (
    <li>
      <Link href={href} className={`block h-full rounded-[var(--radius-md)] border border-l-4 border-[var(--color-line)] ${bar} bg-white p-4 hover:bg-[var(--color-paper)]`}>
        <span className="font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">{children}</span>
      </Link>
    </li>
  );
}
