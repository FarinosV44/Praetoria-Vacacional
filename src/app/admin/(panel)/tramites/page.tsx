import Link from "next/link";
import { serverStore } from "@/domains/tramites/repo";
import { nextPending, EVENT_LABEL } from "@/domains/tramites/deadlines";
import { isOpen, needsAttention, STATUS_LABEL } from "@/domains/tramites/workflow";
import { FILING_STATUSES, type FilingStatus } from "@/domains/tramites/types";
import { contratacionActiva } from "@/domains/tramites/gate";
import { getRepository } from "@/lib/repository";
import { AdminStatusBadge, fmtDate, fmtDateTime } from "@/components/tramites/ui";
import { TramitesTabs } from "./tabs";

export const metadata = { title: "Servicios a propietarios" };
export const dynamic = "force-dynamic";

type Search = { estado?: string; q?: string; vista?: string };

export default async function TramitesInbox({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const store = serverStore();
  const [accounts, properties, filings, reports, orders, leads] = await Promise.all([
    store.listAccounts(),
    store.listProperties(),
    store.listFilings(),
    store.listReports(),
    store.listOrders(),
    getRepository()
      .listContentOverrides("lead:tramites:")
      .catch(() => []),
  ]);
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const unread = (
    await Promise.all(
      accounts.map(async (a) =>
        (await store.listMessages(a.id)).filter((m) => m.author === "owner" && !m.readByAdminAt),
      ),
    )
  ).flat();

  const now = new Date();
  const deadlines = reports
    .map((r) => ({ r, n: nextPending(r, now) }))
    .filter((x) => x.n && (x.n.state === "vencido" || x.n.state === "vence_pronto"))
    .sort((a, b) => a.n!.due!.getTime() - b.n!.due!.getTime());
  const open = filings.filter((f) => isOpen(f.status));
  const docsPending = open.filter((f) => needsAttention(f));
  const late = open.filter((f) => f.late);
  const unpaid = orders.filter((o) => o.status === "pendiente_pago");
  const special = orders.filter((o) => o.status === "solicitud_especial");
  const newLeads = leads.filter((l) => (l.value as { status?: string })?.status === "nuevo").length;

  const estado = (FILING_STATUSES as readonly string[]).includes(sp.estado ?? "")
    ? (sp.estado as FilingStatus)
    : null;
  const q = (sp.q ?? "").trim().toLowerCase();
  let list = sp.vista === "todos" ? filings : open;
  if (estado) list = list.filter((f) => f.status === estado);
  if (q)
    list = list.filter((f) => {
      const a = accountById.get(f.accountId);
      const p = propertyById.get(f.propertyId);
      return [f.reference, f.title, a?.legalName, a?.email, p?.alias, p?.municipality].some((v) =>
        v?.toLowerCase().includes(q),
      );
    });
  list = [...list].sort(
    (a, b) =>
      (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9") || b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Servicios a propietarios</h1>
        <p className="admin-muted mt-1 text-sm">
          Gestión de trámites para viviendas turísticas de clientes.{" "}
          {contratacionActiva() ? (
            <span className="admin-chip" data-tone="ok">
              Contratación online activa
            </span>
          ) : (
            <span className="admin-chip" data-tone="warn">
              Contratación online desactivada · solo prealtas
            </span>
          )}
        </p>
      </div>
      <TramitesTabs current="bandeja" />

      <section aria-label="Avisos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          tone={
            deadlines.some((d) => d.n!.state === "vencido")
              ? "danger"
              : deadlines.length
                ? "warn"
                : "ok"
          }
          label="Plazos de 24 h"
          value={deadlines.length}
          hint="vencidos o a menos de 8 h"
        />
        <Stat
          tone={docsPending.length ? "warn" : "ok"}
          label="Falta documentación"
          value={docsPending.length}
          hint="esperando al cliente"
        />
        <Stat
          tone={unread.length ? "warn" : "ok"}
          label="Mensajes sin leer"
          value={unread.length}
          hint="de clientes"
        />
        <Stat
          tone={late.length ? "danger" : "ok"}
          label="Fuera de plazo"
          value={late.length}
          hint="revisión manual"
        />
        <Stat tone="neutral" label="Expedientes abiertos" value={open.length} />
        <Stat
          tone={unpaid.length ? "warn" : "neutral"}
          label="Pagos pendientes"
          value={unpaid.length}
        />
        <Stat
          tone={special.length ? "warn" : "neutral"}
          label="Presupuestos a preparar"
          value={special.length}
        />
        <Stat
          tone={newLeads ? "warn" : "neutral"}
          label="Prealtas nuevas"
          value={newLeads}
          href="/admin/tramites/solicitudes"
        />
      </section>

      {deadlines.length > 0 && (
        <section className="admin-card p-4">
          <h2 className="font-semibold">Comunicaciones que vencen</h2>
          <p className="admin-muted mt-1 text-xs">
            El plazo legal es de 24 horas desde cada hecho (RD 933/2021). Presentar tarde no borra
            el incumplimiento: queda anotado.
          </p>
          <ul className="mt-3 divide-y divide-[var(--a-line-soft)] text-sm">
            {deadlines.slice(0, 12).map(({ r, n }) => {
              const filing = filings.find((f) => f.reservationReportId === r.id);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span
                      className="admin-chip"
                      data-tone={n!.state === "vencido" ? "danger" : "warn"}
                    >
                      {n!.state === "vencido" ? "Vencido" : "Vence pronto"}
                    </span>{" "}
                    <strong>{EVENT_LABEL[n!.event]}</strong> ·{" "}
                    {propertyById.get(r.propertyId)?.alias ?? "—"} · entrada {fmtDate(r.checkIn)}
                    <span className="admin-muted">
                      {" "}
                      · límite {fmtDateTime(n!.due!.toISOString())}
                    </span>
                  </span>
                  {filing ? (
                    <Link
                      className="admin-btn"
                      data-variant="outline"
                      href={`/admin/tramites/expedientes/${filing.id}`}
                    >
                      Abrir {filing.reference}
                    </Link>
                  ) : (
                    <Link
                      className="admin-btn"
                      data-variant="outline"
                      href={`/admin/tramites/clientes/${r.accountId}`}
                    >
                      Ver cliente
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="admin-card p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="text-sm">
            <span className="admin-muted block text-xs">Buscar</span>
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Referencia, cliente, vivienda…"
              className="rounded-md border border-[var(--a-line)] px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="admin-muted block text-xs">Estado</span>
            <select
              name="estado"
              defaultValue={estado ?? ""}
              className="rounded-md border border-[var(--a-line)] px-2 py-1.5"
            >
              <option value="">Todos</option>
              {FILING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="vista"
              value="todos"
              defaultChecked={sp.vista === "todos"}
            />{" "}
            Incluir cerrados
          </label>
          <button className="admin-btn" data-variant="primary" type="submit">
            Filtrar
          </button>
        </form>

        {list.length === 0 ? (
          <p className="admin-muted mt-4 text-sm">No hay expedientes con estos filtros.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Trámite</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Límite</th>
                  <th>Asignado</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <Link
                        className="font-semibold underline"
                        href={`/admin/tramites/expedientes/${f.id}`}
                      >
                        {f.reference}
                      </Link>
                      {f.late && (
                        <span className="admin-chip ml-1" data-tone="danger">
                          Fuera de plazo
                        </span>
                      )}
                    </td>
                    <td>{f.title}</td>
                    <td>
                      <Link className="underline" href={`/admin/tramites/clientes/${f.accountId}`}>
                        {accountById.get(f.accountId)?.legalName ?? "—"}
                      </Link>
                    </td>
                    <td>
                      <AdminStatusBadge status={f.status} />
                      {needsAttention(f) && (
                        <span className="admin-muted block text-xs">
                          Faltan {f.requestedDocuments.length} doc.
                        </span>
                      )}
                    </td>
                    <td>{f.dueAt ? fmtDateTime(f.dueAt) : "—"}</td>
                    <td className="text-xs">
                      {f.assigneeEmail ?? <span className="admin-muted">Sin asignar</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card p-4">
        <h2 className="font-semibold">Clientes</h2>
        {accounts.length === 0 ? (
          <p className="admin-muted mt-2 text-sm">Aún no hay clientes de trámites.</p>
        ) : (
          <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <li key={a.id}>
                <Link
                  className="block rounded-md border border-[var(--a-line)] p-3 hover:border-[var(--a-accent)]"
                  href={`/admin/tramites/clientes/${a.id}`}
                >
                  <span className="font-semibold">{a.legalName}</span>
                  <span className="admin-muted block text-xs">
                    {properties.filter((p) => p.accountId === a.id).length} vivienda(s) · saldo{" "}
                    {a.reservationCredits} · {a.status.replace("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  tone: "ok" | "warn" | "danger" | "neutral";
  href?: string;
}) {
  const body = (
    <>
      <span className="admin-muted text-xs">{label}</span>
      <span className="mt-1 flex items-center gap-2 text-2xl font-semibold">
        {value}
        {(tone === "warn" || tone === "danger") && value > 0 && (
          <span className="admin-chip" data-tone={tone}>
            {tone === "danger" ? "Urgente" : "Atender"}
          </span>
        )}
      </span>
      {hint && <span className="admin-muted text-xs">{hint}</span>}
    </>
  );
  return href ? (
    <Link href={href} className="admin-card flex flex-col p-4 hover:border-[var(--a-accent)]">
      {body}
    </Link>
  ) : (
    <div className="admin-card flex flex-col p-4">{body}</div>
  );
}
