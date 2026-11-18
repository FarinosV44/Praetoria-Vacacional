import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { catalogSchema, type Catalog } from "../catalog";
import type { TramitesStore } from "./types";

/**
 * Implementación Supabase (migración 20261118120000_tramites_propietarios.sql).
 *
 * Recibe el cliente con el que trabajar:
 *  - `supabaseAdmin()` (clave secreta) para el panel interno y las escrituras
 *    del servidor, siempre DESPUÉS de comprobar permisos en la aplicación;
 *  - el cliente con la sesión del propietario para sus lecturas, de modo que
 *    las políticas RLS limitan cada consulta a sus propias cuentas.
 *
 * Las columnas son el snake_case de los campos del modelo; los objetos anidados
 * (líneas, aceptación, checklist, actor, meta) van en columnas jsonb.
 */

export const OWNER_DOCUMENTS_BUCKET = "owner-documents";

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function toRow(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[toSnake(k)] = v;
  return out;
}

function fromRow<T>(row: Record<string, unknown> | null): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out as T;
}

function rows<T>(data: unknown): T[] {
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => fromRow<T>(r)!);
}

function check(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export function supabaseTramites(
  client: () => SupabaseClient | Promise<SupabaseClient>,
): TramitesStore {
  const db = async () => client();

  async function insert<T>(table: string, value: object, what: string): Promise<T> {
    const { data, error } = await (
      await db()
    )
      .from(table)
      .insert(toRow(value))
      .select("*")
      .single();
    check(error, what);
    return fromRow<T>(data)!;
  }
  async function getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await (await db()).from(table).select("*").eq("id", id).maybeSingle();
    check(error, table);
    return fromRow<T>(data);
  }
  async function patch<T>(table: string, id: string, value: object, what: string): Promise<T> {
    const body = toRow(value);
    delete body.id;
    if (table !== "owner_documents" && table !== "reservation_reports")
      body.updated_at = new Date().toISOString();
    const { data, error } = await (
      await db()
    )
      .from(table)
      .update(body)
      .eq("id", id)
      .select("*")
      .single();
    check(error, what);
    return fromRow<T>(data)!;
  }

  return {
    kind: "supabase",

    createAccount: (a) => insert("owner_accounts", a, "Crear cuenta"),
    getAccount: (id) => getById("owner_accounts", id),
    async listAccounts() {
      const { data, error } = await (
        await db()
      )
        .from("owner_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      check(error, "Cuentas");
      return rows(data);
    },
    updateAccount: (id, p) => patch("owner_accounts", id, p, "Actualizar cuenta"),
    async adjustCredits(accountId, delta) {
      const { data, error } = await (
        await db()
      ).rpc("tramites_adjust_credits", {
        p_account: accountId,
        p_delta: Math.trunc(delta),
      });
      check(error, "Saldo de reservas");
      return Number(data ?? 0);
    },

    async getInternalNotes(accountId) {
      const { data, error } = await (
        await db()
      )
        .from("owner_internal_notes")
        .select("notes")
        .eq("account_id", accountId)
        .maybeSingle();
      check(error, "Notas");
      return (data as { notes?: string } | null)?.notes ?? "";
    },
    async setInternalNotes(accountId, notes) {
      const { error } = await (
        await db()
      )
        .from("owner_internal_notes")
        .upsert({ account_id: accountId, notes, updated_at: new Date().toISOString() });
      check(error, "Notas");
    },

    async addMembership(m) {
      const { error } = await (
        await db()
      )
        .from("owner_memberships")
        .upsert(toRow(m), { onConflict: "account_id,user_id", ignoreDuplicates: true });
      check(error, "Miembro");
    },
    async listMembershipsByUser(userId) {
      const { data, error } = await (
        await db()
      )
        .from("owner_memberships")
        .select("*")
        .eq("user_id", userId);
      check(error, "Miembros");
      return rows(data);
    },
    async listMembershipsByAccount(accountId) {
      const { data, error } = await (
        await db()
      )
        .from("owner_memberships")
        .select("*")
        .eq("account_id", accountId);
      check(error, "Miembros");
      return rows(data);
    },

    createProperty: (p) => insert("managed_properties", p, "Crear vivienda"),
    getProperty: (id) => getById("managed_properties", id),
    async listProperties(filter = {}) {
      let q = (await db()).from("managed_properties").select("*").order("created_at");
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      const { data, error } = await q;
      check(error, "Viviendas");
      return rows(data);
    },
    updateProperty: (id, p) => patch("managed_properties", id, p, "Actualizar vivienda"),

    createOrder: (o) => insert("service_orders", o, "Crear pedido"),
    getOrder: (id) => getById("service_orders", id),
    async listOrders(filter = {}) {
      let q = (await db())
        .from("service_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      const { data, error } = await q;
      check(error, "Pedidos");
      return rows(data);
    },
    updateOrder: (id, p) => patch("service_orders", id, p, "Actualizar pedido"),

    createFiling: (f) => insert("filings", f, "Crear expediente"),
    getFiling: (id) => getById("filings", id),
    async listFilings(filter = {}) {
      let q = (await db()).from("filings").select("*").order("created_at", { ascending: false });
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      if (filter.propertyId) q = q.eq("property_id", filter.propertyId);
      if (filter.orderId) q = q.eq("order_id", filter.orderId);
      const { data, error } = await q;
      check(error, "Expedientes");
      return rows(data);
    },
    updateFiling: (id, p) => patch("filings", id, p, "Actualizar expediente"),
    async addEvent(e) {
      const { error } = await (await db()).from("filing_events").insert(toRow(e));
      check(error, "Historial");
    },
    async listEvents(filingId) {
      const { data, error } = await (
        await db()
      )
        .from("filing_events")
        .select("*")
        .eq("filing_id", filingId)
        .order("at");
      check(error, "Historial");
      return rows(data);
    },

    addDocument: (d) => insert("owner_documents", d, "Guardar documento"),
    getDocument: (id) => getById("owner_documents", id),
    async listDocuments(filter = {}) {
      let q = (await db())
        .from("owner_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      if (filter.propertyId) q = q.eq("property_id", filter.propertyId);
      if (filter.filingId) q = q.eq("filing_id", filter.filingId);
      const { data, error } = await q;
      check(error, "Documentos");
      return rows(data);
    },
    updateDocument: (id, p) => patch("owner_documents", id, p, "Actualizar documento"),
    async putBlob(key, bytes, mime) {
      const { error } = await (
        await db()
      ).storage
        .from(OWNER_DOCUMENTS_BUCKET)
        .upload(key, bytes, { contentType: mime, upsert: false });
      check(error, "Subir archivo");
    },
    async getBlob(key) {
      const { data, error } = await (await db()).storage.from(OWNER_DOCUMENTS_BUCKET).download(key);
      if (error || !data) return null;
      return new Uint8Array(await data.arrayBuffer());
    },

    createReport: (r) => insert("reservation_reports", r, "Guardar reserva"),
    getReport: (id) => getById("reservation_reports", id),
    async listReports(filter = {}) {
      let q = (await db())
        .from("reservation_reports")
        .select("*")
        .order("check_in", { ascending: false });
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      if (filter.propertyId) q = q.eq("property_id", filter.propertyId);
      const { data, error } = await q;
      check(error, "Reservas");
      return rows(data);
    },
    updateReport: (id, p) => patch("reservation_reports", id, p, "Actualizar reserva"),

    addMessage: (m) => insert("client_messages", m, "Enviar mensaje"),
    async listMessages(accountId) {
      const { data, error } = await (
        await db()
      )
        .from("client_messages")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at");
      check(error, "Mensajes");
      return rows(data);
    },
    async markMessagesRead(accountId, by) {
      const now = new Date().toISOString();
      const q =
        by === "owner"
          ? (await db())
              .from("client_messages")
              .update({ read_by_owner_at: now })
              .eq("author", "admin")
              .is("read_by_owner_at", null)
          : (await db())
              .from("client_messages")
              .update({ read_by_admin_at: now })
              .eq("author", "owner")
              .is("read_by_admin_at", null);
      const { error } = await q.eq("account_id", accountId);
      check(error, "Mensajes");
    },

    async upsertSubscription(sub) {
      const { error } = await (await db()).from("service_subscriptions").upsert(toRow(sub));
      check(error, "Suscripción");
    },
    async listSubscriptions(filter = {}) {
      let q = (await db()).from("service_subscriptions").select("*");
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      const { data, error } = await q;
      check(error, "Suscripciones");
      return rows(data);
    },
    async getSubscriptionByStripeId(stripeId) {
      const { data, error } = await (
        await db()
      )
        .from("service_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", stripeId)
        .maybeSingle();
      check(error, "Suscripción");
      return fromRow(data);
    },

    async addAudit(e) {
      const { error } = await (await db()).from("tramites_audit").insert(toRow(e));
      check(error, "Auditoría");
    },
    async listAudit(filter = {}) {
      let q = (await db())
        .from("tramites_audit")
        .select("*")
        .order("at", { ascending: false })
        .limit(filter.limit ?? 200);
      if (filter.accountId) q = q.eq("account_id", filter.accountId);
      const { data, error } = await q;
      check(error, "Auditoría");
      return rows(data);
    },

    async getCatalog(): Promise<Catalog | null> {
      const { data, error } = await (
        await db()
      )
        .from("service_price_catalog")
        .select("catalog")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      check(error, "Catálogo");
      const parsed = catalogSchema.safeParse((data as { catalog?: unknown } | null)?.catalog);
      return parsed.success ? parsed.data : null;
    },
    async saveCatalog(c, actor) {
      const { error } = await (
        await db()
      )
        .from("service_price_catalog")
        .insert({ version: c.version, catalog: c, created_by: actor });
      check(error, "Guardar catálogo");
    },
  };
}
