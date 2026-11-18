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
import type { TramitesStore } from "./types";

/**
 * Implementación en memoria (modo demo, CI y tests). Sobrevive a la recarga en
 * caliente de Next guardándose en `globalThis`. Devuelve copias para que nadie
 * mute el estado compartido por accidente.
 */

interface State {
  accounts: Map<string, OwnerAccount>;
  memberships: OwnerMembership[];
  properties: Map<string, ManagedProperty>;
  orders: Map<string, ServiceOrder>;
  filings: Map<string, Filing>;
  events: FilingEvent[];
  documents: Map<string, OwnerDocument>;
  blobs: Map<string, Uint8Array>;
  reports: Map<string, ReservationReport>;
  messages: ClientMessage[];
  subscriptions: Map<string, ServiceSubscription>;
  audit: AuditEvent[];
  catalog: Catalog | null;
  notes: Map<string, string>;
}

function fresh(): State {
  return {
    accounts: new Map(),
    memberships: [],
    properties: new Map(),
    orders: new Map(),
    filings: new Map(),
    events: [],
    documents: new Map(),
    blobs: new Map(),
    reports: new Map(),
    messages: [],
    subscriptions: new Map(),
    audit: [],
    catalog: null,
    notes: new Map(),
  };
}

const g = globalThis as unknown as { __pvTramites?: State };
function s(): State {
  return (g.__pvTramites ??= fresh());
}

/** Solo para tests. */
export function resetMemoryTramites(): void {
  g.__pvTramites = fresh();
}

const clone = <T>(v: T): T => structuredClone(v);
const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

function patchIn<T extends { id: string }>(map: Map<string, T>, id: string, patch: Partial<T>, what: string): T {
  const cur = map.get(id);
  if (!cur) throw new Error(`${what} no encontrado`);
  const next = { ...cur, ...clone(patch), id: cur.id } as T;
  if ("updatedAt" in next) (next as unknown as { updatedAt: string }).updatedAt = new Date().toISOString();
  map.set(id, next);
  return clone(next);
}

