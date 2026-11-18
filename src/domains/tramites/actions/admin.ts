"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminContext } from "@/domains/admin/context";
import { assertCapability, can, type Capability } from "@/domains/admin/roles";
import { getRepository } from "@/lib/repository";
import { reportError } from "@/lib/observability/report";
import {
  addInternalNote,
  assignFiling,
  getActiveCatalog,
  postMessage,
  registerSubmission,
  requestDocuments,
  reviewDocument,
  saveCatalog,
  setChecklistItem,
  storeDocument,
  transition,
  audit,
} from "../service";
import { serverStore } from "../repo";
import { madridLocalToIso } from "../deadlines";
import { DOCUMENT_KINDS, FILING_STATUSES, type Actor, type DocumentKind } from "../types";

/**
 * Acciones del panel «Servicios a propietarios» (#177). Cada una comprueba la
 * capacidad del rol antes de tocar nada; el servicio deja rastro en la
 * auditoría y en el historial del expediente.
 */

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

async function adminActor(cap: Capability = "tramites.write"): Promise<Actor> {
  await assertCapability(cap);
  const ctx = await getAdminContext();
  if (!ctx || ctx.needsMfa) throw new Error("SIN_PERMISO");
  return { type: "admin", id: ctx.email, label: ctx.fullName ?? ctx.email };
}

function fail(err: unknown, scope: string): AdminResult {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("SIN_PERMISO") || msg.startsWith("MFA_REQUERIDO"))
    return { ok: false, error: "Tu rol no permite esta acción." };
  reportError(err, { scope: `tramites/admin/${scope}` });
  return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };
}

const refresh = (filingId?: string, accountId?: string) => {
  revalidatePath("/admin/tramites");
  if (filingId) revalidatePath(`/admin/tramites/expedientes/${filingId}`);
  if (accountId) revalidatePath(`/admin/tramites/clientes/${accountId}`);
};

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function transitionAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const to = z.enum(FILING_STATUSES).safeParse(s(fd, "to"));
    if (!to.success) return { ok: false, error: "Estado no válido." };
    const r = await transition(s(fd, "filingId"), to.data, actor, s(fd, "note").slice(0, 1000));
    if (!r.ok) return r;
    refresh(s(fd, "filingId"));
    return { ok: true, message: "Estado actualizado." };
  } catch (e) {
    return fail(e, "transition");
  }
}

export async function requestDocumentsAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const kinds = fd
      .getAll("kinds")
      .map(String)
      .filter((k): k is DocumentKind => (DOCUMENT_KINDS as readonly string[]).includes(k));
    if (kinds.length === 0) return { ok: false, error: "Marca al menos un documento." };
    const r = await requestDocuments(
      s(fd, "filingId"),
      kinds,
      s(fd, "message").slice(0, 1500),
      actor,
    );
    if (!r.ok) return r;
    refresh(s(fd, "filingId"));
    return { ok: true, message: "Solicitud enviada al cliente por correo y en su carpeta." };
  } catch (e) {
    return fail(e, "request");
  }
}

const submissionSchema = z.object({
  filingId: z.string().uuid(),
  submittedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Indica fecha y hora reales."),
  channel: z.enum(["ses_hospedajes_web", "ses_hospedajes_fichero", "registro_autonomico", "otro"]),
  ref: z.string().max(120).optional().default(""),
  reportEvent: z.enum(["reserva", "anulacion", "entrada", ""]).optional().default(""),
});

export async function registerSubmissionAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const parsed = submissionSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
    const d = parsed.data;
    const r = await registerSubmission(
      d.filingId,
      {
        submittedAt: madridLocalToIso(d.submittedAt),
        channel: d.channel,
        ref: d.ref,
        reportEvent: d.reportEvent || null,
      },
      actor,
    );
    if (!r.ok) return r;
    refresh(d.filingId);
    return { ok: true, message: "Presentación registrada." };
  } catch (e) {
    return fail(e, "submission");
  }
}

