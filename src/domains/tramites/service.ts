import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { DEFAULT_CATALOG, catalogSchema, serviceByCode, type Catalog, type ServiceCode } from "./catalog";
import { buildCreditsQuote, buildQuote, type Quote } from "./pricing";
import { deadlineFor, reportedLate } from "./deadlines";
import { canTransition, defaultChecklist, filingTitle, OWNER_STATUS, STATUS_LABEL } from "./workflow";
import { checkUpload } from "./upload";
import { encryptJson, decryptJson, travellerEncryptionReady } from "./crypto";
import { shortRef } from "./ids";
import { ownerReadStore, serverStore } from "./repo";
import { ownsAccount, type OwnerContext } from "./context";
import * as mail from "./emails";
import { TRAMITES_LEGAL_VERSIONS } from "@/content/tramites-legal";
import type { EngagementInput, ReservationReportInput, TravellerBundle } from "./schema";
import type {
  Actor,
  AuditEvent,
  DocumentKind,
  Filing,
  FilingEvent,
  FilingStatus,
  ManagedProperty,
  OrderLine,
  OwnerAccount,
  OwnerDocument,
  ReservationReport,
  ServiceOrder,
  SubmissionChannel,
} from "./types";

/**
 * Reglas de negocio de «Servicios a propietarios» (#173–#178). Las server
 * actions validan la entrada y la sesión; aquí se aplican las reglas y se deja
 * rastro en el historial y la auditoría.
 */

const now = () => new Date().toISOString();

// ------------------------------------------------------------- catálogo ----

export async function getActiveCatalog(): Promise<Catalog> {
  try {
    return (await serverStore().getCatalog()) ?? DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}

export async function saveCatalog(raw: unknown, actor: Actor): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Catálogo no válido." };
  const current = await getActiveCatalog();
  if (parsed.data.version === current.version)
    return { ok: false, error: "Cambia el nombre de la versión: los encargos anteriores conservan la suya." };
  await serverStore().saveCatalog(parsed.data, actor.label);
  await audit(actor, "catalogo.guardar", null, "catalogo", parsed.data.version, {});
  return { ok: true };
}

// ------------------------------------------------------------ auditoría ----

export async function audit(
  actor: Actor,
  action: string,
  accountId: string | null,
  targetType: string,
  targetId: string | null,
  meta: AuditEvent["meta"],
): Promise<void> {
  try {
    await serverStore().addAudit({ id: randomUUID(), at: now(), actor, action, accountId, targetType, targetId, meta });
  } catch {
    /* la auditoría nunca bloquea la operación */
  }
}

async function event(
  filing: Pick<Filing, "id" | "accountId">,
  actor: Actor,
  kind: FilingEvent["kind"],
  opts: { from?: FilingStatus | null; to?: FilingStatus | null; message?: string | null; visibleToOwner?: boolean } = {},
): Promise<void> {
  await serverStore().addEvent({
    id: randomUUID(),
    filingId: filing.id,
    accountId: filing.accountId,
    at: now(),
    actor,
    kind,
    fromStatus: opts.from ?? null,
    toStatus: opts.to ?? null,
    message: opts.message ?? null,
    visibleToOwner: opts.visibleToOwner ?? true,
  });
}

export const SYSTEM: Actor = { type: "system", id: null, label: "Sistema" };
export const ownerActor = (ctx: OwnerContext): Actor => ({ type: "owner", id: ctx.session.userId, label: "Cliente" });

// ---------------------------------------------------- alta y contratación ----

export interface EngagementResult {
  ok: true;
  orderId: string | null;
  needsVerification: boolean;
  /** Solo en modo demo: enlace de verificación que normalmente iría por correo. */
  demoVerifyToken?: string;
}

/**
 * Crea la cuenta del propietario, sus viviendas y el pedido con el precio que
 * calcula el servidor. El pago llega después, cuando el email está verificado.
 */
