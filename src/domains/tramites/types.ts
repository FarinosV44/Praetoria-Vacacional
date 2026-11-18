import type { PlanCode, ServiceCode } from "./catalog";

/**
 * Issue #173 — modelo de datos de «Servicios a propietarios».
 *
 * Es un dominio aparte: los propietarios clientes y sus viviendas NO se mezclan
 * con las reservas ni los huéspedes de nuestros dos apartamentos (#56, #72).
 * Ids opacos (uuid). Ningún dato personal va en URLs, logs ni analítica.
 */

export type OwnerKind = "particular" | "empresa";
export type OwnerAccountStatus = "pendiente_verificacion" | "activo" | "suspendido" | "baja";

export interface OwnerAccount {
  id: string;
  kind: OwnerKind;
  /** Nombre y apellidos o razón social. */
  legalName: string;
  /** NIF/NIE/CIF. Solo visible para el propio cliente y gestores. */
  taxId: string;
  contactName: string;
  email: string;
  phone: string;
  /** Dirección fiscal (facturación). */
  billingAddress: string;
  status: OwnerAccountStatus;
  marketingOptIn: boolean;
  stripeCustomerId: string | null;
  /** Saldo de reservas prepagadas (plan por uso). */
  reservationCredits: number;
  createdAt: string;
  updatedAt: string;
}

export type MembershipRole = "titular" | "colaborador";

export interface OwnerMembership {
  accountId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
}

export type TriState = "si" | "no" | "no_se";