export async function adminUploadAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const filing = await serverStore().getFiling(s(fd, "filingId"));
    if (!filing) return { ok: false, error: "Expediente no encontrado." };
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0)
      return { ok: false, error: "Elige un archivo." };
    const official = s(fd, "official") === "1";
    const kind = z.enum(DOCUMENT_KINDS).catch("otro").parse(s(fd, "kind"));
    const r = await storeDocument({
      accountId: filing.accountId,
      propertyId: filing.propertyId,
      filingId: filing.id,
      kind,
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      actor,
      officialProof: official,
    });
    if (!r.ok) return r;
    refresh(filing.id, filing.accountId);
    return {
      ok: true,
      message: official
        ? "Justificante oficial guardado. El cliente ya lo ve en su carpeta."
        : "Documento guardado.",
    };
  } catch (e) {
    return fail(e, "upload");
  }
}

export async function reviewDocumentAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const status = s(fd, "status") === "validado" ? "validado" : "rechazado";
    const note = s(fd, "note").slice(0, 500);
    if (status === "rechazado" && !note)
      return { ok: false, error: "Explica al cliente qué falla del documento." };
    const r = await reviewDocument(s(fd, "documentId"), status, note, actor);
    if (!r.ok) return r;
    refresh(s(fd, "filingId") || undefined);
    return {
      ok: true,
      message:
        status === "validado"
          ? "Documento validado."
          : "Documento marcado como no válido; se vuelve a pedir.",
    };
  } catch (e) {
    return fail(e, "review");
  }
}

export async function checklistAction(fd: FormData): Promise<void> {
  const actor = await adminActor();
  await setChecklistItem(s(fd, "filingId"), s(fd, "key"), s(fd, "done") === "1", actor);
  refresh(s(fd, "filingId"));
}

export async function noteAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    if (!s(fd, "note")) return { ok: false, error: "Escribe la nota." };
    await addInternalNote(s(fd, "filingId"), s(fd, "note"), actor);
    refresh(s(fd, "filingId"));
    return { ok: true, message: "Nota interna guardada (el cliente no la ve)." };
  } catch (e) {
    return fail(e, "note");
  }
}

export async function assignAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const email = s(fd, "email");
    if (email && !z.string().email().safeParse(email).success)
      return { ok: false, error: "Correo no válido." };
    await assignFiling(s(fd, "filingId"), email || null, actor);
    refresh(s(fd, "filingId"));
    return { ok: true, message: email ? `Asignado a ${email}.` : "Sin asignar." };
  } catch (e) {
    return fail(e, "assign");
  }
}

export async function adminMessageAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const accountId = s(fd, "accountId");
    const account = await serverStore().getAccount(accountId);
    if (!account) return { ok: false, error: "Cliente no encontrado." };
    const r = await postMessage(
      accountId,
      "admin",
      "Praetoria Vacacional",
      s(fd, "body"),
      s(fd, "filingId") || null,
    );
    if (!r.ok) return r;
    await serverStore().markMessagesRead(accountId, "admin");
    await audit(actor, "mensaje.enviar", accountId, "cuenta", accountId, {});
    refresh(undefined, accountId);
    return { ok: true, message: "Mensaje enviado. Le avisamos por correo." };
  } catch (e) {
    return fail(e, "message");
  }
}

export async function accountNotesAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const accountId = s(fd, "accountId");
    await serverStore().setInternalNotes(accountId, s(fd, "notes").slice(0, 5000));
    await audit(actor, "cuenta.notas", accountId, "cuenta", accountId, {});
    refresh(undefined, accountId);
    return { ok: true, message: "Notas guardadas." };
  } catch (e) {
    return fail(e, "notes");
  }
}

export async function accountStatusAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const status = z.enum(["activo", "suspendido", "baja"]).safeParse(s(fd, "status"));
    if (!status.success) return { ok: false, error: "Estado no válido." };
    const accountId = s(fd, "accountId");
    await serverStore().updateAccount(accountId, { status: status.data });
    await audit(actor, "cuenta.estado", accountId, "cuenta", accountId, { a: status.data });
    refresh(undefined, accountId);
    return { ok: true, message: "Estado de la cuenta actualizado." };
  } catch (e) {
    return fail(e, "status");
  }
}

