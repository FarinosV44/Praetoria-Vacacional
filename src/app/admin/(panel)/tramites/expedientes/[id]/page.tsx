import Link from "next/link";
import { notFound } from "next/navigation";
import { serverStore } from "@/domains/tramites/repo";
import { getAdminContext } from "@/domains/admin/context";
import { can } from "@/domains/admin/roles";
import { allowedTransitions, STATUS_LABEL } from "@/domains/tramites/workflow";
import { deadlineState, EVENT_LABEL } from "@/domains/tramites/deadlines";
import { readTravellerData } from "@/domains/tramites/service";
import { DOCUMENT_KINDS, type ReportEvent } from "@/domains/tramites/types";
import {
  adminUploadAction,
  assignAction,
  checklistAction,
  noteAction,
  registerSubmissionAction,
  requestDocumentsAction,
  reviewDocumentAction,
  transitionAction,
} from "@/domains/tramites/actions/admin";
import { ActionForm } from "@/components/tramites/forms";
import { AdminStatusBadge, DOC_KIND_LABEL, fmtDate, fmtDateTime } from "@/components/tramites/ui";

export const metadata = { title: "Expediente" };
export const dynamic = "force-dynamic";

const CHANNEL_LABEL = {
  ses_hospedajes_web: "SES.HOSPEDAJES · formulario web",
  ses_hospedajes_fichero: "SES.HOSPEDAJES · envío de fichero",
  registro_autonomico: "Registro autonómico",
  otro: "Otro canal",
} as const;