export async function createEngagement(
  input: EngagementInput,
  auth: { userId: string; existingAccountId: string | null; emailVerified: boolean },
  meta: { ipHash: string | null; userAgent: string | null },
): Promise<EngagementResult | { ok: false; error: string; quote?: Quote }> {
  const catalog = await getActiveCatalog();
  const quote = buildQuote(catalog, {
    planCode: input.planCode,
    // Ids temporales («#0», «#1»…) que luego se sustituyen por los reales.
    properties: input.properties.map((p, i) => ({ propertyId: `#${i}`, alias: p.alias, sesAlta: p.wantsSesAlta })),
    reservationCredits: input.reservationCredits,
    historicalReview: input.historicalReview,
  });
  if (!quote.ok) return { ok: false, error: quote.errors[0] ?? "Revisa los servicios elegidos.", quote };

  const store = serverStore();
  const at = now();

  let account: OwnerAccount | null = auth.existingAccountId ? await store.getAccount(auth.existingAccountId) : null;
  if (!account) {
    account = await store.createAccount({
      id: randomUUID(),
      kind: input.owner.kind,
      legalName: input.owner.legalName,
      taxId: input.owner.taxId,
      contactName: input.owner.contactName,
      email: input.owner.email,
      phone: input.owner.phone,
      billingAddress: input.owner.billingAddress,
      status: auth.emailVerified ? "activo" : "pendiente_verificacion",
      marketingOptIn: input.marketingOptIn,
      stripeCustomerId: null,
      reservationCredits: 0,
      createdAt: at,
      updatedAt: at,
    });
    await store.addMembership({ accountId: account.id, userId: auth.userId, role: "titular", createdAt: at });
  }

  const properties: ManagedProperty[] = [];
  for (const p of input.properties) {
    properties.push(
      await store.createProperty({
        id: randomUUID(),
        accountId: account.id,
        alias: p.alias,
        street: p.street,
        postalCode: p.postalCode,
        municipality: p.municipality,
        province: p.province,
        cadastralRef: null,
        tourismRegistryNumber: p.tourismRegistryNumber || null,
        hasTourismRegistry: p.hasTourismRegistry,
        hasSesAlta: p.hasSesAlta,
        sesEstablishmentCode: null,
        platforms: p.platforms,
        maxGuests: null,
        createdAt: at,
        updatedAt: at,
      }),
    );
  }

  const lines: OrderLine[] = quote.lines.map((l) => {
    if (!l.propertyId?.startsWith("#")) return l;
    return { ...l, propertyId: properties[Number(l.propertyId.slice(1))]?.id ?? null };
  });

  const payable = quote.totalCents > 0;
  const order = await store.createOrder({
    id: randomUUID(),
    reference: shortRef("TR"),
    accountId: account.id,
    planCode: input.planCode,
    catalogVersion: quote.catalogVersion,
    vatRatePercent: quote.vatRatePercent,
    lines,
    netCents: quote.netCents,
    vatCents: quote.vatCents,
    totalCents: quote.totalCents,
    status: !payable ? "solicitud_especial" : auth.emailVerified ? "pendiente_pago" : "pendiente_verificacion",
    acceptance: {
      termsVersion: TRAMITES_LEGAL_VERSIONS.terms,
      privacyVersion: TRAMITES_LEGAL_VERSIONS.privacy,
      mandateVersion: TRAMITES_LEGAL_VERSIONS.mandate,
      acceptedAt: at,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent?.slice(0, 200) ?? null,
    },
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    invoiceUrl: null,
    paidAt: null,
    createdAt: at,
    updatedAt: at,
  });

  // El estudio de reservas anteriores no se cobra online: abre un expediente
  // que el equipo revisa y presupuesta (#175).
  if (input.historicalReview && properties[0]) {
    const filing = await openFiling({
      accountId: account.id,
      property: properties[0],
      serviceCode: "revision_historica",
      orderId: order.id,
      status: "solicitado",
      late: true,
    });
    if (input.historicalNotes)
      await event(filing, { type: "owner", id: auth.userId, label: "Cliente" }, "nota", {
        message: input.historicalNotes,
        visibleToOwner: true,
      });
  }

  await audit({ type: "owner", id: auth.userId, label: "Cliente" }, "alta.crear", account.id, "pedido", order.id, {
    viviendas: properties.length,
    plan: input.planCode,
    total: order.totalCents,
    termsVersion: TRAMITES_LEGAL_VERSIONS.terms,
  });
  if (!payable) await mail.emailInternalNewOrder(order, "solicitud_especial").catch(() => undefined);

  return { ok: true, orderId: payable ? order.id : null, needsVerification: !auth.emailVerified };
}

