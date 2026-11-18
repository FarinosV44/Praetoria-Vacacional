import Link from "next/link";
import { notFound } from "next/navigation";
import { serverStore } from "@/domains/tramites/repo";
import { isOpen } from "@/domains/tramites/workflow";
import { nextPending, EVENT_LABEL } from "@/domains/tramites/deadlines";
import {
  accountNotesAction,
  accountStatusAction,
  adjustCreditsAction,
  adminMessageAction,
} from "@/domains/tramites/actions/admin";
import { ActionForm } from "@/components/tramites/forms";
import { AdminStatusBadge, DOC_KIND_LABEL, fmtDate, fmtDateTime } from "@/components/tramites/ui";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Cliente de trámites" };
export const dynamic = "force-dynamic";

const ORDER_LABEL = {
  pendiente_verificacion: "Esperando verificación del correo",
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  solicitud_especial: "Presupuesto a preparar",
  cancelado: "Cancelado",
} as const;

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = serverStore();
  const account = await store.getAccount(id);
  if (!account) notFound();
  const [properties, filings, orders, reports, documents, messages, notes, auditRows] =
    await Promise.all([
      store.listProperties({ accountId: id }),
      store.listFilings({ accountId: id }),
      store.listOrders({ accountId: id }),
      store.listReports({ accountId: id }),
      store.listDocuments({ accountId: id }),
      store.listMessages(id),
      store.getInternalNotes(id),
      store.listAudit({ accountId: id, limit: 40 }),
    ]);
  // Abrir la ficha marca como leídos los mensajes del cliente.
  if (messages.some((m) => m.author === "owner" && !m.readByAdminAt))
    await store.markMessagesRead(id, "admin");
  const thread = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tramites" className="text-sm underline">
          ← Servicios a propietarios
        </Link>
        <h1 className="font-display mt-2 text-2xl">{account.legalName}</h1>
        <p className="admin-muted mt-1 text-sm">
          {account.kind === "empresa" ? "Empresa" : "Particular"} · {account.taxId} ·{" "}
          {account.contactName} ·{" "}
          <a className="underline" href={`mailto:${account.email}`}>
            {account.email}
          </a>{" "}
          ·{" "}
          <a className="underline" href={`tel:${account.phone.replace(/\s+/g, "")}`}>
            {account.phone}
          </a>
        </p>
        <p className="mt-1 text-sm">
          <span className="admin-chip" data-tone={account.status === "activo" ? "ok" : "warn"}>
            {account.status.replace("_", " ")}
          </span>{" "}
          Saldo: <strong>{account.reservationCredits}</strong> reservas · cliente desde{" "}
          {fmtDate(account.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-6">
          <section className="admin-card p-4">
            <h2 className="font-semibold">Viviendas</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vivienda</th>
                    <th>Dirección</th>
                    <th>Registro turístico</th>
                    <th>Alta SES</th>
                    <th>Abiertos</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold">{p.alias}</td>
                      <td>
                        {p.street}, {p.postalCode} {p.municipality} ({p.province})
                        {p.cadastralRef && (
                          <span className="admin-muted block text-xs">
                            Catastro {p.cadastralRef}
                          </span>
                        )}
                      </td>
                      <td>{p.tourismRegistryNumber ?? p.hasTourismRegistry.replace("_", " ")}</td>
                      <td>{p.sesEstablishmentCode ?? p.hasSesAlta.replace("_", " ")}</td>
                      <td>
                        {filings.filter((f) => f.propertyId === p.id && isOpen(f.status)).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Expedientes</h2>
            <ul className="mt-2 divide-y divide-[var(--a-line-soft)] text-sm">
              {[...filings]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link className="underline" href={`/admin/tramites/expedientes/${f.id}`}>
                      {f.reference} · {f.title}
                    </Link>
                    <AdminStatusBadge status={f.status} />
                  </li>
                ))}
              {filings.length === 0 && <li className="admin-muted py-2">Sin expedientes.</li>}
            </ul>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Reservas comunicadas</h2>
            <ul className="mt-2 divide-y divide-[var(--a-line-soft)] text-sm">
              {[...reports]
                .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
                .map((r) => {
                  const n = nextPending(r);
                  const f = filings.find((x) => x.reservationReportId === r.id);
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <span>
                        {properties.find((p) => p.id === r.propertyId)?.alias} ·{" "}
                        {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {r.travellers} viajeros
                        {r.cancelledAt && " · anulada"}
                        {!r.travellerDataEnc && !r.cancelledAt && (
                          <span className="admin-muted"> · sin datos de viajeros</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        {n && (
                          <span
                            className="admin-chip"
                            data-tone={
                              n.state === "vencido"
                                ? "danger"
                                : n.state === "vence_pronto"
                                  ? "warn"
                                  : "neutral"
                            }
                          >
                            {EVENT_LABEL[n.event]} · {n.due ? fmtDateTime(n.due.toISOString()) : ""}
                          </span>
                        )}
                        {f && (
                          <Link className="underline" href={`/admin/tramites/expedientes/${f.id}`}>
                            {f.reference}
                          </Link>
                        )}
                      </span>
                    </li>
                  );
                })}
              {reports.length === 0 && (
                <li className="admin-muted py-2">Sin reservas comunicadas.</li>
              )}
            </ul>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Pedidos y pagos</h2>
            <ul className="mt-2 divide-y divide-[var(--a-line-soft)] text-sm">
              {orders.map((o) => (
                <li key={o.id} className="py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{o.reference}</strong> · {fmtDateTime(o.createdAt)} ·{" "}
                      {formatMoney(o.totalCents)} IVA incl. · tarifa {o.catalogVersion}
                    </span>
                    <span
                      className="admin-chip"
                      data-tone={
                        o.status === "pagado" ? "ok" : o.status === "cancelado" ? "neutral" : "warn"
                      }
                    >
                      {ORDER_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="admin-muted text-xs">
                    {o.lines.map((l) => `${l.quantity}× ${l.description}`).join(" · ")}
                  </p>
                  <p className="admin-muted text-xs">
                    Aceptó condiciones {o.acceptance.termsVersion}, privacidad{" "}
                    {o.acceptance.privacyVersion} y autorización {o.acceptance.mandateVersion} el{" "}
                    {fmtDateTime(o.acceptance.acceptedAt)}
                    {o.invoiceUrl && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          className="underline"
                          href={o.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          factura
                        </a>
                      </>
                    )}
                  </p>
                </li>
              ))}
              {orders.length === 0 && <li className="admin-muted py-2">Sin pedidos.</li>}
            </ul>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Documentos</h2>
            <ul className="mt-2 divide-y divide-[var(--a-line-soft)] text-sm">
              {documents.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <a className="underline" href={`/admin/tramites-archivos/${d.id}`}>
                    {d.filename}
                  </a>
                  <span className="admin-muted text-xs">
                    {DOC_KIND_LABEL[d.kind]} ·{" "}
                    {d.isOfficialProof ? "justificante oficial" : d.status} ·{" "}
                    {fmtDateTime(d.createdAt)}
                  </span>
                </li>
              ))}
              {documents.length === 0 && <li className="admin-muted py-2">Sin documentos.</li>}
            </ul>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Auditoría reciente</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {auditRows.map((a) => (
                <li key={a.id}>
                  <span className="admin-muted">{fmtDateTime(a.at)}</span> · {a.actor.label} ·{" "}
                  <code>{a.action}</code>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-card p-4">
            <h2 className="font-semibold">Mensajes</h2>
            <ol className="mt-2 max-h-96 space-y-2 overflow-y-auto text-sm">
              {thread.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-md p-2 ${m.author === "admin" ? "bg-[var(--a-accent-soft)]" : "bg-[var(--a-surface-2)]"}`}
                >
                  <span className="admin-muted block text-xs">
                    {m.author === "admin" ? m.authorLabel : "Cliente"} · {fmtDateTime(m.createdAt)}
                  </span>
                  <span className="whitespace-pre-line">{m.body}</span>
                </li>
              ))}
              {thread.length === 0 && <li className="admin-muted">Sin mensajes.</li>}
            </ol>
            <ActionForm
              action={adminMessageAction}
              submitLabel="Enviar"
              className="mt-3 space-y-2 text-sm"
              resetOnSuccess
            >
              <input type="hidden" name="accountId" value={account.id} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Escribe al cliente"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1"
              />
            </ActionForm>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Notas internas</h2>
            <ActionForm
              action={accountNotesAction}
              submitLabel="Guardar"
              className="mt-2 space-y-2 text-sm"
            >
              <input type="hidden" name="accountId" value={account.id} />
              <textarea
                name="notes"
                rows={5}
                defaultValue={notes}
                placeholder="Solo las ve el equipo"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1"
              />
            </ActionForm>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Saldo de reservas</h2>
            <ActionForm
              action={adjustCreditsAction}
              submitLabel="Ajustar"
              className="mt-2 space-y-2 text-sm"
              resetOnSuccess
            >
              <input type="hidden" name="accountId" value={account.id} />
              <input
                name="delta"
                type="number"
                min={-200}
                max={200}
                required
                placeholder="+2 o -1"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
              />
              <input
                name="reason"
                required
                maxLength={200}
                placeholder="Motivo (queda en la auditoría)"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
              />
            </ActionForm>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Estado de la cuenta</h2>
            <ActionForm
              action={accountStatusAction}
              submitLabel="Cambiar"
              className="mt-2 space-y-2 text-sm"
            >
              <input type="hidden" name="accountId" value={account.id} />
              <select
                name="status"
                defaultValue={
                  account.status === "pendiente_verificacion" ? "activo" : account.status
                }
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
              >
                <option value="activo">Activa</option>
                <option value="suspendido">Suspendida</option>
                <option value="baja">Baja</option>
              </select>
            </ActionForm>
          </section>
        </aside>
      </div>
    </div>
  );
}
