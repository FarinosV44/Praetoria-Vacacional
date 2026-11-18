import { OWNER_STATUS, STATUS_LABEL } from "@/domains/tramites/workflow";
import type { DocumentKind, FilingStatus } from "@/domains/tramites/types";

/** Piezas compartidas del portal y del panel de trámites. */

const tz = "Europe/Madrid";
export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: tz }) : "—";
export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: tz }) : "—";

const TONE: Record<string, string> = {
  warn: "bg-[var(--color-warning-50)] text-[oklch(0.4_0.09_70)]",
  info: "bg-[var(--color-sea-50)] text-[var(--color-sea-700)]",
  ok: "bg-[var(--color-success-50)] text-[var(--color-success)]",
  neutral: "bg-[var(--color-mist)] text-[var(--color-ink-soft)]",
  danger: "bg-[var(--color-danger-50)] text-[var(--color-danger)]",
};

export function OwnerStatusBadge({ status }: { status: FilingStatus }) {
  const s = OWNER_STATUS[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[s.tone]}`}>{s.label}</span>
  );
}

export function AdminStatusBadge({ status }: { status: FilingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[OWNER_STATUS[status].tone]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export const DOC_KIND_LABEL: Record<DocumentKind, string> = {
  autorizacion_representacion: "Autorización de representación firmada",
  dni_titular: "Documento de identidad del titular",
  escritura_o_nota_simple: "Escritura o nota simple",
  registro_turistico: "Justificante del registro turístico",
  contrato_o_reserva: "Contrato o justificante de reserva",
  justificante_oficial: "Justificante oficial",
  otro: "Otro documento",
};

export const DOC_KIND_HELP: Partial<Record<DocumentKind, string>> = {
  autorizacion_representacion:
    "Descárgala desde «Mis datos», fírmala (a mano o con certificado) y súbela aquí.",
  dni_titular: "Por las dos caras. Solo lo usamos para acreditar que eres el titular.",
  registro_turistico: "La resolución o el certificado de inscripción de la vivienda en el registro de turismo.",
};

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] p-6 text-sm text-[var(--color-ink-soft)]">{children}</p>;
}