/** Primer acceso tras verificar el email: activa la cuenta y deja los pedidos listos para pagar. */
export async function activateAfterVerification(accountId: string): Promise<void> {
  const store = serverStore();
  const account = await store.getAccount(accountId);
  if (!account || account.status !== "pendiente_verificacion") return;
  await store.updateAccount(accountId, { status: "activo" });
  for (const o of await store.listOrders({ accountId })) {
    if (o.status === "pendiente_verificacion") await store.updateOrder(o.id, { status: "pendiente_pago" });
  }
  await audit(SYSTEM, "cuenta.verificada", accountId, "cuenta", accountId, {});
}

async function openFiling(o: {
  accountId: string;
  property: ManagedProperty;
  serviceCode: ServiceCode;
  orderId: string | null;
  status: FilingStatus;
  late?: boolean;
  dueAt?: string | null;
  reservationReportId?: string | null;
}): Promise<Filing> {
  const at = now();
  const filing = await serverStore().createFiling({
    id: randomUUID(),
    reference: shortRef("EX"),
    accountId: o.accountId,
    propertyId: o.property.id,
    orderId: o.orderId,
    reservationReportId: o.reservationReportId ?? null,
    serviceCode: o.serviceCode,
    status: o.status,
    title: filingTitle(o.serviceCode, o.property.alias),
    dueAt: o.dueAt ?? null,
    late: o.late ?? false,
    assigneeEmail: null,
    checklist: defaultChecklist(o.serviceCode),
    requestedDocuments: [],
    submittedAt: null,
    submissionChannel: null,
    submissionRef: null,
    createdAt: at,
    updatedAt: at,
    closedAt: null,
  });
  await event(filing, SYSTEM, "creado", { to: o.status, message: "Expediente abierto." });
  return filing;
}

// ------------------------------------------------------------------ pagos ----

/**
 * Confirmación del pago. SOLO la llaman el webhook firmado de Stripe y el
 * simulador del modo demo; nunca la URL de vuelta. Idempotente.
 */
export async function markOrderPaid(
  orderId: string,
  p: { paymentIntentId: string | null; checkoutSessionId: string | null; amountCents: number; invoiceUrl?: string | null },
): Promise<{ ok: boolean; already?: boolean; reason?: string }> {
  const store = serverStore();
  const order = await store.getOrder(orderId);
  if (!order) return { ok: false, reason: "pedido inexistente" };
  if (order.status === "pagado") return { ok: true, already: true };
  if (order.status === "cancelado") return { ok: false, reason: "pedido cancelado" };
  if (p.amountCents !== order.totalCents) {
    await audit(SYSTEM, "pago.importe_distinto", order.accountId, "pedido", order.id, {
      esperado: order.totalCents,
      recibido: p.amountCents,
    });
    return { ok: false, reason: "importe distinto" };
  }

  await store.updateOrder(order.id, {
    status: "pagado",
    paidAt: now(),
    stripePaymentIntentId: p.paymentIntentId,
    stripeCheckoutSessionId: p.checkoutSessionId ?? order.stripeCheckoutSessionId,
    invoiceUrl: p.invoiceUrl ?? null,
  });

  // Efectos del encargo.
  const credits = order.lines.filter((l) => l.serviceCode === "saldo_reservas").reduce((s, l) => s + l.quantity, 0);
  if (credits > 0) await store.adjustCredits(order.accountId, credits);

  const properties = await store.listProperties({ accountId: order.accountId });
  for (const line of order.lines) {
    if (line.serviceCode !== "ses_alta" || !line.propertyId) continue;
    const prop = properties.find((x) => x.id === line.propertyId);
    if (!prop) continue;
    const f = await openFiling({
      accountId: order.accountId,
      property: prop,
      serviceCode: "ses_alta",
      orderId: order.id,
      status: "pendiente_documentacion",
    });
    await store.updateFiling(f.id, { requestedDocuments: ["autorizacion_representacion", "dni_titular", "registro_turistico"] });
    await event(f, SYSTEM, "solicitud", {
      message:
        "Para preparar el alta necesitamos: la autorización de representación firmada, el documento de identidad del titular y el justificante del registro turístico de la vivienda.",
    });
  }

  // Si había reservas comunicadas sin saldo, se cubren con el saldo nuevo.
  if (credits > 0) await settlePendingReports(order.accountId);

  const fresh = (await store.getOrder(order.id))!;
  await audit(SYSTEM, "pago.confirmado", order.accountId, "pedido", order.id, { total: order.totalCents, credits });
  const account = await store.getAccount(order.accountId);
  if (account) await mail.emailOrderPaid(account.email, fresh).catch(() => undefined);
  await mail.emailInternalNewOrder(fresh, "pagado").catch(() => undefined);
  return { ok: true };
}