/** Ajuste manual de saldo (cortesía, corrección): siempre con motivo. */
export async function adjustCreditsAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor();
    const delta = Number(s(fd, "delta"));
    const reason = s(fd, "reason");
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 200)
      return { ok: false, error: "Indica un número entero entre -200 y 200." };
    if (!reason) return { ok: false, error: "Indica el motivo del ajuste." };
    const accountId = s(fd, "accountId");
    const balance = await serverStore().adjustCredits(accountId, delta);
    await audit(actor, "cuenta.saldo_ajuste", accountId, "cuenta", accountId, {
      delta,
      motivo: reason.slice(0, 200),
    });
    refresh(undefined, accountId);
    return { ok: true, message: `Saldo actualizado: ${balance} reservas.` };
  } catch (e) {
    return fail(e, "credits");
  }
}

/**
 * Tarifas: solo quien puede cambiar la configuración. Se guarda una versión
 * nueva; los pedidos ya creados conservan el precio con el que se aceptaron.
 */
export async function saveCatalogAction(_p: unknown, fd: FormData): Promise<AdminResult> {
  try {
    const actor = await adminActor("settings.write");
    const current = await getActiveCatalog();
    const euros = (k: string, fallback: number) => {
      const raw = s(fd, k).replace(",", ".");
      if (raw === "") return fallback;
      const n = Math.round(Number(raw) * 100);
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    };
    const next = {
      ...current,
      version: s(fd, "version") || current.version,
      effectiveFrom: s(fd, "effectiveFrom") || current.effectiveFrom,
      vatRatePercent: Number(s(fd, "vat").replace(",", ".") || current.vatRatePercent),
      services: current.services.map((sv) => ({
        ...sv,
        priceCents: euros(`svc:${sv.code}:price`, sv.priceCents),
        enabled: fd.get(`svc:${sv.code}:enabled`) === "on",
      })),
      plans: current.plans.map((pl) => ({
        ...pl,
        monthlyFeeCents: euros(`plan:${pl.code}:monthly`, pl.monthlyFeeCents),
        reservationCents: euros(`plan:${pl.code}:reservation`, pl.reservationCents),
        visible: fd.get(`plan:${pl.code}:visible`) === "on",
        // La suscripción mensual no se activa desde aquí (#178): requiere aprobación
        // y conectar el producto recurrente de Stripe.
        purchasable:
          pl.code === "gestion_continua" ? false : fd.get(`plan:${pl.code}:purchasable`) === "on",
      })),
    };
    if (next.version === current.version)
      return {
        ok: false,
        error: "Pon un nombre de versión nuevo para guardar el cambio de tarifas.",
      };
    const r = await saveCatalog(next, actor);
    if (!r.ok) return r;
    revalidatePath("/admin/tramites/tarifas");
    revalidatePath("/gestion-tramites-alquiler-turistico");
    revalidatePath("/alta-tramites");
    return { ok: true, message: `Tarifas ${next.version} guardadas.` };
  } catch (e) {
    return fail(e, "catalog");
  }
}

export async function leadStatusAction(fd: FormData): Promise<void> {
  await adminActor();
  const id = s(fd, "id");
  const status = z.enum(["nuevo", "contactado", "alta", "descartado"]).parse(s(fd, "status"));
  const repo = getRepository();
  const row = await repo.getContentOverride(`lead:tramites:${id}`);
  if (!row) return;
  await repo.setContentOverride(`lead:tramites:${id}`, { ...(row.value as object), status });
  revalidatePath("/admin/tramites/solicitudes");
}

export async function canSeeTravellers(): Promise<boolean> {
  const ctx = await getAdminContext();
  return !!ctx && !ctx.needsMfa && can(ctx.role, "tramites.sensitive");
}
