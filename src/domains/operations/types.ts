/**
 * Issues #70 + #71 — one task board for housekeeping/turnovers and
 * maintenance/incidents.
 */

export type OpsKind = "turnover" | "cleaning" | "maintenance" | "incident";
export type OpsStatus = "open" | "scheduled" | "in_progress" | "done" | "cancelled";
export type OpsPriority = "low" | "normal" | "high" | "urgent";

export interface OpsTask {
  id: string;
  propertyId: string;
  kind: OpsKind;
  title: string;
  description: string;
  status: OpsStatus;
  priority: OpsPriority;
  dueDate: string | null;
  assignee: string | null;
  costCents: number | null;
  reservationId: string | null;
  photos: string[];
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpsTaskInput {
  propertyId: string;
  kind: OpsKind;
  title: string;
  description?: string;
  status?: OpsStatus;
  priority?: OpsPriority;
  dueDate?: string | null;
  assignee?: string | null;
  costCents?: number | null;
  reservationId?: string | null;
  photos?: string[];
  createdBy?: string | null;
}

export interface OpsFilter {
  kind?: OpsKind;
  status?: OpsStatus[];
  propertyId?: string;
  limit?: number;
}

export const KIND_LABEL: Record<OpsKind, string> = {
  turnover: "Cambio de huésped",
  cleaning: "Limpieza",
  maintenance: "Mantenimiento",
  incident: "Incidencia",
};

export const STATUS_LABEL: Record<OpsStatus, string> = {
  open: "Abierta",
  scheduled: "Programada",
  in_progress: "En curso",
  done: "Hecha",
  cancelled: "Cancelada",
};

export const PRIORITY_LABEL: Record<OpsPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const OPEN_STATUSES: OpsStatus[] = ["open", "scheduled", "in_progress"];