export async function markOrderPaymentFailed(orderId: string): Promise<void> {
  const order = await serverStore().getOrder(orderId);
  if (!order || order.status !== "pendiente_pago") return;
  await audit(SYSTEM, "pago.fallido", order.accountId, "pedido", order.id, {});
}

async function settlePendingReports(accountId: string): Promise<void> {
  const store = serverStore();
  const pending = (await store.listReports({ accountId })).filter((r) => r.billing === "pendiente");
  for (const r of pending.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const acc = await store.getAccount(accountId);
    if (!acc || acc.reservationCredits < 1) break;
    await store.adjustCredits(accountId, -1);
    await store.updateReport(r.id, { billing: "saldo" });
  }
}

/** Compra de más saldo de reservas desde el portal. */
export async function createCreditsOrder(ctx: OwnerContext, credits: number) {
  const catalog = await getActiveCatalog();
  const quote = buildCreditsQuote(catalog, credits);
  if (!quote.ok) return { ok: false as const, error: quote.errors[0] ?? "Cantidad no válida." };
  const at = now();
  const order = await serverStore().createOrder({
    id: randomUUID(),
    reference: shortRef("TR"),
    accountId: ctx.account.id,
    planCode: "por_uso",
    catalogVersion: quote.catalogVersion,
    vatRatePercent: quote.vatRatePercent,
    lines: quote.lines,
    netCents: quote.netCents,
    vatCents: quote.vatCents,
    totalCents: quote.totalCents,
    status: "pendiente_pago",
    acceptance: {
      termsVersion: TRAMITES_LEGAL_VERSIONS.terms,
      privacyVersion: TRAMITES_LEGAL_VERSIONS.privacy,
      mandateVersion: TRAMITES_LEGAL_VERSIONS.mandate,
      acceptedAt: at,
      ipHash: null,
      userAgent: null,
    },
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    invoiceUrl: null,
    paidAt: null,
    createdAt: at,
    updatedAt: at,
  });
  await audit(ownerActor(ctx), "saldo.pedido", ctx.account.id, "pedido", order.id, { credits });
  return { ok: true as const, orderId: order.id };
}

// ------------------------------------------------- portal: lecturas seguras ----

/** Lectura de una fila del portal: RLS en Supabase + comprobación explícita. */
export async function ownerGet<T extends { accountId: string }>(
  ctx: OwnerContext,
  load: (s: ReturnType<typeof ownerReadStore>) => Promise<T | null>,
): Promise<T | null> {
  const row = await load(ownerReadStore());
  return row && ownsAccount(ctx, row.accountId) ? row : null;
}

// -------------------------------------------------- portal: reservas ----

