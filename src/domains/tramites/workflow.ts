import type { ServiceCode } from "./catalog";
import type { ChecklistItem, Filing, FilingStatus } from "./types";

/**
 * Issue #177 — flujo de un expediente.
 *
 *   solicitado → pendiente_documentacion → en_revision → listo_para_presentar
 *              → presentado → finalizado
 *   alternativas: subsanacion · incidencia · suspendido · cancelado
 *
 * Reglas que protegen la trazabilidad:
 *  - «presentado» exige fecha de presentación y canal reales (la presentación es
 *    manual en fase 1: nunca se marca porque se haya generado un fichero).
 *  - «finalizado» exige que exista un justificante oficial subido.
 *  - Un expediente cerrado (finalizado/cancelado) no vuelve atrás.
 */

const NEXT: Record<FilingStatus, FilingStatus[]> = {
  solicitado: ["pendiente_documentacion", "en_revision", "suspendido", "cancelado"],
  pendiente_documentacion: ["en_revision", "suspendido", "cancelado", "incidencia"],
  en_revision: [
    "pendiente_documentacion",
    "listo_para_presentar",
    "incidencia",
    "suspendido",
    "cancelado",
  ],
  listo_para_presentar: [
    "presentado",
    "pendiente_documentacion",
    "incidencia",
    "suspendido",
    "cancelado",
  ],
  presentado: ["finalizado", "subsanacion", "incidencia"],
  subsanacion: [
    "pendiente_documentacion",
    "en_revision",
    "listo_para_presentar",
    "presentado",
    "incidencia",
    "cancelado",
  ],
  incidencia: [
    "pendiente_documentacion",
    "en_revision",
    "listo_para_presentar",
    "suspendido",
    "cancelado",
  ],
  suspendido: ["pendiente_documentacion", "en_revision", "cancelado"],
  finalizado: [],
  cancelado: [],
};

export function allowedTransitions(from: FilingStatus): FilingStatus[] {
  return NEXT[from];
}

export interface TransitionContext {
  submittedAt?: string | null;
  submissionChannel?: string | null;
  hasOfficialProof?: boolean;
}

export function canTransition(
  from: FilingStatus,
  to: FilingStatus,
  ctx: TransitionContext = {},
): { ok: true } | { ok: false; reason: string } {
  if (from === to) return { ok: false, reason: "El expediente ya está en ese estado." };
  if (!NEXT[from].includes(to)) {
    return {
      ok: false,
      reason: `No se puede pasar de «${STATUS_LABEL[from]}» a «${STATUS_LABEL[to]}».`,
    };
  }
  if (to === "presentado" && (!ctx.submittedAt || !ctx.submissionChannel)) {
    return {
      ok: false,
      reason: "Para marcarlo como presentado registra la fecha y el canal de presentación.",
    };
  }
  if (to === "finalizado" && !ctx.hasOfficialProof) {
    return { ok: false, reason: "Sube el justificante oficial antes de finalizar el expediente." };
  }
  return { ok: true };
}

export const STATUS_LABEL: Record<FilingStatus, string> = {
  solicitado: "Solicitado",
  pendiente_documentacion: "Pendiente de documentación",
  en_revision: "En revisión",
  listo_para_presentar: "Listo para presentar",
  presentado: "Presentado",
  subsanacion: "Subsanación",
  finalizado: "Finalizado",
  incidencia: "Incidencia",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

/** Lo que ve el propietario: pocas palabras y sin jerga interna. */
export const OWNER_STATUS: Record<
  FilingStatus,
  { label: string; tone: "warn" | "info" | "ok" | "neutral" | "danger" }
> = {
  solicitado: { label: "Recibido", tone: "info" },
  pendiente_documentacion: { label: "Falta documentación", tone: "warn" },
  en_revision: { label: "En revisión", tone: "info" },
  listo_para_presentar: { label: "Listo para presentar", tone: "info" },
  presentado: { label: "Presentado", tone: "ok" },
  subsanacion: { label: "Requiere corrección", tone: "warn" },
  finalizado: { label: "Finalizado", tone: "ok" },
  incidencia: { label: "En estudio", tone: "warn" },
  suspendido: { label: "En pausa", tone: "neutral" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

export function isOpen(status: FilingStatus): boolean {
  return status !== "finalizado" && status !== "cancelado";
}

/** Checklist inicial por tipo de servicio (editable desde el panel). */
export function defaultChecklist(code: ServiceCode): ChecklistItem[] {
  switch (code) {
    case "ses_alta":
      return [
        { key: "mandato", label: "Autorización de representación firmada", done: false },
        { key: "titular", label: "Identidad del titular verificada", done: false },
        {
          key: "vivienda",
          label: "Datos de la vivienda y registro turístico comprobados",
          done: false,
        },
        { key: "alta", label: "Alta presentada en SES.HOSPEDAJES", done: false },
        {
          key: "justificante",
          label: "Justificante y código de establecimiento subidos",
          done: false,
        },
      ];
    case "comunicacion_reserva":
      return [
        { key: "reserva", label: "Comunicación de la reserva presentada", done: false },
        { key: "viajeros", label: "Datos de viajeros completos", done: false },
        { key: "entrada", label: "Comunicación de la entrada presentada", done: false },
        { key: "justificante", label: "Justificantes subidos", done: false },
      ];
    case "revision_historica":
      return [
        { key: "inventario", label: "Inventario de estancias recibido", done: false },
        { key: "analisis", label: "Análisis jurídico de cada estancia", done: false },
        { key: "presupuesto", label: "Presupuesto enviado y aceptado", done: false },
        { key: "informe", label: "Informe al cliente entregado", done: false },
      ];
    default:
      return [];
  }
}

export function filingTitle(code: ServiceCode, propertyAlias: string): string {
  switch (code) {
    case "ses_alta":
      return `Alta en SES.HOSPEDAJES · ${propertyAlias}`;
    case "comunicacion_reserva":
      return `Comunicación de reserva · ${propertyAlias}`;
    case "revision_historica":
      return `Revisión de reservas anteriores · ${propertyAlias}`;
    case "nrua_solicitud":
      return `NRUA · ${propertyAlias}`;
    case "deposito_anual":
      return `Depósito anual · ${propertyAlias}`;
  }
}

export function needsAttention(f: Pick<Filing, "status" | "requestedDocuments">): boolean {
  return (
    f.status === "pendiente_documentacion" ||
    f.status === "subsanacion" ||
    f.requestedDocuments.length > 0
  );
}
