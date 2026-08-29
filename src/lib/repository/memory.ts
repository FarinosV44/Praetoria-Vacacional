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
import { getAllProperties, getPropertyById } from "@/domains/properties/registry";
import {
  PropertyUnavailableError,
  type AttachGuestInput,
  type CouponInput,
  type CreateBlockInput,
  type CreateHoldInput,
  type EmailLogEntry,
  type EmailLogRow,
  type ExternalEvent,
  type CreateManualReservationInput,
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
import { InvoiceLockedError, InvoiceNumberTakenError } from "./types";
import {
  DEFAULT_TAX_NOTE,
  defaultSeriesFor,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceItem,
  type InvoiceSettings,
  type InvoiceStatus,
} from "@/domains/invoicing/types";
import { computeInvoiceTotals, lineAmountCents } from "@/domains/invoicing/totals";
import type {
  Campaign,
  CampaignInput,
  CampaignRecipient,
  Segment,
  SegmentInput,
} from "@/domains/marketing/types";
import { evaluateSegment, type SegmentCriteria } from "@/domains/marketing/segments";

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
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  invoiceSettings: Record<string, InvoiceSettings>;
  dailyRates: { propertyId: string; date: string; nightlyCents: number | null; minNights: number | null }[];
  segments: Segment[];
  campaigns: Campaign[];
  campaignRecipients: CampaignRecipient[];
  unsubscribes: { email: string; unsubscribedAt: string; source: string | null }[];
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
    invoices: [],
    invoiceItems: [],
    invoiceSettings: {},
    dailyRates: [],
    segments: [],
    campaigns: [],
    campaignRecipients: [],
    unsubscribes: [],
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
store.invoices ??= [];
store.invoiceItems ??= [];
store.invoiceSettings ??= {};
store.dailyRates ??= [];
store.segments ??= [];
store.campaigns ??= [];
store.campaignRecipients ??= [];
store.unsubscribes ??= [];

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
    const q = filter.q?.trim().toLowerCase();
    return store.reservations
      .filter((r) => (filter.propertyId ? r.propertyId === filter.propertyId : true))
      .filter((r) => (filter.status ? filter.status.includes(r.status) : true))
      .filter((r) => (filter.source ? r.source === filter.source : true))
      .filter((r) => (filter.paymentState ? r.paymentState === filter.paymentState : true))
      .filter((r) => (filter.customerId ? r.customerId === filter.customerId : true))
      .filter((r) => (filter.from ? r.checkOut > filter.from : true))
      .filter((r) => (filter.to ? r.checkIn < filter.to : true))
      .filter((r) =>
        q
          ? [
              r.code,
              r.guestName,
              r.guestEmail,
              r.guestPhone,
              r.guestDocNumber,
              r.invoiceNumber,
              r.externalLocator,
            ]
              .filter(Boolean)
              .some((v) => v!.toLowerCase().includes(q))
          : true,
      )
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

  // --- Marketing (issue #56 §6) -------------------------------------
  async listCustomerProfiles() {
    return store.customers
      .filter((c) => !c.mergedInto)
      .map((c) => buildCustomerProfile(c, store.reservations));
  },

  async segmentMembers(criteria: SegmentCriteria) {
    return evaluateSegment(criteria, await this.listCustomerProfiles());
  },

  async listSegments() {
    return [...store.segments].sort((a, b) => a.name.localeCompare(b.name));
  },
  async getSegment(id) {
    return store.segments.find((s) => s.id === id) ?? null;
  },
  async createSegment(input: SegmentInput) {
    const now = new Date().toISOString();
    const seg: Segment = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      criteria: input.criteria,
      createdAt: now,
      updatedAt: now,
    };
    store.segments.push(seg);
    save();
    return seg;
  },
  async updateSegment(id, patch) {
    const s = store.segments.find((x) => x.id === id);
    if (!s) throw new Error("SEGMENT_NOT_FOUND");
    if (patch.name !== undefined) s.name = patch.name;
    if (patch.description !== undefined) s.description = patch.description ?? null;
    if (patch.criteria !== undefined) s.criteria = patch.criteria;
    s.updatedAt = new Date().toISOString();
    save();
    return s;
  },
  async deleteSegment(id) {
    store.segments = store.segments.filter((s) => s.id !== id);
    save();
  },

  async listCampaigns() {
    return [...store.campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getCampaign(id) {
    return store.campaigns.find((c) => c.id === id) ?? null;
  },
  async createCampaign(input: CampaignInput) {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      id: randomUUID(),
      name: input.name,
      channel: input.channel,
      status: "draft",
      segmentId: input.segmentId ?? null,
      subject: input.subject ?? null,
      body: input.body ?? null,
      couponCode: input.couponCode ?? null,
      consentRequired: input.consentRequired,
      preparedAt: null,
      sentAt: null,
      recipientCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.campaigns.push(campaign);
    save();
    return campaign;
  },
  async updateCampaign(id, patch) {
    const c = store.campaigns.find((x) => x.id === id);
    if (!c) throw new Error("CAMPAIGN_NOT_FOUND");
    if (c.status === "sent") throw new Error("CAMPAIGN_SENT");
    Object.assign(c, {
      name: patch.name ?? c.name,
      channel: patch.channel ?? c.channel,
      segmentId: patch.segmentId !== undefined ? patch.segmentId : c.segmentId,
      subject: patch.subject !== undefined ? patch.subject : c.subject,
      body: patch.body !== undefined ? patch.body : c.body,
      couponCode: patch.couponCode !== undefined ? patch.couponCode : c.couponCode,
      consentRequired: patch.consentRequired ?? c.consentRequired,
      status: "draft",
      updatedAt: new Date().toISOString(),
    });
    save();
    return c;
  },
  async deleteCampaign(id) {
    store.campaigns = store.campaigns.filter((c) => c.id !== id);
    store.campaignRecipients = store.campaignRecipients.filter((r) => r.campaignId !== id);
    save();
  },

  async prepareCampaign(id) {
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
    if (campaign.status === "sent") throw new Error("CAMPAIGN_SENT");

    const criteria: SegmentCriteria = campaign.segmentId
      ? (store.segments.find((s) => s.id === campaign.segmentId)?.criteria ?? {})
      : {};
    const members = await this.segmentMembers(criteria);
    const unsub = new Set(store.unsubscribes.map((u) => u.email.toLowerCase()));

    store.campaignRecipients = store.campaignRecipients.filter((r) => r.campaignId !== id);
    let ok = 0;
    let skipped = 0;
    const now = new Date().toISOString();
    for (const m of members) {
      const email = m.email?.toLowerCase() ?? null;
      const phone = m.phone ?? m.whatsapp ?? null;
      let status: CampaignRecipient["status"] = "pending";
      let error: string | null = null;
      if (campaign.consentRequired && !m.marketingConsent) {
        status = "skipped";
        error = "sin consentimiento";
      } else if (campaign.channel === "email" && (!email || unsub.has(email))) {
        status = email ? "unsubscribed" : "skipped";
        error = email ? "baja de marketing" : "sin email";
      } else if (campaign.channel === "whatsapp" && !phone) {
        status = "skipped";
        error = "sin teléfono";
      }
      if (status === "pending") ok++;
      else skipped++;
      store.campaignRecipients.push({
        id: randomUUID(),
        campaignId: id,
        customerId: m.id,
        email: m.email,
        phone,
        status,
        error,
        createdAt: now,
      });
    }
    campaign.status = "prepared";
    campaign.preparedAt = now;
    campaign.recipientCount = ok;
    campaign.updatedAt = now;
    save();
    return { campaign, recipients: ok, skipped };
  },

  async listCampaignRecipients(id) {
    return store.campaignRecipients.filter((r) => r.campaignId === id);
  },

  async markCampaignSent(id) {
    const campaign = store.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
    if (campaign.status !== "prepared") throw new Error("CAMPAIGN_NOT_PREPARED");
    const now = new Date().toISOString();
    for (const r of store.campaignRecipients) {
      if (r.campaignId === id && r.status === "pending") {
        r.status = "skipped";
        r.error = "Envío masivo no configurado (Aún no configurado)";
      }
    }
    campaign.status = "sent";
    campaign.sentAt = now;
    campaign.updatedAt = now;
    save();
    return campaign;
  },

  async addUnsubscribe(email, source) {
    const e = email.trim().toLowerCase();
    if (!store.unsubscribes.some((u) => u.email === e)) {
      store.unsubscribes.push({
        email: e,
        unsubscribedAt: new Date().toISOString(),
        source: source ?? null,
      });
      const customer = store.customers.find((c) => (c.email ?? "").toLowerCase() === e);
      if (customer) {
        customer.marketingConsent = false;
        customer.marketingConsentAt = null;
      }
      save();
    }
  },
  async isUnsubscribed(email) {
    return store.unsubscribes.some((u) => u.email === email.trim().toLowerCase());
  },
  async listUnsubscribes() {
    return [...store.unsubscribes].sort((a, b) => b.unsubscribedAt.localeCompare(a.unsubscribedAt));
  },

  async listDailyRates(propertyId: string, from?: IsoDate, to?: IsoDate) {
    return store.dailyRates
      .filter((d) => d.propertyId === propertyId)
      .filter((d) => (from ? d.date >= from : true))
      .filter((d) => (to ? d.date <= to : true))
      .map((d) => ({
        date: d.date,
        ...(d.nightlyCents != null ? { nightlyCents: d.nightlyCents } : {}),
        ...(d.minNights != null ? { minNights: d.minNights } : {}),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async setDailyRates(propertyId, dates, patch) {
    for (const date of dates) {
      let row = store.dailyRates.find((d) => d.propertyId === propertyId && d.date === date);
      if (!row) {
        row = { propertyId, date, nightlyCents: null, minNights: null };
        store.dailyRates.push(row);
      }
      if (patch.nightlyCents !== undefined) row.nightlyCents = patch.nightlyCents;
      if (patch.minNights !== undefined) row.minNights = patch.minNights;
      if (row.nightlyCents == null && row.minNights == null) {
        store.dailyRates = store.dailyRates.filter((d) => d !== row);
      }
    }
    save();
  },

  async clearDailyRates(propertyId, dates) {
    const set = new Set(dates);
    store.dailyRates = store.dailyRates.filter(
      (d) => !(d.propertyId === propertyId && set.has(d.date)),
    );
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

  // --- Invoicing (issue #56 §3) --------------------------------------
  async listInvoices(filter) {
    const q = filter?.q?.trim().toLowerCase();
    return store.invoices
      .filter((i) => (filter?.propertyId ? i.propertyId === filter.propertyId : true))
      .filter((i) => (filter?.series ? i.series === filter.series : true))
      .filter((i) => (filter?.status ? filter.status.includes(i.status) : true))
      .filter((i) => (filter?.customerId ? i.customerId === filter.customerId : true))
      .filter((i) =>
        q
          ? [i.number, i.billTo.name, i.billTo.taxId, i.billTo.email]
              .filter(Boolean)
              .some((v) => v!.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => (a.number < b.number ? 1 : -1));
  },

  async getInvoice(id) {
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) return null;
    return {
      ...inv,
      items: store.invoiceItems
        .filter((it) => it.invoiceId === id)
        .sort((a, b) => a.position - b.position),
    };
  },

  async getInvoiceByNumber(number) {
    const n = number.trim().toUpperCase();
    return store.invoices.find((i) => i.number.toUpperCase() === n) ?? null;
  },

  async invoicesForReservation(reservationId) {
    return store.invoices
      .filter((i) => i.reservationId === reservationId)
      .sort((a, b) => (a.number < b.number ? 1 : -1));
  },

  async allInvoiceNumbers(propertyId) {
    return store.invoices
      .filter((i) => (propertyId ? i.propertyId === propertyId : true))
      .map((i) => i.number);
  },

  async invoiceSettings(propertyId) {
    const existing = store.invoiceSettings[propertyId];
    if (existing) return existing;
    const slug = getPropertyById(propertyId)?.slug ?? propertyId;
    return {
      propertyId,
      series: defaultSeriesFor(slug),
      taxRate: 0,
      taxExempt: true,
      taxNote: DEFAULT_TAX_NOTE,
    };
  },

  async setInvoiceSettings(propertyId, patch) {
    const current = await this.invoiceSettings(propertyId);
    const next: InvoiceSettings = { ...current, ...patch, propertyId };
    store.invoiceSettings[propertyId] = next;
    save();
    return next;
  },

  async createInvoice(input: CreateInvoiceInput) {
    const number = input.number.trim().toUpperCase();
    if (store.invoices.some((i) => i.number.toUpperCase() === number)) {
      throw new InvoiceNumberTakenError();
    }
    const now = new Date().toISOString();
    const id = randomUUID();
    const cleanItems = input.items.filter((it) => it.description.trim());
    const totals = computeInvoiceTotals(cleanItems, {
      taxExempt: input.taxExempt,
      taxRate: input.taxRate,
    });
    const invoice: Invoice = {
      id,
      propertyId: input.propertyId,
      reservationId: input.reservationId ?? null,
      customerId: input.customerId ?? null,
      series: input.series.toUpperCase(),
      number,
      status: "draft",
      issueDate: input.issueDate,
      billTo: { ...input.billTo },
      subtotalCents: totals.subtotalCents,
      taxRate: input.taxRate,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      taxExempt: input.taxExempt,
      taxNote: input.taxNote,
      currency: "EUR",
      notes: input.notes ?? null,
      issuedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.invoices.push(invoice);
    cleanItems.forEach((it, position) => {
      store.invoiceItems.push({
        id: randomUUID(),
        invoiceId: id,
        position,
        description: it.description.trim(),
        quantity: it.quantity,
        unitCents: it.unitCents,
        amountCents: lineAmountCents(it.quantity, it.unitCents),
      });
    });
    save();
    return (await this.getInvoice(id))!;
  },

  async updateInvoiceDraft(id, input: CreateInvoiceInput) {
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error("INVOICE_NOT_FOUND");
    if (inv.status !== "draft") throw new InvoiceLockedError();
    const number = input.number.trim().toUpperCase();
    if (store.invoices.some((i) => i.id !== id && i.number.toUpperCase() === number)) {
      throw new InvoiceNumberTakenError();
    }
    const cleanItems = input.items.filter((it) => it.description.trim());
    const totals = computeInvoiceTotals(cleanItems, {
      taxExempt: input.taxExempt,
      taxRate: input.taxRate,
    });
    Object.assign(inv, {
      propertyId: input.propertyId,
      reservationId: input.reservationId ?? null,
      customerId: input.customerId ?? null,
      series: input.series.toUpperCase(),
      number,
      issueDate: input.issueDate,
      billTo: { ...input.billTo },
      subtotalCents: totals.subtotalCents,
      taxRate: input.taxRate,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      taxExempt: input.taxExempt,
      taxNote: input.taxNote,
      notes: input.notes ?? null,
      updatedAt: new Date().toISOString(),
    });
    store.invoiceItems = store.invoiceItems.filter((it) => it.invoiceId !== id);
    cleanItems.forEach((it, position) => {
      store.invoiceItems.push({
        id: randomUUID(),
        invoiceId: id,
        position,
        description: it.description.trim(),
        quantity: it.quantity,
        unitCents: it.unitCents,
        amountCents: lineAmountCents(it.quantity, it.unitCents),
      });
    });
    save();
    return (await this.getInvoice(id))!;
  },

  async issueInvoice(id) {
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error("INVOICE_NOT_FOUND");
    if (inv.status === "issued" || inv.status === "paid") return inv;
    if (inv.status !== "draft") throw new InvoiceLockedError();
    inv.status = "issued";
    inv.issuedAt = new Date().toISOString();
    inv.updatedAt = inv.issuedAt;
    save();
    return inv;
  },

  async setInvoiceStatus(id, status: InvoiceStatus) {
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error("INVOICE_NOT_FOUND");
    const allowed: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ["issued"],
      issued: ["paid", "void", "rectified"],
      paid: ["void", "rectified"],
      void: [],
      rectified: [],
    };
    if (inv.status === status) return inv;
    if (!allowed[inv.status].includes(status)) {
      throw new InvoiceLockedError(`INVOICE_TRANSITION_INVALID: ${inv.status} → ${status}`);
    }
    inv.status = status;
    inv.updatedAt = new Date().toISOString();
    save();
    return inv;
  },

  async deleteInvoiceDraft(id) {
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) return;
    if (inv.status !== "draft") throw new InvoiceLockedError();
    store.invoices = store.invoices.filter((i) => i.id !== id);
    store.invoiceItems = store.invoiceItems.filter((it) => it.invoiceId !== id);
    save();
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

  async createManualReservation(input: CreateManualReservationInput) {
    if (input.checkIn >= input.checkOut) throw new Error("INVALID_RANGE");
    if (input.status === "confirmed" && !available(input.propertyId, input.checkIn, input.checkOut)) {
      throw new PropertyUnavailableError();
    }
    const nowIso = new Date().toISOString();
    const reservation: Reservation = {
      id: randomUUID(),
      propertyId: input.propertyId,
      code: code(),
      status: input.status,
      source: input.source,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: nightsBetween(input.checkIn, input.checkOut),
      guests: input.guests,
      guestName: input.guestName ?? null,
      guestEmail: input.guestEmail ?? null,
      guestPhone: input.guestPhone ?? null,
      currency: input.currency ?? "EUR",
      totalCents: input.totalCents,
      originalTotalCents: null,
      discountCents: 0,
      couponCode: input.couponCode ?? null,
      priceBreakdown: { manual: true },
      termsAcceptedAt: null,
      holdExpiresAt: null,
      externalUid: null,
      idempotencyKey: null,
      notes: input.notes ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
      customerId: input.customerId ?? null,
      channelDetail: input.channelDetail ?? null,
      guestDocType: input.guestDocType ?? null,
      guestDocNumber: input.guestDocNumber ?? null,
      guestAddress: input.guestAddress ?? null,
      guestPostalCode: input.guestPostalCode ?? null,
      guestCity: input.guestCity ?? null,
      guestProvince: input.guestProvince ?? null,
      guestCountry: input.guestCountry ?? null,
      externalLocator: input.externalLocator ?? null,
      invoiceNumber: input.invoiceNumber ?? null,
      paymentMethod: input.paymentMethod ?? null,
      paymentState: input.paymentState ?? "pending",
    };
    store.reservations.push(reservation);
    save();
    if (!reservation.customerId && (reservation.guestEmail || reservation.guestPhone || reservation.guestName)) {
      await this.linkOrCreateCustomerFromReservation(reservation.id);
    }
    return store.reservations.find((r) => r.id === reservation.id)!;
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