export async function reportReservation(ctx: OwnerContext, input: ReservationReportInput) {
  const store = serverStore();
  const property = await store.getProperty(input.propertyId);
  if (!property || !ownsAccount(ctx, property.accountId)) return { ok: false as const, error: "Vivienda no encontrada." };

  const account = (await store.getAccount(property.accountId))!;
  const at = now();
  const bookedAt = new Date(input.bookedAt).toISOString();
  let billing: ReservationReport["billing"] = "pendiente";
  if (account.reservationCredits > 0) {
    await store.adjustCredits(account.id, -1);
    billing = "saldo";
  }

  const report = await store.createReport({
    id: randomUUID(),
    accountId: account.id,
    propertyId: property.id,
    externalRef: input.externalRef || null,
    channel: input.channel,
    bookedAt,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    travellers: input.travellers,
    cancelledAt: null,
    reportedAt: at,
    travellerDataEnc: null,
    travellerDataAt: null,
    communicatedReservaAt: null,
    communicatedAnulacionAt: null,
    communicatedEntradaAt: null,
    billing,
    createdAt: at,
  });

  const late = reportedLate(report);
  const filing = await openFiling({
    accountId: account.id,
    property,
    serviceCode: "comunicacion_reserva",
    orderId: null,
    status: billing === "pendiente" ? "pendiente_documentacion" : "en_revision",
    late,
    dueAt: deadlineFor(report, "reserva")?.toISOString() ?? null,
    reservationReportId: report.id,
  });
  if (late)
    await event(filing, SYSTEM, "nota", {
      message:
        "Nos has comunicado la reserva cuando ya había pasado el plazo de 24 horas desde que se formalizó. La presentaremos igualmente, pero comunicarla tarde no borra el retraso.",
    });
  if (billing === "pendiente")
    await event(filing, SYSTEM, "solicitud", {
      message: "No te queda saldo de reservas. Compra más saldo en «Pagos» para que podamos tramitarla.",
    });

  await audit(ownerActor(ctx), "reserva.comunicar", account.id, "reserva", report.id, { late, billing });
  await mail.emailInternalOwnerActivity("Nueva reserva comunicada", account.id).catch(() => undefined);
  return { ok: true as const, reportId: report.id, filingId: filing.id, late, billing };
}

export async function cancelReservation(ctx: OwnerContext, reportId: string, cancelledAtIso: string) {
  const store = serverStore();
  const report = await store.getReport(reportId);
  if (!report || !ownsAccount(ctx, report.accountId)) return { ok: false as const, error: "Reserva no encontrada." };
  if (report.cancelledAt) return { ok: false as const, error: "Esta reserva ya consta como anulada." };
  const cancelledAt = new Date(cancelledAtIso).toISOString();
  await store.updateReport(report.id, { cancelledAt });
  const filing = (await store.listFilings({ accountId: report.accountId })).find((f) => f.reservationReportId === report.id);
  if (filing) {
    await store.updateFiling(filing.id, {
      dueAt: deadlineFor({ ...report, cancelledAt }, "anulacion")?.toISOString() ?? filing.dueAt,
    });
    await event(filing, ownerActor(ctx), "nota", { message: "El cliente comunica la anulación de la reserva." });
  }
  await audit(ownerActor(ctx), "reserva.anular", report.accountId, "reserva", report.id, {});
  await mail.emailInternalOwnerActivity("Reserva anulada por el cliente", report.accountId).catch(() => undefined);
  return { ok: true as const };
}

export async function saveTravellerData(ctx: OwnerContext, reportId: string, bundle: TravellerBundle) {
  if (!travellerEncryptionReady())
    return { ok: false as const, error: "Ahora mismo no podemos recibir datos de viajeros. Escríbenos y lo resolvemos." };
  for (const t of bundle.travellers) {
    if (t.docType !== "NINGUNO" && !t.docNumber)
      return { ok: false as const, error: "Falta el número de documento de algún viajero." };
  }
  const store = serverStore();
  const report = await store.getReport(reportId);
  if (!report || !ownsAccount(ctx, report.accountId)) return { ok: false as const, error: "Reserva no encontrada." };
  if (bundle.travellers.length > report.travellers + 2)
    return { ok: false as const, error: "Hay más viajeros que los indicados en la reserva." };
  await store.updateReport(report.id, { travellerDataEnc: encryptJson(bundle), travellerDataAt: now() });
  const filing = (await store.listFilings({ accountId: report.accountId })).find((f) => f.reservationReportId === report.id);
  if (filing) {
    await event(filing, ownerActor(ctx), "documento", {
      message: `Datos de ${bundle.travellers.length} ${bundle.travellers.length === 1 ? "viajero" : "viajeros"} recibidos.`,
    });
    if (filing.status === "pendiente_documentacion" && report.billing !== "pendiente")
      await transition(filing.id, "en_revision", SYSTEM, "Datos de viajeros completos.");
  }
  await audit(ownerActor(ctx), "viajeros.guardar", report.accountId, "reserva", report.id, {
    viajeros: bundle.travellers.length,
  });
  return { ok: true as const };
}

