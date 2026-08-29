import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { addDays, nightsBetween, rangesOverlap, todayIso, type IsoDate } from "@/lib/dates";
import type {
  AvailabilityBlock,
  BlockSource,
  BusyRange,
  CalendarSyncRow,
  Payment,
  Reservation,
} from "@/domains/booking/types";
import { getAllProperties } from "@/domains/properties/registry";
import {
  PropertyUnavailableError,
  type AttachGuestInput,
  type CouponInput,
  type CreateBlockInput,
  type CreateHoldInput,
  type EmailLogEntry,
  type EmailLogRow,
  type ExternalEvent,
  type Repository,
  type ReservationFilter,
  type ReservationPatch,
  type UpsertPaymentInput,
} from "./types";
import {
  normalizeCode,
  PRAETORIA10_COUPON,
  type Coupon,
} from "@/domains/pricing/coupons";
import type { Customer, CustomerInput } from "@/domains/crm/types";
import { findDuplicates, mergedFields } from "@/domains/crm/dedup";
import { buildCustomerProfile } from "@/domains/crm/profile";

/** Blank intranet-only reservation fields (issue #56) for DEMO-created holds. */
function blankIntranetFields() {
  return {
    customerId: null,
    channelDetail: null,
    guestDocType: null,
    guestDocNumber: null,
    guestAddress: null,
    guestPostalCode: null,
    guestCity: null,
    guestProvince: null,
    guestCountry: null,
    externalLocator: null,
    invoiceNumber: null,
    paymentMethod: null,
    paymentState: "pending" as const,
  };
}

/**
 * In-memory repository backing DEMO mode (no Supabase configured, D-003).
 *
 * Data lives in a module singleton and is mirrored to `.data/demo.json` so it
 * survives dev-server restarts. On a read-only filesystem (e.g. a serverless
 * preview) persistence silently no-ops and data is per-instance — acceptable
 * for a preview; production always runs against Supabase.
 */

interface Store {
  reservations: Reservation[];
  blocks: AvailabilityBlock[];
  payments: Payment[];
  webhookEvents: { provider: string; eventId: string }[];
  syncs: CalendarSyncRow[];
  rateOverrides: Record<string, unknown>;
  emailLog: EmailLogRow[];
  importFeeds: Record<string, string>; // `${propertyId}:${channel}` -> url
  coupons: Coupon[];
  redemptions: {
    couponId: string;
    reservationId: string;
    email: string | null;
    discountCents: number;
    createdAt: string;
  }[];
  contentOverrides: Record<string, { value: unknown; updatedAt: string }>;
  customers: Customer[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "demo.json");

function seed(): Store {
  const today = todayIso();
  const [javalambre, valencia] = getAllProperties();
  const blocks: AvailabilityBlock[] = [];
  const now = new Date().toISOString();
  // A couple of demo blocks so calendars are not empty in DEMO mode.
  if (javalambre) {
    blocks.push({
      id: randomUUID(),
      propertyId: javalambre.id,
      startDate: addDays(today, 12),
      endDate: addDays(today, 16),
      source: "booking",
      externalUid: "demo-javalambre-1",
      summary: "Reserva importada (demo)",
      createdAt: now,
      updatedAt: now,
    });
  }
  if (valencia) {
    blocks.push({
      id: randomUUID(),
      propertyId: valencia.id,
      startDate: addDays(today, 5),
      endDate: addDays(today, 9),
      source: "booking",
      externalUid: "demo-valencia-1",
      summary: "Reserva importada (demo)",
      createdAt: now,
      updatedAt: now,
    });
  }
  const syncs: CalendarSyncRow[] = getAllProperties().flatMap((p) =>
    (["import", "export"] as const).map((direction) => ({
      id: randomUUID(),
      propertyId: p.id,
      channel: "booking",
      direction,
      feedUrl: null,
      lastRunAt: null,
      lastStatus: direction === "import" ? "never run" : "never run",
      lastError: null,
      eventsImported: 0,
    })),
  );
  const coupons: Coupon[] = [
    {
      id: randomUUID(),
      code: "DEMO10",
      kind: "percent",
      value: 10,
      propertySlug: null,
      startsOn: null,
      endsOn: null,
      minNights: 0,
      minTotalCents: 0,
      maxUses: null,
      usesCount: 0,
      maxUsesPerEmail: null,
      autoApply: false,
      active: true,
      description: "Código de ejemplo (modo demostración)",
    },
    { ...PRAETORIA10_COUPON, id: randomUUID() },
  ];
  return {
    reservations: [],
    blocks,
    payments: [],
    webhookEvents: [],
    syncs,
    rateOverrides: {},
    emailLog: [],
    importFeeds: {},
    coupons,
    redemptions: [],
    contentOverrides: {},
    customers: [],
  };
}

function load(): Store {
  try {
    if (existsSync(DATA_FILE)) {
      return JSON.parse(readFileSync(DATA_FILE, "utf8")) as Store;
    }
  } catch {
    /* fall through to seed */
  }
  const fresh = seed();
  persist(fresh);
  return fresh;
}

function persist(store: Store): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {
    /* read-only fs — keep in memory only */
  }
}

