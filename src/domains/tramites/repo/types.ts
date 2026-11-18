import type { Catalog } from "../catalog";
import type {
  AuditEvent,
  ClientMessage,
  Filing,
  FilingEvent,
  ManagedProperty,
  OwnerAccount,
  OwnerDocument,
  OwnerMembership,
  ReservationReport,
  ServiceOrder,
  ServiceSubscription,
} from "../types";

/**
 * Persistencia de «Servicios a propietarios».
 *
 * Una sola interfaz, dos usos:
 *  - Panel interno: instancia sin filtro (clave de servicio, tras comprobar el
 *    permiso del gestor).
 *  - Portal del propietario: la MISMA interfaz pero construida con la sesión del
 *    propio usuario, de forma que en Supabase las políticas RLS filtran por sus
 *    cuentas aunque una consulta olvidara el filtro (ver `scope.ts`).
 */
export interface TramitesStore {
  readonly kind: "memory" | "supabase";

  // Cuentas
  createAccount(a: OwnerAccount): Promise<OwnerAccount>;
  getAccount(id: string): Promise<OwnerAccount | null>;
  listAccounts(): Promise<OwnerAccount[]>;
  updateAccount(id: string, patch: Partial<OwnerAccount>): Promise<OwnerAccount>;
  /** Suma (o resta) reservas de saldo de forma atómica; nunca baja de 0. */
  adjustCredits(accountId: string, delta: number): Promise<number>;

  /** Notas internas del equipo: tabla aparte que el propietario nunca puede leer. */
  getInternalNotes(accountId: string): Promise<string>;
  setInternalNotes(accountId: string, notes: string): Promise<void>;

  addMembership(m: OwnerMembership): Promise<void>;
  listMembershipsByUser(userId: string): Promise<OwnerMembership[]>;
  listMembershipsByAccount(accountId: string): Promise<OwnerMembership[]>;

  // Viviendas
  createProperty(p: ManagedProperty): Promise<ManagedProperty>;
  getProperty(id: string): Promise<ManagedProperty | null>;
  listProperties(filter?: { accountId?: string }): Promise<ManagedProperty[]>;
  updateProperty(id: string, patch: Partial<ManagedProperty>): Promise<ManagedProperty>;

  // Pedidos
  createOrder(o: ServiceOrder): Promise<ServiceOrder>;
  getOrder(id: string): Promise<ServiceOrder | null>;
  listOrders(filter?: { accountId?: string }): Promise<ServiceOrder[]>;
  updateOrder(id: string, patch: Partial<ServiceOrder>): Promise<ServiceOrder>;

  // Expedientes
  createFiling(f: Filing): Promise<Filing>;
  getFiling(id: string): Promise<Filing | null>;
  listFilings(filter?: { accountId?: string; propertyId?: string; orderId?: string }): Promise<Filing[]>;
  updateFiling(id: string, patch: Partial<Filing>): Promise<Filing>;
  addEvent(e: FilingEvent): Promise<void>;
  listEvents(filingId: string): Promise<FilingEvent[]>;

  // Documentos
  addDocument(d: OwnerDocument): Promise<OwnerDocument>;
  getDocument(id: string): Promise<OwnerDocument | null>;
  listDocuments(filter?: { accountId?: string; propertyId?: string; filingId?: string }): Promise<OwnerDocument[]>;
  updateDocument(id: string, patch: Partial<Pick<OwnerDocument, "status" | "reviewNote">>): Promise<OwnerDocument>;
  putBlob(storageKey: string, bytes: Uint8Array, mime: string): Promise<void>;
  /** Contenido del fichero; el llamador ya ha comprobado el permiso sobre la fila. */
  getBlob(storageKey: string): Promise<Uint8Array | null>;

  // Reservas comunicadas por el cliente
  createReport(r: ReservationReport): Promise<ReservationReport>;
  getReport(id: string): Promise<ReservationReport | null>;
  listReports(filter?: { accountId?: string; propertyId?: string }): Promise<ReservationReport[]>;
  updateReport(id: string, patch: Partial<ReservationReport>): Promise<ReservationReport>;

  // Mensajes
  addMessage(m: ClientMessage): Promise<ClientMessage>;
  listMessages(accountId: string): Promise<ClientMessage[]>;
  markMessagesRead(accountId: string, by: "owner" | "admin"): Promise<void>;

  // Suscripciones (plan mensual, desactivado hasta aprobación)
  upsertSubscription(s: ServiceSubscription): Promise<void>;
  listSubscriptions(filter?: { accountId?: string }): Promise<ServiceSubscription[]>;
  getSubscriptionByStripeId(stripeId: string): Promise<ServiceSubscription | null>;

  // Auditoría
  addAudit(e: AuditEvent): Promise<void>;
  listAudit(filter?: { accountId?: string; limit?: number }): Promise<AuditEvent[]>;

  // Catálogo versionado
  getCatalog(): Promise<Catalog | null>;
  saveCatalog(c: Catalog, actor: string): Promise<void>;
}