/** Solo gestores con `tramites.sensitive`: descifra y deja constancia. */
export async function readTravellerData(reportId: string, actor: Actor): Promise<TravellerBundle | null> {
  const report = await serverStore().getReport(reportId);
  if (!report?.travellerDataEnc) return null;
  await audit(actor, "viajeros.ver", report.accountId, "reserva", report.id, {});
  return decryptJson<TravellerBundle>(report.travellerDataEnc);
}

// -------------------------------------------------- documentos ----

export async function storeDocument(o: {
  accountId: string;
  propertyId: string | null;
  filingId: string | null;
  kind: DocumentKind;
  name: string;
  bytes: Uint8Array;
  actor: Actor;
  officialProof?: boolean;
}): Promise<{ ok: true; doc: OwnerDocument } | { ok: false; error: string }> {
  const check = checkUpload(o.name, o.bytes);
  if (!check.ok) return check;
  const store = serverStore();
  if (o.propertyId) {
    const p = await store.getProperty(o.propertyId);
    if (!p || p.accountId !== o.accountId) return { ok: false, error: "Vivienda no válida." };
  }
  let filing: Filing | null = null;
  if (o.filingId) {
    filing = await store.getFiling(o.filingId);
    if (!filing || filing.accountId !== o.accountId) return { ok: false, error: "Expediente no válido." };
  }
  const id = randomUUID();
  const storageKey = `${o.accountId}/${randomUUID()}`;
  await store.putBlob(storageKey, o.bytes, check.mime);
  const doc = await store.addDocument({
    id,
    accountId: o.accountId,
    propertyId: o.propertyId ?? filing?.propertyId ?? null,
    filingId: o.filingId,
    kind: o.officialProof ? "justificante_oficial" : o.kind,
    filename: check.filename,
    mime: check.mime,
    sizeBytes: o.bytes.length,
    storageKey,
    sha256: createHash("sha256").update(o.bytes).digest("hex"),
    status: o.officialProof ? "validado" : "recibido",
    isOfficialProof: !!o.officialProof,
    uploadedBy: o.actor.type,
    reviewNote: null,
    createdAt: now(),
  });
  if (filing) {
    const remaining = filing.requestedDocuments.filter((k) => k !== doc.kind);
    if (remaining.length !== filing.requestedDocuments.length) await store.updateFiling(filing.id, { requestedDocuments: remaining });
    await event(filing, o.actor, "documento", {
      message: o.officialProof ? `Justificante oficial añadido: ${doc.filename}` : `Documento recibido: ${doc.filename}`,
    });
  }
  await audit(o.actor, o.officialProof ? "documento.justificante" : "documento.subir", o.accountId, "documento", doc.id, {
    tipo: doc.kind,
    bytes: doc.sizeBytes,
  });
  if (o.actor.type === "owner")
    await mail.emailInternalOwnerActivity("Documento recibido de un cliente", o.accountId).catch(() => undefined);
  return { ok: true, doc };
}

/** Descarga del propietario: fila vía RLS + pertenencia; archivo vía storage RLS. */
export async function ownerDownload(ctx: OwnerContext, docId: string) {
  const doc = await ownerGet(ctx, (s) => s.getDocument(docId));
  if (!doc) return null;
  const bytes = await ownerReadStore().getBlob(doc.storageKey);
  if (!bytes) return null;
  await audit(ownerActor(ctx), "documento.descargar", doc.accountId, "documento", doc.id, {});
  return { doc, bytes };
}

export async function adminDownload(docId: string, actor: Actor) {
  const store = serverStore();
  const doc = await store.getDocument(docId);
  if (!doc) return null;
  const bytes = await store.getBlob(doc.storageKey);
  if (!bytes) return null;
  await audit(actor, "documento.descargar", doc.accountId, "documento", doc.id, {});
  return { doc, bytes };
}