export interface ManagedProperty {
  id: string;
  accountId: string;
  /** Nombre corto que pone el cliente («Ático Cullera»). */
  alias: string;
  street: string;
  postalCode: string;
  municipality: string;
  province: string;
  cadastralRef: string | null;
  /** Número de registro turístico autonómico. */
  tourismRegistryNumber: string | null;
  hasTourismRegistry: TriState;
  /** ¿Está dada de alta en SES.HOSPEDAJES? */
  hasSesAlta: TriState;
  /** Código de establecimiento en SES, cuando lo hay. */
  sesEstablishmentCode: string | null;
  platforms: string[];
  maxGuests: number | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  /** Creado; falta verificar el email antes de pagar. */
  | "pendiente_verificacion"
  /** Listo para pagar. */
  | "pendiente_pago"
  /** Confirmado por webhook firmado (nunca por la URL de vuelta). */
  | "pagado"
  /** Encargo especial sin cobro online (revisión histórica). */
  | "solicitud_especial"
  | "cancelado";

export interface OrderLine {
  propertyId: string | null;
  serviceCode: ServiceCode | "saldo_reservas" | "cuota_mensual";
  description: string;
  quantity: number;
  unitNetCents: number;
  netCents: number;
}

export interface Acceptance {
  termsVersion: string;
  privacyVersion: string;
  mandateVersion: string;
  acceptedAt: string;
  /** Hash del IP (no la IP en claro). */
  ipHash: string | null;
  userAgent: string | null;
}

export interface ServiceOrder {
  id: string;
  /** Referencia corta legible, sin datos personales (TR-7K3Q9P). */
  reference: string;
  accountId: string;
  planCode: PlanCode;
  catalogVersion: string;
  vatRatePercent: number;
  lines: OrderLine[];
  netCents: number;
  vatCents: number;
  totalCents: number;
  status: OrderStatus;
  acceptance: Acceptance;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  invoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Estados de un expediente (#177). La etiqueta para el cliente es más simple. */
export const FILING_STATUSES = [
  "solicitado",
  "pendiente_documentacion",
  "en_revision",
  "listo_para_presentar",
  "presentado",
  "subsanacion",
  "finalizado",
  "incidencia",
  "suspendido",
  "cancelado",
] as const;
export type FilingStatus = (typeof FILING_STATUSES)[number];

export type SubmissionChannel = "ses_hospedajes_web" | "ses_hospedajes_fichero" | "registro_autonomico" | "otro";

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

export interface Filing {
  id: string;
  reference: string;
  accountId: string;
  propertyId: string;
  orderId: string | null;
  reservationReportId: string | null;
  serviceCode: ServiceCode;
  status: FilingStatus;
  title: string;
  /** Fecha límite de referencia (ISO). */
  dueAt: string | null;
  /** Comunicada fuera de plazo o reserva histórica: requiere revisión humana. */
  late: boolean;
  assigneeEmail: string | null;
  checklist: ChecklistItem[];
  /** Documentos que hemos pedido al cliente y aún no ha aportado. */
  requestedDocuments: string[];
  submittedAt: string | null;
  submissionChannel: SubmissionChannel | null;
  /** Código o número de operación que devuelve el organismo. */
  submissionRef: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export type ActorType = "owner" | "admin" | "system";

export interface Actor {
  type: ActorType;
  /** auth user id o email del gestor; nunca datos del huésped. */
  id: string | null;
  label: string;
}

export type FilingEventKind = "creado" | "estado" | "nota" | "documento" | "solicitud" | "presentacion" | "mensaje";

/** Historial inmutable: solo se inserta, nunca se edita ni se borra. */
export interface FilingEvent {
  id: string;
  filingId: string;
  accountId: string;
  at: string;
  actor: Actor;
  kind: FilingEventKind;
  fromStatus: FilingStatus | null;
  toStatus: FilingStatus | null;
  message: string | null;
  visibleToOwner: boolean;
}

export const DOCUMENT_KINDS = [
  "autorizacion_representacion",
  "dni_titular",
  "escritura_o_nota_simple",
  "registro_turistico",
  "contrato_o_reserva",
  "justificante_oficial",
  "otro",
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type DocumentStatus = "recibido" | "validado" | "rechazado";

export interface OwnerDocument {
  id: string;
  accountId: string;
  propertyId: string | null;
  filingId: string | null;
  kind: DocumentKind;
  /** Nombre saneado para mostrar; el fichero se guarda con una clave opaca. */
  filename: string;
  mime: "application/pdf" | "image/png" | "image/jpeg";
  sizeBytes: number;
  /** `<accountId>/<uuid>` dentro del bucket privado. */
  storageKey: string;
  sha256: string;
  status: DocumentStatus;
  /** Justificante oficial subido por el equipo (no editable después). */
  isOfficialProof: boolean;
  uploadedBy: ActorType;
  reviewNote: string | null;
  createdAt: string;
}

/** Hechos que el RD 933/2021 obliga a comunicar, cada uno con su plazo. */
export type ReportEvent = "reserva" | "anulacion" | "entrada";

export interface ReservationReport {
  id: string;
  accountId: string;
  propertyId: string;
  /** Localizador de la plataforma (opcional, sin datos personales). */
  externalRef: string | null;
  channel: string;
  /** Fecha y hora en que se formalizó la reserva (ISO). */
  bookedAt: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
  cancelledAt: string | null;
  /** Fecha en que el cliente nos lo comunicó. */
  reportedAt: string;
  /** Datos de viajeros cifrados (AES-256-GCM). Null si aún no los ha aportado. */
  travellerDataEnc: string | null;
  travellerDataAt: string | null;
  /** Cuándo presentamos cada hecho ante Interior. */
  communicatedReservaAt: string | null;
  communicatedAnulacionAt: string | null;
  communicatedEntradaAt: string | null;
  /** Consumió una reserva del saldo o de la cuota. */
  billing: "saldo" | "cuota" | "pendiente";
  createdAt: string;
}

export type MessageAuthor = "owner" | "admin";

export interface ClientMessage {
  id: string;
  accountId: string;
  filingId: string | null;
  author: MessageAuthor;
  authorLabel: string;
  body: string;
  createdAt: string;
  readByOwnerAt: string | null;
  readByAdminAt: string | null;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: Actor;
  action: string;
  accountId: string | null;
  targetType: string;
  targetId: string | null;
  /** Solo metadatos no personales (ids, estados, tamaños). */
  meta: Record<string, string | number | boolean | null>;
}

export type SubscriptionStatus = "pendiente" | "activa" | "impagada" | "cancelada";

export interface ServiceSubscription {
  id: string;
  accountId: string;
  propertyId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}