export default async function FilingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ viajeros?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const store = serverStore();
  const filing = await store.getFiling(id);
  if (!filing) notFound();
  const [account, property, events, documents, report] = await Promise.all([
    store.getAccount(filing.accountId),
    store.getProperty(filing.propertyId),
    store.listEvents(filing.id),
    store.listDocuments({ filingId: filing.id }),
    filing.reservationReportId
      ? store.getReport(filing.reservationReportId)
      : Promise.resolve(null),
  ]);
  const ctx = await getAdminContext();
  const sensitive = !!ctx && !ctx.needsMfa && can(ctx.role, "tramites.sensitive");
  const travellers =
    sensitive && sp.viajeros === "1" && report?.travellerDataEnc
      ? await readTravellerData(report.id, {
          type: "admin",
          id: ctx!.email,
          label: ctx!.fullName ?? ctx!.email,
        })
      : null;
  const nexts = allowedTransitions(filing.status);
  const timeline = [...events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tramites" className="text-sm underline">
          ← Servicios a propietarios
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl">{filing.title}</h1>
          <AdminStatusBadge status={filing.status} />
          {filing.late && (
            <span className="admin-chip" data-tone="danger">
              Comunicado fuera de plazo
            </span>
          )}
        </div>
        <p className="admin-muted mt-1 text-sm">
          {filing.reference} · cliente{" "}
          <Link className="underline" href={`/admin/tramites/clientes/${filing.accountId}`}>
            {account?.legalName ?? "—"}
          </Link>{" "}
          · {property?.alias} ({property?.municipality}) · abierto {fmtDateTime(filing.createdAt)}
          {filing.dueAt && <> · límite {fmtDateTime(filing.dueAt)}</>}
        </p>
        {filing.late && (
          <p className="pv-note pv-note--error mt-3 text-sm">
            El cliente nos lo comunicó cuando ya había pasado el plazo de 24 horas. Se presenta
            igualmente, pero la comunicación tardía no subsana el retraso: no lo des por resuelto
            ante el cliente.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-6">
          {report && (
            <section className="admin-card p-4">
              <h2 className="font-semibold">Reserva comunicada</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                <dt className="admin-muted">Canal</dt>
                <dd>{report.channel}</dd>
                <dt className="admin-muted">Formalizada</dt>
                <dd>{fmtDateTime(report.bookedAt)}</dd>
                <dt className="admin-muted">Entrada</dt>
                <dd>{fmtDate(report.checkIn)}</dd>
                <dt className="admin-muted">Salida</dt>
                <dd>{fmtDate(report.checkOut)}</dd>
                <dt className="admin-muted">Viajeros</dt>
                <dd>{report.travellers}</dd>
                <dt className="admin-muted">Nos avisó</dt>
                <dd>{fmtDateTime(report.reportedAt)}</dd>
                <dt className="admin-muted">Cobro</dt>
                <dd>
                  {report.billing === "pendiente" ? (
                    <span className="admin-chip" data-tone="warn">
                      Sin saldo
                    </span>
                  ) : (
                    report.billing
                  )}
                </dd>
                {report.cancelledAt && (
                  <>
                    <dt className="admin-muted">Anulada</dt>
                    <dd>{fmtDateTime(report.cancelledAt)}</dd>
                  </>
                )}
              </dl>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                {(["reserva", "anulacion", "entrada"] as ReportEvent[]).map((e) => {
                  const st = deadlineState(report, e);
                  if (st.state === "no_aplica") return null;
                  const tone =
                    st.state === "hecho"
                      ? "ok"
                      : st.state === "vencido"
                        ? "danger"
                        : st.state === "vence_pronto"
                          ? "warn"
                          : "neutral";
                  return (
                    <li key={e} className="rounded-md border border-[var(--a-line)] p-2">
                      <span className="font-medium">{EVENT_LABEL[e]}</span>{" "}
                      <span className="admin-chip" data-tone={tone}>
                        {st.state === "hecho"
                          ? "Presentado"
                          : st.state === "vencido"
                            ? "Vencido"
                            : st.state === "vence_pronto"
                              ? "Vence pronto"
                              : "A tiempo"}
                      </span>
                      <span className="admin-muted block text-xs">
                        Límite {st.due ? fmtDateTime(st.due.toISOString()) : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 border-t border-[var(--a-line-soft)] pt-3">
                <h3 className="text-sm font-semibold">Datos de los viajeros</h3>
                {!report.travellerDataEnc ? (
                  <p className="admin-muted text-sm">El cliente aún no los ha enviado.</p>
                ) : !sensitive ? (
                  <p className="admin-muted text-sm">
                    Recibidos y cifrados. Tu rol no permite verlos.
                  </p>
                ) : travellers ? (
                  <div className="mt-2 overflow-x-auto">
                    <p className="admin-muted mb-2 text-xs">
                      Consulta registrada en la auditoría. Úsalos solo para presentar el parte; no
                      los copies fuera del panel.
                    </p>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Documento</th>
                          <th>Nacimiento</th>
                          <th>Nacionalidad</th>
                          <th>Residencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {travellers.travellers.map((t, i) => (
                          <tr key={i}>
                            <td>
                              {t.firstName} {t.surname1} {t.surname2}{" "}
                              <span className="admin-muted">({t.sex})</span>
                            </td>
                            <td>
                              {t.docType} {t.docNumber}{" "}
                              {t.docSupport && (
                                <span className="admin-muted">· soporte {t.docSupport}</span>
                              )}
                            </td>
                            <td>{fmtDate(t.birthDate)}</td>
                            <td>{t.nationality}</td>
                            <td>
                              {t.address}, {t.city} ({t.country})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs">
                      Pago: {travellers.paymentType}
                      {travellers.paymentDate && ` · ${fmtDate(travellers.paymentDate)}`}
                    </p>
                  </div>
                ) : (
                  <form method="get" className="mt-2">
                    <input type="hidden" name="viajeros" value="1" />
                    <button className="admin-btn" data-variant="outline" type="submit">
                      Ver datos para presentar el parte
                    </button>
                    <span className="admin-muted ml-2 text-xs">
                      Queda registrado quién y cuándo los consulta.
                    </span>
                  </form>
                )}
              </div>
            </section>
          )}

          <section className="admin-card p-4">
            <h2 className="font-semibold">Documentos</h2>
            {filing.requestedDocuments.length > 0 && (
              <p className="mt-1 text-sm">
                <span className="admin-chip" data-tone="warn">
                  Pedidos al cliente
                </span>{" "}
                {filing.requestedDocuments
                  .map((k) => DOC_KIND_LABEL[k as keyof typeof DOC_KIND_LABEL] ?? k)
                  .join(" · ")}
              </p>
            )}
            {documents.length === 0 ? (
              <p className="admin-muted mt-2 text-sm">Sin documentos todavía.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {documents.map((d) => (
                  <li key={d.id} className="rounded-md border border-[var(--a-line)] p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <a
                          className="font-semibold underline"
                          href={`/admin/tramites-archivos/${d.id}`}
                        >
                          {d.filename}
                        </a>{" "}
                        <span className="admin-muted">
                          · {DOC_KIND_LABEL[d.kind]} · {Math.ceil(d.sizeBytes / 1024)} KB ·{" "}
                          {d.uploadedBy === "owner" ? "cliente" : "equipo"} ·{" "}
                          {fmtDateTime(d.createdAt)}
                        </span>
                      </span>
                      <span
                        className="admin-chip"
                        data-tone={
                          d.isOfficialProof || d.status === "validado"
                            ? "ok"
                            : d.status === "rechazado"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {d.isOfficialProof
                          ? "Justificante oficial"
                          : d.status === "validado"
                            ? "Validado"
                            : d.status === "rechazado"
                              ? "No válido"
                              : "Por revisar"}
                      </span>
                    </div>
                    {d.reviewNote && (
                      <p className="admin-muted mt-1 text-xs">Nota: {d.reviewNote}</p>
                    )}
                    {!d.isOfficialProof && d.status === "recibido" && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <ActionForm
                          action={reviewDocumentAction}
                          submitLabel="Validar"
                          className="space-y-2"
                        >
                          <input type="hidden" name="documentId" value={d.id} />
                          <input type="hidden" name="filingId" value={filing.id} />
                          <input type="hidden" name="status" value="validado" />
                        </ActionForm>
                        <ActionForm
                          action={reviewDocumentAction}
                          submitLabel="Marcar no válido"
                          className="space-y-2"
                        >
                          <input type="hidden" name="documentId" value={d.id} />
                          <input type="hidden" name="filingId" value={filing.id} />
                          <input type="hidden" name="status" value="rechazado" />
                          <input
                            name="note"
                            required
                            placeholder="Qué falla (lo verá el cliente)"
                            className="w-full rounded-md border border-[var(--a-line)] px-2 py-1"
                          />
                        </ActionForm>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Subir un documento o el justificante oficial
              </summary>
              <ActionForm
                action={adminUploadAction}
                submitLabel="Subir"
                className="mt-3 space-y-3 text-sm"
                resetOnSuccess
              >
                <input type="hidden" name="filingId" value={filing.id} />
                <label className="block">
                  Tipo
                  <select
                    name="kind"
                    className="mt-1 block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
                  >
                    {DOCUMENT_KINDS.filter((k) => k !== "justificante_oficial").map((k) => (
                      <option key={k} value={k}>
                        {DOC_KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="official" value="1" className="mt-1" />
                  <span>
                    Es el justificante oficial que devuelve el organismo (acuse, resguardo). Solo el
                    real: no se puede sustituir ni borrar.
                  </span>
                </label>
                <input
                  type="file"
                  name="file"
                  accept="application/pdf,image/png,image/jpeg"
                  required
                />
                <p className="admin-muted text-xs">PDF, PNG o JPG · máximo 10 MB.</p>
              </ActionForm>
            </details>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Historial</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {timeline.map((e) => (
                <li key={e.id} className="border-l-2 border-[var(--a-line)] pl-3">
                  <span className="admin-muted text-xs">
                    {fmtDateTime(e.at)} · {e.actor.label}
                    {!e.visibleToOwner && " · interno"}
                  </span>
                  <p>
                    {e.kind === "estado" && e.toStatus ? (
                      <>
                        {e.fromStatus ? STATUS_LABEL[e.fromStatus] : "—"} →{" "}
                        <strong>{STATUS_LABEL[e.toStatus]}</strong>
                        {e.message && ` · ${e.message}`}
                      </>
                    ) : (
                      e.message
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-card p-4">
            <h2 className="font-semibold">Cambiar estado</h2>
            {nexts.length === 0 ? (
              <p className="admin-muted mt-2 text-sm">Expediente cerrado.</p>
            ) : (
              <ActionForm
                action={transitionAction}
                submitLabel="Aplicar"
                className="mt-2 space-y-3 text-sm"
              >
                <input type="hidden" name="filingId" value={filing.id} />
                <select
                  name="to"
                  className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
                >
                  {nexts.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Comentario (opcional, lo verá el cliente)"
                  className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1"
                />
                <p className="admin-muted text-xs">
                  «Presentado» exige registrar antes la presentación; «Finalizado», el justificante
                  oficial.
                </p>
              </ActionForm>
            )}
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Registrar presentación</h2>
            <p className="admin-muted mt-1 text-xs">
              La presentación se hace a mano en la sede oficial. Aquí solo se anota lo que ya se ha
              hecho: fecha real, canal y código.
            </p>
            {filing.submittedAt && (
              <p className="mt-2 text-sm">
                Última: {fmtDateTime(filing.submittedAt)} ·{" "}
                {filing.submissionChannel ? CHANNEL_LABEL[filing.submissionChannel] : ""}
                {filing.submissionRef && ` · ${filing.submissionRef}`}
              </p>
            )}
            {nexts.length > 0 && (
              <ActionForm
                action={registerSubmissionAction}
                submitLabel="Registrar"
                className="mt-3 space-y-3 text-sm"
              >
                <input type="hidden" name="filingId" value={filing.id} />
                <label className="block">
                  Fecha y hora (Madrid)
                  <input
                    type="datetime-local"
                    name="submittedAt"
                    required
                    className="mt-1 block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
                  />
                </label>
                <label className="block">
                  Canal
                  <select
                    name="channel"
                    className="mt-1 block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
                  >
                    {Object.entries(CHANNEL_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                {report && (
                  <label className="block">
                    Hecho comunicado
                    <select
                      name="reportEvent"
                      className="mt-1 block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
                    >
                      <option value="reserva">Reserva</option>
                      {report.cancelledAt && <option value="anulacion">Anulación</option>}
                      <option value="entrada">Entrada de viajeros</option>
                    </select>
                  </label>
                )}
                <label className="block">
                  Código o número de operación
                  <input
                    name="ref"
                    maxLength={120}
                    className="mt-1 block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
                  />
                </label>
              </ActionForm>
            )}
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Pedir documentación</h2>
            <ActionForm
              action={requestDocumentsAction}
              submitLabel="Pedir al cliente"
              className="mt-2 space-y-2 text-sm"
              resetOnSuccess
            >
              <input type="hidden" name="filingId" value={filing.id} />
              {DOCUMENT_KINDS.filter((k) => k !== "justificante_oficial").map((k) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" name="kinds" value={k} /> {DOC_KIND_LABEL[k]}
                </label>
              ))}
              <textarea
                name="message"
                rows={3}
                placeholder="Explica qué necesitas y por qué"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1"
              />
            </ActionForm>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Lista de comprobación</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {filing.checklist.map((c) => (
                <li key={c.key}>
                  <form action={checklistAction} className="flex items-center gap-2">
                    <input type="hidden" name="filingId" value={filing.id} />
                    <input type="hidden" name="key" value={c.key} />
                    <input type="hidden" name="done" value={c.done ? "0" : "1"} />
                    <button
                      type="submit"
                      aria-label={c.done ? `Desmarcar ${c.label}` : `Marcar ${c.label}`}
                      className="h-4 w-4 shrink-0 rounded border border-[var(--a-line)] text-[10px] leading-none"
                    >
                      {c.done ? "✓" : ""}
                    </button>
                    <span className={c.done ? "admin-muted line-through" : ""}>{c.label}</span>
                  </form>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-semibold">Asignación y notas internas</h2>
            <ActionForm
              action={assignAction}
              submitLabel="Asignar"
              className="mt-2 space-y-2 text-sm"
            >
              <input type="hidden" name="filingId" value={filing.id} />
              <input
                name="email"
                type="email"
                defaultValue={filing.assigneeEmail ?? ""}
                placeholder="correo del gestor"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1.5"
              />
            </ActionForm>
            <ActionForm
              action={noteAction}
              submitLabel="Guardar nota"
              className="mt-4 space-y-2 text-sm"
              resetOnSuccess
            >
              <input type="hidden" name="filingId" value={filing.id} />
              <textarea
                name="note"
                rows={3}
                placeholder="Nota interna (el cliente no la ve)"
                className="block w-full rounded-md border border-[var(--a-line)] px-2 py-1"
              />
            </ActionForm>
          </section>
        </aside>
      </div>
    </div>
  );
}