export async function reviewDocument(docId: string, status: "validado" | "rechazado", note: string, actor: Actor) {
  const store = serverStore();
  const doc = await store.getDocument(docId);
  if (!doc) return { ok: false as const, error: "Documento no encontrado." };
  if (doc.isOfficialProof) return { ok: false as const, error: "Un justificante oficial no se revisa ni se sustituye." };
  await store.updateDocument(doc.id, { status, reviewNote: note || null });
  if (doc.filingId) {
    const filing = await store.getFiling(doc.filingId);
    if (filing) {
      await event(filing, actor, "documento", {
        message: status === "validado" ? `Documento validado: ${doc.filename}` : `Documento no válido: ${doc.filename}${note ? ` — ${note}` : ""}`,
      });
      if (status === "rechazado" && !filing.requestedDocuments.includes(doc.kind))
        await store.updateFiling(filing.id, { requestedDocuments: [...filing.requestedDocuments, doc.kind] });
    }
  }
  await audit(actor, `documento.${status}`, doc.accountId, "documento", doc.id, {});
  return { ok: true as const };
}

// ----------------------------------------------- expedientes (panel) ----

export async function transition(filingId: string, to: FilingStatus, actor: Actor, note?: string) {
  const store = serverStore();
  const filing = await store.getFiling(filingId);
  if (!filing) return { ok: false as const, error: "Expediente no encontrado." };
  const docs = await store.listDocuments({ filingId });
  const check = canTransition(filing.status, to, {
    submittedAt: filing.submittedAt,
    submissionChannel: filing.submissionChannel,
    hasOfficialProof: docs.some((d) => d.isOfficialProof),
  });
  if (!check.ok) return { ok: false as const, error: check.reason };
  const closing = to === "finalizado" || to === "cancelado";
  await store.updateFiling(filing.id, { status: to, ...(closing ? { closedAt: now() } : {}) });
  await event(filing, actor, "estado", { from: filing.status, to, message: note || null });
  await audit(actor, "expediente.estado", filing.accountId, "expediente", filing.id, { de: filing.status, a: to });

  const notify: FilingStatus[] = ["pendiente_documentacion", "presentado", "subsanacion", "finalizado"];
  if (actor.type === "admin" && notify.includes(to)) {
    const account = await store.getAccount(filing.accountId);
    if (account) {
      const fn = to === "pendiente_documentacion" ? mail.emailDocumentsRequested(account.email, filing.reference, filing.id)
        : mail.emailFilingUpdate(account.email, filing.reference, filing.id, OWNER_STATUS[to].label);
      await fn.catch(() => undefined);
    }
  }
  return { ok: true as const };
}

export async function requestDocuments(filingId: string, kinds: DocumentKind[], message: string, actor: Actor) {
  const store = serverStore();
  const filing = await store.getFiling(filingId);
  if (!filing) return { ok: false as const, error: "Expediente no encontrado." };
  const merged = [...new Set([...filing.requestedDocuments, ...kinds])];
  await store.updateFiling(filing.id, { requestedDocuments: merged });
  await event(filing, actor, "solicitud", { message: message || "Necesitamos documentación adicional." });
  await audit(actor, "expediente.solicitar_documentos", filing.accountId, "expediente", filing.id, { tipos: kinds.join(",") });
  if (filing.status !== "pendiente_documentacion" && canTransition(filing.status, "pendiente_documentacion").ok) {
    return transition(filing.id, "pendiente_documentacion", actor);
  }
  const account = await store.getAccount(filing.accountId);
  if (account) await mail.emailDocumentsRequested(account.email, filing.reference, filing.id).catch(() => undefined);
  return { ok: true as const };
}

/**
 * Registro de una presentación MANUAL ante el organismo (#177 fase 1): fecha
 * real, canal y código de operación. No se simula ningún envío automático.
 */