// Survive Next.js HMR by stashing on globalThis.
const g = globalThis as unknown as { __pvStore?: Store };
const store: Store = g.__pvStore ?? (g.__pvStore = load());
// Forward-compat for stores persisted by an older version.
store.rateOverrides ??= {};
store.emailLog ??= [];
store.importFeeds ??= {};
store.coupons ??= [];
// Forward-compat: ensure the issue #54 promo code exists in a store persisted
// before it was seeded, and that it is active.
{
  const existing = store.coupons.find((c) => c.code === PRAETORIA10_COUPON.code);
  if (!existing) {
    store.coupons.push({ ...PRAETORIA10_COUPON, id: randomUUID() });
  } else if (!existing.active) {
    existing.active = true;
  }
}
store.redemptions ??= [];
store.contentOverrides ??= {};
store.customers ??= [];

function save() {
  persist(store);
}

function code(): string {
  return `PV-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

const occupies = (r: Reservation) => r.status === "pending" || r.status === "confirmed";

function busyRangesFor(propertyId: string): BusyRange[] {
  const fromRes: BusyRange[] = store.reservations
    .filter((r) => r.propertyId === propertyId && occupies(r))
    .map((r) => ({ start: r.checkIn, end: r.checkOut, kind: "reservation" as const }));
  const fromBlocks: BusyRange[] = store.blocks
    .filter((b) => b.propertyId === propertyId)
    .map((b) => ({ start: b.startDate, end: b.endDate, kind: "block" as const }));
  return [...fromRes, ...fromBlocks];
}

function available(propertyId: string, checkIn: IsoDate, checkOut: IsoDate): boolean {
  if (checkIn >= checkOut) return false;
  return !busyRangesFor(propertyId).some((r) => rangesOverlap(checkIn, checkOut, r.start, r.end));
}

export const memoryRepository: Repository = {
  kind: "memory",

  async getBusyRanges(propertyId, from, to) {
    return busyRangesFor(propertyId).filter((r) => rangesOverlap(from, to, r.start, r.end));
  },

  async isStayAvailable(propertyId, checkIn, checkOut) {
    return available(propertyId, checkIn, checkOut);
  },

  async createHold(input: CreateHoldInput) {
    const existing = store.reservations.find((r) => r.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;
    if (!available(input.propertyId, input.checkIn, input.checkOut)) {
      throw new PropertyUnavailableError();
    }
    const nowIso = new Date().toISOString();
    const reservation: Reservation = {
      id: randomUUID(),
      propertyId: input.propertyId,
      code: code(),
      status: "pending",
      source: "direct",
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: nightsBetween(input.checkIn, input.checkOut),
      guests: input.guests,
      guestName: null,
      guestEmail: null,
      guestPhone: null,
      currency: input.currency,
      totalCents: input.totalCents,
      originalTotalCents: input.originalTotalCents ?? null,
      discountCents: input.discountCents ?? 0,
      couponCode: input.couponCode ?? null,
      priceBreakdown: input.priceBreakdown,
      termsAcceptedAt: null,
      holdExpiresAt: new Date(Date.now() + input.holdMinutes * 60_000).toISOString(),
      externalUid: null,
      idempotencyKey: input.idempotencyKey,
      notes: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...blankIntranetFields(),
    };
    store.reservations.push(reservation);
    save();
    return reservation;
  },

  async attachGuest(input: AttachGuestInput) {
    const r = store.reservations.find((x) => x.id === input.reservationId);
    if (!r) throw new Error("RESERVATION_NOT_FOUND");
    r.guestName = input.guestName;
    r.guestEmail = input.guestEmail;
    r.guestPhone = input.guestPhone ?? null;
    r.termsAcceptedAt = input.termsAccepted ? new Date().toISOString() : r.termsAcceptedAt;
    r.notes = input.notes ?? r.notes;
    r.updatedAt = new Date().toISOString();
    save();
    return r;
  },

  async getReservation(id) {
    return store.reservations.find((r) => r.id === id) ?? null;
  },
  async getReservationByCode(c) {
    return store.reservations.find((r) => r.code === c) ?? null;
  },
  async getReservationByIdempotencyKey(key) {
    return store.reservations.find((r) => r.idempotencyKey === key) ?? null;
  },

  async listReservations(filter: ReservationFilter) {
    return store.reservations
      .filter((r) => (filter.propertyId ? r.propertyId === filter.propertyId : true))
      .filter((r) => (filter.status ? filter.status.includes(r.status) : true))
      .filter((r) => (filter.from ? r.checkOut > filter.from : true))
      .filter((r) => (filter.to ? r.checkIn < filter.to : true))
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  },

  async confirmReservation(id, paymentIntent) {
    const r = store.reservations.find((x) => x.id === id);
    if (!r) throw new Error("RESERVATION_NOT_FOUND");
    if (r.status === "confirmed") return r;
    if (r.status !== "pending") throw new Error(`RESERVATION_NOT_PENDING: ${r.status}`);
    r.status = "confirmed";
    r.holdExpiresAt = null;
    r.externalUid = paymentIntent;
    r.updatedAt = new Date().toISOString();
    save();
    return r;
  },

  async cancelReservation(id, reason) {
    const r = store.reservations.find((x) => x.id === id);
    if (!r) throw new Error("RESERVATION_NOT_FOUND");
    r.status = "cancelled";
    r.holdExpiresAt = null;
    r.notes = reason ? `${r.notes ?? ""}\nCancelada: ${reason}`.trim() : r.notes;
    r.updatedAt = new Date().toISOString();
    save();
    return r;
  },

  async expireStaleHolds() {
    const now = Date.now();
    let n = 0;
    for (const r of store.reservations) {
      if (r.status === "pending" && r.holdExpiresAt && Date.parse(r.holdExpiresAt) < now) {
        r.status = "expired";
        r.holdExpiresAt = null;
        r.updatedAt = new Date().toISOString();
        n++;
      }
    }
    if (n) save();
    return n;
  },

  async listBlocks(propertyId) {
    return store.blocks
      .filter((b) => b.propertyId === propertyId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  async createBlock(input: CreateBlockInput) {
    if (input.source === "manual" && !available(input.propertyId, input.startDate, input.endDate)) {
      throw new PropertyUnavailableError();
    }
    const nowIso = new Date().toISOString();
    const block: AvailabilityBlock = {
      id: randomUUID(),
      propertyId: input.propertyId,
      startDate: input.startDate,
      endDate: input.endDate,
      source: input.source,
      externalUid: input.externalUid ?? null,
      summary: input.summary ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.blocks.push(block);
    save();
    return block;
  },

  async deleteBlock(id) {
    const i = store.blocks.findIndex((b) => b.id === id);
    if (i >= 0) {
      store.blocks.splice(i, 1);
      save();
    }
  },

  async syncExternalBlocks(propertyId: string, source: BlockSource, events: ExternalEvent[]) {
    const incoming = new Map(events.map((e) => [e.uid, e]));
    const current = store.blocks.filter((b) => b.propertyId === propertyId && b.source === source);
    let created = 0;
    let kept = 0;
    let removed = 0;

    // Remove blocks no longer present in the feed.
    for (const b of current) {
      if (!b.externalUid || !incoming.has(b.externalUid)) {
        store.blocks.splice(store.blocks.indexOf(b), 1);
        removed++;
      }
    }
    // Upsert incoming events.
    for (const e of events) {
      const found = store.blocks.find(
        (b) => b.propertyId === propertyId && b.source === source && b.externalUid === e.uid,
      );
      if (found) {
        if (found.startDate !== e.startDate || found.endDate !== e.endDate || found.summary !== e.summary) {
          found.startDate = e.startDate;
          found.endDate = e.endDate;
          found.summary = e.summary;
          found.updatedAt = new Date().toISOString();
        }
        kept++;
      } else {
        const nowIso = new Date().toISOString();
        store.blocks.push({
          id: randomUUID(),
          propertyId,
          startDate: e.startDate,
          endDate: e.endDate,
          source,
          externalUid: e.uid,
          summary: e.summary,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        created++;
      }
    }
    save();
    return { created, removed, kept };
  },

  async upsertPayment(input: UpsertPaymentInput) {
    let p = store.payments.find(
      (x) =>
        (input.providerCheckoutSession &&
          x.providerCheckoutSession === input.providerCheckoutSession) ||
        (input.providerPaymentIntent && x.providerPaymentIntent === input.providerPaymentIntent),
    );
    const nowIso = new Date().toISOString();
    if (p) {
      p.status = input.status;
      p.providerPaymentIntent = input.providerPaymentIntent ?? p.providerPaymentIntent;
      p.providerCheckoutSession = input.providerCheckoutSession ?? p.providerCheckoutSession;
      p.raw = input.raw ?? p.raw;
      p.updatedAt = nowIso;
    } else {
      p = {
        id: randomUUID(),
        reservationId: input.reservationId,
        provider: input.provider,
        providerCheckoutSession: input.providerCheckoutSession ?? null,
        providerPaymentIntent: input.providerPaymentIntent ?? null,
        status: input.status,
        amountCents: input.amountCents,
        currency: input.currency,
        raw: input.raw ?? {},
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.payments.push(p);
    }
    save();
    return p;
  },

  async getPaymentBySession(session) {
    return store.payments.find((p) => p.providerCheckoutSession === session) ?? null;
  },

  async listPayments(limit = 100) {
    return [...store.payments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },

  async claimWebhookEvent(provider, eventId) {
    if (store.webhookEvents.some((e) => e.provider === provider && e.eventId === eventId)) {
      return false;
    }
    store.webhookEvents.push({ provider, eventId });
    save();
    return true;
  },

  async getRateOverride(propertyId: string) {
    return store.rateOverrides[propertyId] ?? null;
  },

  async setRateOverride(propertyId: string, rateConfig: unknown) {
    store.rateOverrides[propertyId] = rateConfig;
    save();
  },

  async getContentOverride(key: string) {
    const row = store.contentOverrides[key];
    return row ? { key, value: row.value, updatedAt: row.updatedAt } : null;
  },

  async listContentOverrides(prefix?: string) {
    return Object.entries(store.contentOverrides)
      .filter(([k]) => !prefix || k.startsWith(prefix))
      .map(([key, r]) => ({ key, value: r.value, updatedAt: r.updatedAt }))
      .sort((a, b) => a.key.localeCompare(b.key));
  },

  async setContentOverride(key: string, value: unknown | null) {
    if (value === null || value === undefined) delete store.contentOverrides[key];
    else store.contentOverrides[key] = { value, updatedAt: new Date().toISOString() };
    save();
  },

  async logEmail(entry: EmailLogEntry) {
    store.emailLog.unshift({
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    store.emailLog = store.emailLog.slice(0, 500);
    save();
  },

  async listEmailLog(limit = 100) {
    return store.emailLog.slice(0, limit);
  },

  async getImportFeedUrl(propertyId: string, channel: string) {
    return store.importFeeds[`${propertyId}:${channel}`] ?? null;
  },

  // --- Customers / CRM (issue #56) -------------------------------------
  async listCustomers(filter) {
    let rows = store.customers.filter((c) => !c.mergedInto);
    if (filter?.channel) rows = rows.filter((c) => c.channelOrigin === filter.channel);
    if (filter?.consentOnly) rows = rows.filter((c) => c.marketingConsent);
    if (filter?.q) {
      const t = filter.q.toLowerCase();
      rows = rows.filter((c) =>
        [c.firstName, c.lastName, c.email, c.phone, c.docNumber]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(t)),
      );
    }
    if (filter?.repeatersOnly || filter?.property) {
      rows = rows.filter((c) => {
        const confirmed = store.reservations.filter(
          (r) => r.customerId === c.id && r.status === "confirmed",
        );
        if (filter.repeatersOnly && confirmed.length < 2) return false;
        if (filter.property && !confirmed.some((r) => r.propertyId === filter.property)) return false;
        return true;
      });
    }
    return [...rows].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
    );
  },

  async getCustomer(id) {
    return store.customers.find((c) => c.id === id) ?? null;
  },

  async createCustomer(input: CustomerInput) {
    const now = new Date().toISOString();
    const consent = input.marketingConsent ?? false;
    const customer: Customer = {
      id: randomUUID(),
      firstName: input.firstName ?? "",
      lastName: input.lastName ?? "",
      email: input.email ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      docType: input.docType ?? null,
      docNumber: input.docNumber ?? null,
      address: input.address ?? null,
      postalCode: input.postalCode ?? null,
      city: input.city ?? null,
      province: input.province ?? null,
      country: input.country ?? null,
      language: input.language ?? null,
      channelOrigin: input.channelOrigin ?? null,
      marketingConsent: consent,
      marketingConsentAt: consent ? now : null,
      marketingConsentSource: consent ? (input.marketingConsentSource ?? "admin") : null,
      notes: input.notes ?? null,
      mergedInto: null,
      createdAt: now,
      updatedAt: now,
    };
    store.customers.push(customer);
    save();
    return customer;
  },

  async updateCustomer(id, patch) {
    const c = store.customers.find((x) => x.id === id);
    if (!c) throw new Error("CUSTOMER_NOT_FOUND");
    const scalarKeys: (keyof CustomerInput)[] = [
      "firstName", "lastName", "email", "phone", "whatsapp", "docType", "docNumber",
      "address", "postalCode", "city", "province", "country", "language", "channelOrigin", "notes",
    ];
    for (const k of scalarKeys) {
      if (patch[k] !== undefined) (c as unknown as Record<string, unknown>)[k] = patch[k];
    }
    if (patch.marketingConsent !== undefined) {
      c.marketingConsent = patch.marketingConsent;
      c.marketingConsentAt = patch.marketingConsent ? new Date().toISOString() : null;
      c.marketingConsentSource = patch.marketingConsent
        ? (patch.marketingConsentSource ?? c.marketingConsentSource ?? "admin")
        : null;
    }
    c.updatedAt = new Date().toISOString();
    save();
    return c;
  },

  async customerProfile(id) {
    const customer = store.customers.find((c) => c.id === id);
    if (!customer) return null;
    return buildCustomerProfile(customer, store.reservations);
  },

  async findCustomerDuplicates(id) {
    const target = store.customers.find((c) => c.id === id);
    if (!target) return [];
    return findDuplicates(target, store.customers);
  },

  async mergeCustomers(primaryId, duplicateId, actorEmail) {
    const primary = store.customers.find((c) => c.id === primaryId);
    const dup = store.customers.find((c) => c.id === duplicateId);
    if (!primary || !dup) throw new Error("CUSTOMER_NOT_FOUND");
    if (primaryId === duplicateId) return primary;
    const merged = mergedFields(primary, dup);
    Object.assign(primary, merged, { id: primaryId, updatedAt: new Date().toISOString() });
    for (const r of store.reservations) {
      if (r.customerId === duplicateId) r.customerId = primaryId;
    }
    dup.mergedInto = primaryId;
    dup.updatedAt = new Date().toISOString();
    void actorEmail;
    save();
    return primary;
  },

  async updateReservation(id, patch: ReservationPatch) {
    const r = store.reservations.find((x) => x.id === id);
    if (!r) throw new Error("RESERVATION_NOT_FOUND");
    const keys: (keyof ReservationPatch)[] = [
      "source", "channelDetail", "customerId", "guestName", "guestEmail", "guestPhone",
      "guestDocType", "guestDocNumber", "guestAddress", "guestPostalCode", "guestCity",
      "guestProvince", "guestCountry", "externalLocator", "invoiceNumber", "paymentMethod",
      "paymentState", "notes",
    ];
    for (const k of keys) {
      if (patch[k] !== undefined) (r as unknown as Record<string, unknown>)[k] = patch[k];
    }
    r.updatedAt = new Date().toISOString();
    save();
    return r;
  },

  async linkOrCreateCustomerFromReservation(reservationId) {
    const r = store.reservations.find((x) => x.id === reservationId);
    if (!r) return null;
    if (r.customerId) return store.customers.find((c) => c.id === r.customerId) ?? null;
    if (!r.guestEmail && !r.guestPhone && !r.guestName) return null;
    const synthetic: Customer = {
      id: "__new__",
      firstName: (r.guestName ?? "").split(" ")[0] ?? "",
      lastName: (r.guestName ?? "").split(" ").slice(1).join(" "),
      email: r.guestEmail,
      phone: r.guestPhone,
      whatsapp: null,
      docType: (r.guestDocType as Customer["docType"]) ?? null,
      docNumber: r.guestDocNumber,
      address: r.guestAddress,
      postalCode: r.guestPostalCode,
      city: r.guestCity,
      province: r.guestProvince,
      country: r.guestCountry,
      language: null,
      channelOrigin: r.source,
      marketingConsent: false,
      marketingConsentAt: null,
      marketingConsentSource: null,
      notes: null,
      mergedInto: null,
      createdAt: "",
      updatedAt: "",
    };
    const dup = findDuplicates(synthetic, store.customers)[0];
    const customer = dup
      ? dup.customer
      : await this.createCustomer({
          firstName: synthetic.firstName,
          lastName: synthetic.lastName,
          email: synthetic.email,
          phone: synthetic.phone,
          docType: synthetic.docType,
          docNumber: synthetic.docNumber,
          address: synthetic.address,
          postalCode: synthetic.postalCode,
          city: synthetic.city,
          province: synthetic.province,
          country: synthetic.country,
          channelOrigin: synthetic.channelOrigin,
        });
    r.customerId = customer.id;
    r.updatedAt = new Date().toISOString();
    save();
    return customer;
  },

  async getCouponByCode(codeStr: string) {
    const c = normalizeCode(codeStr);
    return store.coupons.find((x) => x.code === c) ?? null;
  },

  async listCoupons() {
    return [...store.coupons].sort((a, b) => a.code.localeCompare(b.code));
  },

  async createCoupon(input: CouponInput) {
    const coupon: Coupon = {
      ...input,
      code: normalizeCode(input.code),
      id: randomUUID(),
      usesCount: 0,
    };
    if (store.coupons.some((c) => c.code === coupon.code)) {
      throw new Error("COUPON_CODE_TAKEN");
    }
    store.coupons.push(coupon);
    save();
    return coupon;
  },

  async updateCoupon(id: string, patch: Partial<CouponInput>) {
    const c = store.coupons.find((x) => x.id === id);
    if (!c) throw new Error("COUPON_NOT_FOUND");
    Object.assign(c, patch);
    if (patch.code) c.code = normalizeCode(patch.code);
    save();
    return c;
  },

  async deleteCoupon(id: string) {
    const i = store.coupons.findIndex((x) => x.id === id);
    if (i >= 0) {
      store.coupons.splice(i, 1);
      save();
    }
  },

  async countCouponRedemptionsByEmail(couponId: string, email: string) {
    const e = email.trim().toLowerCase();
    return store.redemptions.filter(
      (r) => r.couponId === couponId && (r.email ?? "").toLowerCase() === e,
    ).length;
  },

  async redeemCoupon(couponId, reservationId, email, discountCents) {
    const coupon = store.coupons.find((c) => c.id === couponId);
    if (!coupon) throw new Error("COUPON_NOT_FOUND");
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      throw new Error("COUPON_EXHAUSTED");
    }
    if (store.redemptions.some((r) => r.couponId === couponId && r.reservationId === reservationId)) {
      return;
    }
    store.redemptions.push({
      couponId,
      reservationId,
      email,
      discountCents,
      createdAt: new Date().toISOString(),
    });
    coupon.usesCount += 1;
    save();
  },

  async couponRedemptions(couponId: string) {
    return store.redemptions
      .filter((r) => r.couponId === couponId)
      .map((r) => ({
        reservationCode:
          store.reservations.find((x) => x.id === r.reservationId)?.code ?? "—",
        discountCents: r.discountCents,
        email: r.email,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async setImportFeedUrl(propertyId: string, channel: string, url: string | null) {
    const key = `${propertyId}:${channel}`;
    if (url) store.importFeeds[key] = url;
    else delete store.importFeeds[key];
    save();
  },

  async getSyncRows(propertyId?: string) {
    return store.syncs.filter((s) => (propertyId ? s.propertyId === propertyId : true));
  },

  async recordSyncRun(propertyId, channel, direction, result) {
    let row = store.syncs.find(
      (s) => s.propertyId === propertyId && s.channel === channel && s.direction === direction,
    );
    if (!row) {
      row = {
        id: randomUUID(),
        propertyId,
        channel,
        direction,
        feedUrl: result.feedUrl ?? null,
        lastRunAt: null,
        lastStatus: null,
        lastError: null,
        eventsImported: 0,
      };
      store.syncs.push(row);
    }
    row.lastRunAt = new Date().toISOString();
    row.lastStatus = result.status;
    row.lastError = result.error ?? null;
    if (result.feedUrl !== undefined) row.feedUrl = result.feedUrl;
    if (typeof result.eventsImported === "number") row.eventsImported = result.eventsImported;
    save();
  },
};