export const memoryTramites: TramitesStore = {
  kind: "memory",

  async createAccount(a) {
    s().accounts.set(a.id, clone(a));
    return clone(a);
  },
  async getAccount(id) {
    const a = s().accounts.get(id);
    return a ? clone(a) : null;
  },
  async listAccounts() {
    return [...s().accounts.values()].map(clone).sort(byNewest);
  },
  async updateAccount(id, patch) {
    return patchIn(s().accounts, id, patch, "Cuenta");
  },
  async adjustCredits(accountId, delta) {
    const a = s().accounts.get(accountId);
    if (!a) throw new Error("Cuenta no encontrada");
    a.reservationCredits = Math.max(0, a.reservationCredits + Math.trunc(delta));
    return a.reservationCredits;
  },

  async getInternalNotes(accountId) {
    return s().notes.get(accountId) ?? "";
  },
  async setInternalNotes(accountId, notes) {
    s().notes.set(accountId, notes);
  },

  async addMembership(m) {
    if (!s().memberships.some((x) => x.accountId === m.accountId && x.userId === m.userId))
      s().memberships.push(clone(m));
  },
  async listMembershipsByUser(userId) {
    return s().memberships.filter((m) => m.userId === userId).map(clone);
  },
  async listMembershipsByAccount(accountId) {
    return s().memberships.filter((m) => m.accountId === accountId).map(clone);
  },

  async createProperty(p) {
    s().properties.set(p.id, clone(p));
    return clone(p);
  },
  async getProperty(id) {
    const p = s().properties.get(id);
    return p ? clone(p) : null;
  },
  async listProperties(filter = {}) {
    return [...s().properties.values()]
      .filter((p) => !filter.accountId || p.accountId === filter.accountId)
      .map(clone)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async updateProperty(id, patch) {
    return patchIn(s().properties, id, patch, "Vivienda");
  },

  async createOrder(o) {
    s().orders.set(o.id, clone(o));
    return clone(o);
  },
  async getOrder(id) {
    const o = s().orders.get(id);
    return o ? clone(o) : null;
  },
  async listOrders(filter = {}) {
    return [...s().orders.values()]
      .filter((o) => !filter.accountId || o.accountId === filter.accountId)
      .map(clone)
      .sort(byNewest);
  },
  async updateOrder(id, patch) {
    return patchIn(s().orders, id, patch, "Pedido");
  },

  async createFiling(f) {
    s().filings.set(f.id, clone(f));
    return clone(f);
  },
  async getFiling(id) {
    const f = s().filings.get(id);
    return f ? clone(f) : null;
  },
  async listFilings(filter = {}) {
    return [...s().filings.values()]
      .filter(
        (f) =>
          (!filter.accountId || f.accountId === filter.accountId) &&
          (!filter.propertyId || f.propertyId === filter.propertyId) &&
          (!filter.orderId || f.orderId === filter.orderId),
      )
      .map(clone)
      .sort(byNewest);
  },
  async updateFiling(id, patch) {
    return patchIn(s().filings, id, patch, "Expediente");
  },
  async addEvent(e) {
    s().events.push(clone(e));
  },
  async listEvents(filingId) {
    return s()
      .events.filter((e) => e.filingId === filingId)
      .map(clone)
      .sort((a, b) => a.at.localeCompare(b.at));
  },

  async addDocument(d) {
    s().documents.set(d.id, clone(d));
    return clone(d);
  },
  async getDocument(id) {
    const d = s().documents.get(id);
    return d ? clone(d) : null;
  },
  async listDocuments(filter = {}) {
    return [...s().documents.values()]
      .filter(
        (d) =>
          (!filter.accountId || d.accountId === filter.accountId) &&
          (!filter.propertyId || d.propertyId === filter.propertyId) &&
          (!filter.filingId || d.filingId === filter.filingId),
      )
      .map(clone)
      .sort(byNewest);
  },
  async updateDocument(id, patch) {
    return patchIn<OwnerDocument>(s().documents, id, patch, "Documento");
  },
  async putBlob(key, bytes) {
    s().blobs.set(key, new Uint8Array(bytes));
  },
  async getBlob(key) {
    const b = s().blobs.get(key);
    return b ? new Uint8Array(b) : null;
  },

  async createReport(r) {
    s().reports.set(r.id, clone(r));
    return clone(r);
  },
  async getReport(id) {
    const r = s().reports.get(id);
    return r ? clone(r) : null;
  },
  async listReports(filter = {}) {
    return [...s().reports.values()]
      .filter(
        (r) => (!filter.accountId || r.accountId === filter.accountId) && (!filter.propertyId || r.propertyId === filter.propertyId),
      )
      .map(clone)
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  },
  async updateReport(id, patch) {
    return patchIn(s().reports, id, patch, "Reserva");
  },

  async addMessage(m) {
    s().messages.push(clone(m));
    return clone(m);
  },
  async listMessages(accountId) {
    return s()
      .messages.filter((m) => m.accountId === accountId)
      .map(clone)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async markMessagesRead(accountId, by) {
    const now = new Date().toISOString();
    for (const m of s().messages) {
      if (m.accountId !== accountId) continue;
      if (by === "owner" && m.author === "admin" && !m.readByOwnerAt) m.readByOwnerAt = now;
      if (by === "admin" && m.author === "owner" && !m.readByAdminAt) m.readByAdminAt = now;
    }
  },

  async upsertSubscription(sub) {
    s().subscriptions.set(sub.id, clone(sub));
  },
  async listSubscriptions(filter = {}) {
    return [...s().subscriptions.values()].filter((x) => !filter.accountId || x.accountId === filter.accountId).map(clone);
  },
  async getSubscriptionByStripeId(stripeId) {
    const x = [...s().subscriptions.values()].find((v) => v.stripeSubscriptionId === stripeId);
    return x ? clone(x) : null;
  },

  async addAudit(e) {
    s().audit.push(clone(e));
  },
  async listAudit(filter = {}) {
    return s()
      .audit.filter((e) => !filter.accountId || e.accountId === filter.accountId)
      .map(clone)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, filter.limit ?? 200);
  },

  async getCatalog() {
    return s().catalog ? clone(s().catalog) : null;
  },
  async saveCatalog(c) {
    s().catalog = clone(c);
  },
};