export async function registerSubmission(
  filingId: string,
  s: { submittedAt: string; channel: SubmissionChannel; ref: string; reportEvent?: "reserva" | "anulacion" | "entrada" | null },
  actor: Actor,
) {
  const store = serverStore();
  const filing = await store.getFiling(filingId);
  if (!filing) return { ok: false as const, error: "Expediente no encontrado." };
  const submittedAt = new Date(s.submittedAt);
  if (Number.isNaN(submittedAt.getTime()) || submittedAt.getTime() > Date.now() + 5 * 60_000)
    return { ok: false as const, error: "La fecha de presentación no puede ser futura." };
  await store.updateFiling(filing.id, {
    submittedAt: submittedAt.toISOString(),
    submissionChannel: s.channel,
    submissionRef: s.ref || filing.submissionRef,
  });
  if (filing.reservationReportId && s.reportEvent) {
    const field =
      s.reportEvent === "reserva" ? "communicatedReservaAt" : s.reportEvent === "anulacion" ? "communicatedAnulacionAt" : "communicatedEntradaAt";
    await store.updateReport(filing.reservationReportId, { [field]: submittedAt.toISOString() });
  }
  const label = s.reportEvent ? ` (${s.reportEvent})` : "";
  await event(filing, actor, "presentacion", {
    message: `Presentado${label} el ${submittedAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}${s.ref ? ` · código ${s.ref}` : ""}.`,
  });
  await audit(actor, "expediente.presentacion", filing.accountId, "expediente", filing.id, {
    canal: s.channel,
    hecho: s.reportEvent ?? null,
  });
  const fresh = (await store.getFiling(filing.id))!;
  if (fresh.status === "listo_para_presentar" || fresh.status === "subsanacion" || fresh.status === "en_revision") {
    if (canTransition(fresh.status, "presentado", { submittedAt: fresh.submittedAt, submissionChannel: fresh.submissionChannel }).ok)
      return transition(fresh.id, "presentado", actor);
  }
  return { ok: true as const };
}

export async function setChecklistItem(filingId: string, key: string, done: boolean, actor: Actor) {
  const store = serverStore();
  const filing = await store.getFiling(filingId);
  if (!filing) return;
  await store.updateFiling(filing.id, { checklist: filing.checklist.map((c) => (c.key === key ? { ...c, done } : c)) });
  await event(filing, actor, "nota", {
    message: `${done ? "Hecho" : "Pendiente"}: ${filing.checklist.find((c) => c.key === key)?.label ?? key}`,
    visibleToOwner: false,
  });
}

export async function addInternalNote(filingId: string, note: string, actor: Actor) {
  const filing = await serverStore().getFiling(filingId);
  if (!filing || !note.trim()) return;
  await event(filing, actor, "nota", { message: note.trim().slice(0, 2000), visibleToOwner: false });
}

export async function assignFiling(filingId: string, email: string | null, actor: Actor) {
  const store = serverStore();
  const filing = await store.getFiling(filingId);
  if (!filing) return;
  await store.updateFiling(filing.id, { assigneeEmail: email });
  await event(filing, actor, "nota", { message: `Asignado a ${email ?? "nadie"}.`, visibleToOwner: false });
}

// ---------------------------------------------------------- mensajes ----

export async function postMessage(
  accountId: string,
  author: "owner" | "admin",
  authorLabel: string,
  body: string,
  filingId: string | null = null,
) {
  const text = body.trim().slice(0, 4000);
  if (!text) return { ok: false as const, error: "Escribe un mensaje." };
  const store = serverStore();
  await store.addMessage({
    id: randomUUID(),
    accountId,
    filingId,
    author,
    authorLabel,
    body: text,
    createdAt: now(),
    readByOwnerAt: author === "owner" ? now() : null,
    readByAdminAt: author === "admin" ? now() : null,
  });
  if (author === "admin") {
    const account = await store.getAccount(accountId);
    if (account) await mail.emailNewMessage(account.email).catch(() => undefined);
  } else {
    await mail.emailInternalOwnerActivity("Mensaje nuevo de un cliente", accountId).catch(() => undefined);
  }
  return { ok: true as const };
}

// ----------------------------------------------------------- utilidades ----

export function statusLabel(s: FilingStatus): string {
  return STATUS_LABEL[s];
}

export function servicePublicName(catalog: Catalog, code: ServiceCode): string {
  return serviceByCode(catalog, code)?.name ?? code;
}
