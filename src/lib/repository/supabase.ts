import type {
  AvailabilityBlock,
  BlockSource,
  BusyRange,
  CalendarSyncRow,
  Payment,
  Reservation,
} from "@/domains/booking/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PropertyUnavailableError,
  type AttachGuestInput,
  type CouponInput,
  type CreateBlockInput,
  type CreateHoldInput,
  type CreateManualReservationInput,
  type EmailLogEntry,
  type EmailLogRow,
  type ExternalEvent,
  type Repository,
  type ReservationFilter,
  type UpsertPaymentInput,
} from "./types";
import { normalizeCode, type Coupon } from "@/domains/pricing/coupons";
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
  type InvoiceWithItems,
} from "@/domains/invoicing/types";
import { computeInvoiceTotals, lineAmountCents } from "@/domains/invoicing/totals";
import { getPropertyById } from "@/domains/properties/registry";
import type {
  Campaign,
  CampaignInput,
  CampaignRecipient,
  Segment,
  SegmentInput,
} from "@/domains/marketing/types";
import { evaluateSegment, type SegmentCriteria } from "@/domains/marketing/segments";
import { planExternalReservations } from "@/domains/integrations/reconcile";
import type { EnqueueJobInput, Job, JobFilter, JobSettlement } from "@/domains/jobs/types";
import type { CommsFilter, DesiredMessage, ScheduledMessage } from "@/domains/comms/types";
import type { AdminUser } from "@/domains/admin/users";
import type { MediaAsset } from "@/domains/media/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    propertyId: row.property_id,
    code: row.code,
    status: row.status,
    source: row.source,
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    guests: row.guests,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    currency: row.currency,
    totalCents: Number(row.total_cents),
    originalTotalCents: row.original_total_cents != null ? Number(row.original_total_cents) : null,
    discountCents: Number(row.discount_cents ?? 0),
    couponCode: row.coupon_code ?? null,
    priceBreakdown: row.price_breakdown,
    termsAcceptedAt: row.terms_accepted_at,
    holdExpiresAt: row.hold_expires_at,
    externalUid: row.external_uid,
    idempotencyKey: row.idempotency_key,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerId: row.customer_id ?? null,
    channelDetail: row.channel_detail ?? null,
    guestDocType: row.guest_doc_type ?? null,
    guestDocNumber: row.guest_doc_number ?? null,
    guestAddress: row.guest_address ?? null,
    guestPostalCode: row.guest_postal_code ?? null,
    guestCity: row.guest_city ?? null,
    guestProvince: row.guest_province ?? null,
    guestCountry: row.guest_country ?? null,
    externalLocator: row.external_locator ?? null,
    invoiceNumber: row.invoice_number ?? null,
    paymentMethod: row.payment_method ?? null,
    paymentState: row.payment_state ?? "pending",
  };
}

function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    docType: row.doc_type,
    docNumber: row.doc_number,
    address: row.address,
    postalCode: row.postal_code,
    city: row.city,
    province: row.province,
    country: row.country,
    language: row.language,
    channelOrigin: row.channel_origin,
    marketingConsent: !!row.marketing_consent,
    marketingConsentAt: row.marketing_consent_at,
    marketingConsentSource: row.marketing_consent_source,
    notes: row.notes,
    mergedInto: row.merged_into ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customerToRow(input: Partial<CustomerInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) row[k] = v;
  };
  set("first_name", input.firstName);
  set("last_name", input.lastName);
  set("email", input.email);
  set("phone", input.phone);
  set("whatsapp", input.whatsapp);
  set("doc_type", input.docType);
  set("doc_number", input.docNumber);
  set("address", input.address);
  set("postal_code", input.postalCode);
  set("city", input.city);
  set("province", input.province);
  set("country", input.country);
  set("language", input.language);
  set("channel_origin", input.channelOrigin);
  set("notes", input.notes);
  if (input.marketingConsent !== undefined) {
    row.marketing_consent = input.marketingConsent;
    row.marketing_consent_at = input.marketingConsent ? new Date().toISOString() : null;
    if (input.marketingConsent) row.marketing_consent_source = input.marketingConsentSource ?? "admin";
  }
  return row;
}

function mapBlock(row: any): AvailabilityBlock {
  return {
    id: row.id,
    propertyId: row.property_id,
    startDate: row.start_date,
    endDate: row.end_date,
    source: row.source,
    externalUid: row.external_uid,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPayment(row: any): Payment {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    provider: row.provider,
    providerCheckoutSession: row.provider_checkout_session,
    providerPaymentIntent: row.provider_payment_intent,
    status: row.status,
    amountCents: Number(row.amount_cents),
    currency: row.currency,
    raw: row.raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    propertyId: row.property_id,
    reservationId: row.reservation_id ?? null,
    customerId: row.customer_id ?? null,
    series: row.series,
    number: row.number,
    status: row.status,
    issueDate: row.issue_date,
    billTo: {
      name: row.bill_to_name ?? "",
      taxId: row.bill_to_tax_id ?? null,
      address: row.bill_to_address ?? null,
      postalCode: row.bill_to_postal ?? null,
      city: row.bill_to_city ?? null,
      province: row.bill_to_province ?? null,
      country: row.bill_to_country ?? null,
      email: row.bill_to_email ?? null,
    },
    subtotalCents: Number(row.subtotal_cents ?? 0),
    taxRate: Number(row.tax_rate ?? 0),
    taxCents: Number(row.tax_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    taxExempt: !!row.tax_exempt,
    taxNote: row.tax_note ?? null,
    currency: row.currency ?? "EUR",
    notes: row.notes ?? null,
    issuedAt: row.issued_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoiceItem(row: any): InvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    position: row.position,
    description: row.description,
    quantity: Number(row.quantity),
    unitCents: Number(row.unit_cents),
    amountCents: Number(row.amount_cents),
  };
}

function invoiceRowFrom(input: CreateInvoiceInput, totals: {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}): Record<string, unknown> {
  return {
    property_id: input.propertyId,
    reservation_id: input.reservationId ?? null,
    customer_id: input.customerId ?? null,
    series: input.series.toUpperCase(),
    number: input.number.trim().toUpperCase(),
    issue_date: input.issueDate,
    bill_to_name: input.billTo.name,
    bill_to_tax_id: input.billTo.taxId,
    bill_to_address: input.billTo.address,
    bill_to_postal: input.billTo.postalCode,
    bill_to_city: input.billTo.city,
    bill_to_province: input.billTo.province,
    bill_to_country: input.billTo.country,
    bill_to_email: input.billTo.email,
    subtotal_cents: totals.subtotalCents,
    tax_rate: input.taxRate,
    tax_cents: totals.taxCents,
    total_cents: totals.totalCents,
    tax_exempt: input.taxExempt,
    tax_note: input.taxNote,
    notes: input.notes ?? null,
  };
}

function mapSegment(row: any): Segment {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    criteria: (row.criteria ?? {}) as SegmentCriteria,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaign(row: any): Campaign {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    status: row.status,
    segmentId: row.segment_id ?? null,
    subject: row.subject ?? null,
    body: row.body ?? null,
    couponCode: row.coupon_code ?? null,
    consentRequired: !!row.consent_required,
    preparedAt: row.prepared_at ?? null,
    sentAt: row.sent_at ?? null,
    recipientCount: row.recipient_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaignRecipient(row: any): CampaignRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    customerId: row.customer_id ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    status: row.status,
    error: row.error ?? null,
    createdAt: row.created_at,
  };
}

function isUnavailable(error: { message?: string; code?: string } | null): boolean {
  return !!error && (error.message?.includes("PROPERTY_UNAVAILABLE") || error.code === "23P01");
}

function mapCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind,
    value: row.value,
    propertySlug: row.property_slug,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    minNights: row.min_nights,
    minTotalCents: Number(row.min_total_cents),
    maxUses: row.max_uses,
    usesCount: row.uses_count,
    maxUsesPerEmail: row.max_uses_per_email,
    autoApply: row.auto_apply,
    active: row.active,
    description: row.description,
  };
}

function couponToRow(input: Partial<CouponInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.code !== undefined) row.code = normalizeCode(input.code);
  if (input.kind !== undefined) row.kind = input.kind;
  if (input.value !== undefined) row.value = input.value;
  if (input.propertySlug !== undefined) row.property_slug = input.propertySlug;
  if (input.startsOn !== undefined) row.starts_on = input.startsOn;
  if (input.endsOn !== undefined) row.ends_on = input.endsOn;
  if (input.minNights !== undefined) row.min_nights = input.minNights;
  if (input.minTotalCents !== undefined) row.min_total_cents = input.minTotalCents;
  if (input.maxUses !== undefined) row.max_uses = input.maxUses;
  if (input.maxUsesPerEmail !== undefined) row.max_uses_per_email = input.maxUsesPerEmail;
  if (input.autoApply !== undefined) row.auto_apply = input.autoApply;
  if (input.active !== undefined) row.active = input.active;
  if (input.description !== undefined) row.description = input.description;
  return row;
}

export const supabaseRepository: Repository = {
  kind: "supabase",

  async getBusyRanges(propertyId, from, to) {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("property_busy_ranges", {
      p_property: propertyId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return (data ?? []).map(
      (r: any): BusyRange => ({ start: r.start_date, end: r.end_date, kind: r.kind }),
    );
  },

  async isStayAvailable(propertyId, checkIn, checkOut) {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("is_stay_available", {
      p_property: propertyId,
      p_check_in: checkIn,
      p_check_out: checkOut,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async createHold(input: CreateHoldInput) {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("create_reservation_hold", {
      p_property: input.propertyId,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_guests: input.guests,
      p_total_cents: input.totalCents,
      p_currency: input.currency,
      p_breakdown: input.priceBreakdown ?? {},
      p_hold_minutes: input.holdMinutes,
      p_idempotency_key: input.idempotencyKey,
      p_original_total_cents: input.originalTotalCents ?? input.totalCents,
      p_discount_cents: input.discountCents ?? 0,
      p_coupon_code: input.couponCode ?? null,
    });
    if (isUnavailable(error)) throw new PropertyUnavailableError();
    if (error) throw error;
    return mapReservation(Array.isArray(data) ? data[0] : data);
  },

  async attachGuest(input: AttachGuestInput) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("reservations")
      .update({
        guest_name: input.guestName,
        guest_email: input.guestEmail,
        guest_phone: input.guestPhone ?? null,
        terms_accepted_at: input.termsAccepted ? new Date().toISOString() : null,
        notes: input.notes ?? null,
      })
      .eq("id", input.reservationId)
      .select()
      .single();
    if (error) throw error;
    return mapReservation(data);
  },

  async getReservation(id) {
    const db = supabaseAdmin();
    const { data } = await db.from("reservations").select().eq("id", id).maybeSingle();
    return data ? mapReservation(data) : null;
  },
  async getReservationByCode(code) {
    const db = supabaseAdmin();
    const { data } = await db.from("reservations").select().eq("code", code).maybeSingle();
    return data ? mapReservation(data) : null;
  },
  async getReservationByIdempotencyKey(key) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("reservations")
      .select()
      .eq("idempotency_key", key)
      .maybeSingle();
    return data ? mapReservation(data) : null;
  },

  async listReservations(filter: ReservationFilter) {
    const db = supabaseAdmin();
    let q = db.from("reservations").select().order("check_in", { ascending: true });
    if (filter.propertyId) q = q.eq("property_id", filter.propertyId);
    if (filter.status) q = q.in("status", filter.status);
    if (filter.source) q = q.eq("source", filter.source);
    if (filter.paymentState) q = q.eq("payment_state", filter.paymentState);
    if (filter.customerId) q = q.eq("customer_id", filter.customerId);
    if (filter.from) q = q.gte("check_out", filter.from);
    if (filter.to) q = q.lte("check_in", filter.to);
    if (filter.q) {
      const t = `%${filter.q}%`;
      q = q.or(
        `code.ilike.${t},guest_name.ilike.${t},guest_email.ilike.${t},guest_phone.ilike.${t},guest_doc_number.ilike.${t},invoice_number.ilike.${t},external_locator.ilike.${t}`,
      );
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapReservation);
  },

  async confirmReservation(id, paymentIntent) {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("confirm_reservation", {
      p_reservation: id,
      p_payment_intent: paymentIntent,
    });
    if (error) throw error;
    return mapReservation(Array.isArray(data) ? data[0] : data);
  },

  async cancelReservation(id, reason) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("reservations")
      .update({ status: "cancelled", hold_expires_at: null, notes: reason ?? null })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapReservation(data);
  },

  async expireStaleHolds() {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("expire_stale_holds");
    if (error) throw error;
    return Number(data ?? 0);
  },

  async listBlocks(propertyId) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("availability_blocks")
      .select()
      .eq("property_id", propertyId)
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapBlock);
  },

  async createBlock(input: CreateBlockInput) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("availability_blocks")
      .insert({
        property_id: input.propertyId,
        start_date: input.startDate,
        end_date: input.endDate,
        source: input.source,
        summary: input.summary ?? null,
        external_uid: input.externalUid ?? null,
      })
      .select()
      .single();
    if (isUnavailable(error)) throw new PropertyUnavailableError();
    if (error) throw error;
    return mapBlock(data);
  },

  async deleteBlock(id) {
    const db = supabaseAdmin();
    const { error } = await db.from("availability_blocks").delete().eq("id", id);
    if (error) throw error;
  },

  async syncExternalBlocks(propertyId: string, source: BlockSource, events: ExternalEvent[]) {
    const db = supabaseAdmin();
    const { data: current, error: readErr } = await db
      .from("availability_blocks")
      .select("id, external_uid, start_date, end_date, summary")
      .eq("property_id", propertyId)
      .eq("source", source);
    if (readErr) throw readErr;

    const incoming = new Map(events.map((e) => [e.uid, e]));
    const currentByUid = new Map((current ?? []).map((r: any) => [r.external_uid, r]));

    let created = 0;
    let kept = 0;
    let removed = 0;

    const toRemove = (current ?? []).filter((r: any) => !incoming.has(r.external_uid)).map((r: any) => r.id);
    if (toRemove.length) {
      const { error } = await db.from("availability_blocks").delete().in("id", toRemove);
      if (error) throw error;
      removed = toRemove.length;
    }

    for (const e of events) {
      const existing = currentByUid.get(e.uid) as any;
      if (existing) {
        if (
          existing.start_date !== e.startDate ||
          existing.end_date !== e.endDate ||
          existing.summary !== e.summary
        ) {
          const { error } = await db
            .from("availability_blocks")
            .update({ start_date: e.startDate, end_date: e.endDate, summary: e.summary })
            .eq("id", existing.id);
          if (error) throw error;
        }
        kept++;
      } else {
        const { error } = await db.from("availability_blocks").insert({
          property_id: propertyId,
          start_date: e.startDate,
          end_date: e.endDate,
          source,
          external_uid: e.uid,
          summary: e.summary,
        });
        // A collision with a direct reservation is logged by the caller, not fatal.
        if (error && !isUnavailable(error)) throw error;
        if (!error) created++;
      }
    }
    return { created, removed, kept };
  },

  async upsertPayment(input: UpsertPaymentInput) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("payments")
      .upsert(
        {
          reservation_id: input.reservationId,
          provider: input.provider,
          provider_checkout_session: input.providerCheckoutSession ?? null,
          provider_payment_intent: input.providerPaymentIntent ?? null,
          status: input.status,
          amount_cents: input.amountCents,
          currency: input.currency,
          raw: input.raw ?? {},
        },
        { onConflict: "provider,provider_checkout_session" },
      )
      .select()
      .single();
    if (error) throw error;
    return mapPayment(data);
  },

  async getPaymentBySession(session) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("payments")
      .select()
      .eq("provider_checkout_session", session)
      .maybeSingle();
    return data ? mapPayment(data) : null;
  },

  async getPaymentByIntent(paymentIntent: string) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("payments")
      .select()
      .eq("provider_payment_intent", paymentIntent)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? mapPayment(data) : null;
  },

  async listPayments(limit = 100) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("payments")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapPayment);
  },

  async claimWebhookEvent(provider, eventId, type, payload) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("webhook_events")
      .insert({ provider, event_id: eventId, type, payload: payload ?? {} });
    if (error) {
      if (error.code === "23505") return false; // already seen
      throw error;
    }
    return true;
  },

  async getRateOverride(propertyId: string) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("property_settings")
      .select("rate_config")
      .eq("property_id", propertyId)
      .maybeSingle();
    const cfg = data?.rate_config;
    return cfg && typeof cfg === "object" && Object.keys(cfg).length > 0 ? cfg : null;
  },

  async setRateOverride(propertyId: string, rateConfig: unknown) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("property_settings")
      .upsert({ property_id: propertyId, rate_config: rateConfig }, { onConflict: "property_id" });
    if (error) throw error;
  },

  // --- Marketing (issue #56 §6) -------------------------------------
  async listCustomerProfiles() {
    const db = supabaseAdmin();
    const [{ data: customers }, { data: reservations }] = await Promise.all([
      db.from("customers").select().is("merged_into", null),
      db.from("reservations").select(),
    ]);
    const res = (reservations ?? []).map(mapReservation);
    return (customers ?? []).map((c: any) => buildCustomerProfile(mapCustomer(c), res));
  },

  async segmentMembers(criteria: SegmentCriteria) {
    return evaluateSegment(criteria, await this.listCustomerProfiles());
  },

  async listSegments() {
    const db = supabaseAdmin();
    const { data, error } = await db.from("segments").select().order("name");
    if (error) throw error;
    return (data ?? []).map(mapSegment);
  },
  async getSegment(id) {
    const db = supabaseAdmin();
    const { data } = await db.from("segments").select().eq("id", id).maybeSingle();
    return data ? mapSegment(data) : null;
  },
  async createSegment(input: SegmentInput) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("segments")
      .insert({ name: input.name, description: input.description ?? null, criteria: input.criteria })
      .select()
      .single();
    if (error) throw error;
    return mapSegment(data);
  },
  async updateSegment(id, patch) {
    const db = supabaseAdmin();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.description !== undefined) row.description = patch.description ?? null;
    if (patch.criteria !== undefined) row.criteria = patch.criteria;
    const { data, error } = await db.from("segments").update(row).eq("id", id).select().single();
    if (error) throw error;
    return mapSegment(data);
  },
  async deleteSegment(id) {
    const db = supabaseAdmin();
    const { error } = await db.from("segments").delete().eq("id", id);
    if (error) throw error;
  },

  async listCampaigns() {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("campaigns")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapCampaign);
  },
  async getCampaign(id) {
    const db = supabaseAdmin();
    const { data } = await db.from("campaigns").select().eq("id", id).maybeSingle();
    return data ? mapCampaign(data) : null;
  },
  async createCampaign(input: CampaignInput) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("campaigns")
      .insert({
        name: input.name,
        channel: input.channel,
        segment_id: input.segmentId ?? null,
        subject: input.subject ?? null,
        body: input.body ?? null,
        coupon_code: input.couponCode ?? null,
        consent_required: input.consentRequired,
      })
      .select()
      .single();
    if (error) throw error;
    return mapCampaign(data);
  },
  async updateCampaign(id, patch) {
    const db = supabaseAdmin();
    const { data: cur } = await db.from("campaigns").select("status").eq("id", id).maybeSingle();
    if (cur?.status === "sent") throw new Error("CAMPAIGN_SENT");
    const row: Record<string, unknown> = { status: "draft" };
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.channel !== undefined) row.channel = patch.channel;
    if (patch.segmentId !== undefined) row.segment_id = patch.segmentId;
    if (patch.subject !== undefined) row.subject = patch.subject;
    if (patch.body !== undefined) row.body = patch.body;
    if (patch.couponCode !== undefined) row.coupon_code = patch.couponCode;
    if (patch.consentRequired !== undefined) row.consent_required = patch.consentRequired;
    const { data, error } = await db.from("campaigns").update(row).eq("id", id).select().single();
    if (error) throw error;
    return mapCampaign(data);
  },
  async deleteCampaign(id) {
    const db = supabaseAdmin();
    const { error } = await db.from("campaigns").delete().eq("id", id);
    if (error) throw error;
  },

  async prepareCampaign(id) {
    const db = supabaseAdmin();
    const campaign = await this.getCampaign(id);
    if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
    if (campaign.status === "sent") throw new Error("CAMPAIGN_SENT");

    const criteria = campaign.segmentId
      ? ((await this.getSegment(campaign.segmentId))?.criteria ?? {})
      : {};
    const members = await this.segmentMembers(criteria);
    const { data: unsubRows } = await db.from("marketing_unsubscribes").select("email");
    const unsub = new Set((unsubRows ?? []).map((u: any) => (u.email as string).toLowerCase()));

    await db.from("campaign_recipients").delete().eq("campaign_id", id);
    let ok = 0;
    let skipped = 0;
    const rows = members.map((m) => {
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
      return {
        campaign_id: id,
        customer_id: m.id,
        email: m.email,
        phone,
        status,
        error,
      };
    });
    if (rows.length) await db.from("campaign_recipients").insert(rows);
    const { data, error } = await db
      .from("campaigns")
      .update({ status: "prepared", prepared_at: new Date().toISOString(), recipient_count: ok })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { campaign: mapCampaign(data), recipients: ok, skipped };
  },

  async listCampaignRecipients(id) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("campaign_recipients")
      .select()
      .eq("campaign_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapCampaignRecipient);
  },

  async markCampaignSent(id) {
    const db = supabaseAdmin();
    const { data: cur } = await db.from("campaigns").select("status").eq("id", id).maybeSingle();
    if (!cur) throw new Error("CAMPAIGN_NOT_FOUND");
    if (cur.status !== "prepared") throw new Error("CAMPAIGN_NOT_PREPARED");
    await db
      .from("campaign_recipients")
      .update({ status: "skipped", error: "Envío masivo no configurado (Aún no configurado)" })
      .eq("campaign_id", id)
      .eq("status", "pending");
    const { data, error } = await db
      .from("campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapCampaign(data);
  },

  async addUnsubscribe(email, source) {
    const db = supabaseAdmin();
    const e = email.trim().toLowerCase();
    await db.from("marketing_unsubscribes").upsert({ email: e, source: source ?? null }, { onConflict: "email" });
    await db
      .from("customers")
      .update({ marketing_consent: false, marketing_consent_at: null })
      .ilike("email", e);
  },
  async isUnsubscribed(email) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("marketing_unsubscribes")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    return !!data;
  },
  async listUnsubscribes() {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("marketing_unsubscribes")
      .select()
      .order("unsubscribed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      email: r.email,
      unsubscribedAt: r.unsubscribed_at,
      source: r.source ?? null,
    }));
  },

  async listDailyRates(propertyId: string, from?: string, to?: string) {
    const db = supabaseAdmin();
    let q = db
      .from("daily_rates")
      .select("date, nightly_cents, min_nights")
      .eq("property_id", propertyId)
      .order("date", { ascending: true });
    if (from) q = q.gte("date", from);
    if (to) q = q.lte("date", to);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      date: r.date as string,
      ...(r.nightly_cents != null ? { nightlyCents: Number(r.nightly_cents) } : {}),
      ...(r.min_nights != null ? { minNights: Number(r.min_nights) } : {}),
    }));
  },

  async setDailyRates(propertyId, dates, patch) {
    const db = supabaseAdmin();
    const { data: current } = await db
      .from("daily_rates")
      .select("date, nightly_cents, min_nights")
      .eq("property_id", propertyId)
      .in("date", dates);
    const byDate = new Map((current ?? []).map((r: any) => [r.date, r]));
    const toUpsert: Record<string, unknown>[] = [];
    const toDelete: string[] = [];
    for (const date of dates) {
      const existing = byDate.get(date) as any;
      const nightly =
        patch.nightlyCents !== undefined ? patch.nightlyCents : (existing?.nightly_cents ?? null);
      const min =
        patch.minNights !== undefined ? patch.minNights : (existing?.min_nights ?? null);
      if (nightly == null && min == null) {
        toDelete.push(date);
      } else {
        toUpsert.push({ property_id: propertyId, date, nightly_cents: nightly, min_nights: min });
      }
    }
    if (toUpsert.length) {
      const { error } = await db
        .from("daily_rates")
        .upsert(toUpsert, { onConflict: "property_id,date" });
      if (error) throw error;
    }
    if (toDelete.length) {
      await db.from("daily_rates").delete().eq("property_id", propertyId).in("date", toDelete);
    }
  },

  async clearDailyRates(propertyId, dates) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("daily_rates")
      .delete()
      .eq("property_id", propertyId)
      .in("date", dates);
    if (error) throw error;
  },

  async getContentOverride(key: string) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("content_overrides")
      .select("key, value, updated_at")
      .eq("key", key)
      .maybeSingle();
    return data ? { key: data.key, value: data.value, updatedAt: data.updated_at } : null;
  },

  async listContentOverrides(prefix?: string) {
    const db = supabaseAdmin();
    let q = db.from("content_overrides").select("key, value, updated_at").order("key");
    if (prefix) q = q.like("key", `${prefix}%`);
    const { data } = await q;
    return (data ?? []).map((r) => ({ key: r.key, value: r.value, updatedAt: r.updated_at }));
  },

  async setContentOverride(key: string, value: unknown | null) {
    const db = supabaseAdmin();
    if (value === null || value === undefined) {
      const { error } = await db.from("content_overrides").delete().eq("key", key);
      if (error) throw error;
      return;
    }
    const { error } = await db
      .from("content_overrides")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  },

  async logEmail(entry: EmailLogEntry) {
    const db = supabaseAdmin();
    const { error } = await db.from("email_log").insert({
      reservation_id: entry.reservationId ?? null,
      kind: entry.kind,
      recipient: entry.recipient,
      status: entry.status,
      provider_id: entry.providerId ?? null,
      error: entry.error ?? null,
    });
    if (error) console.error("email_log insert failed", error);
  },

  async auditLog(entry) {
    const db = supabaseAdmin();
    const { error } = await db.from("admin_audit_log").insert({
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      meta: entry.meta ?? {},
    });
    if (error) console.error("admin_audit_log insert failed", error);
  },

  async listAuditLog(limit = 200) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("admin_audit_log")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      actorEmail: r.actor_email ?? null,
      action: r.action,
      entity: r.entity ?? null,
      entityId: r.entity_id ?? null,
      meta: r.meta ?? {},
      createdAt: r.created_at,
    }));
  },

  async listEmailLog(limit = 100) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("email_log")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(
      (r: any): EmailLogRow => ({
        id: r.id,
        reservationId: r.reservation_id,
        kind: r.kind,
        recipient: r.recipient,
        status: r.status,
        providerId: r.provider_id,
        error: r.error,
        createdAt: r.created_at,
      }),
    );
  },

  // --- Customers / CRM (issue #56) -------------------------------------
  async listCustomers(filter) {
    const db = supabaseAdmin();
    let q = db
      .from("customers")
      .select()
      .is("merged_into", null)
      .order("last_name", { ascending: true });
    if (filter?.channel) q = q.eq("channel_origin", filter.channel);
    if (filter?.consentOnly) q = q.eq("marketing_consent", true);
    if (filter?.q) {
      const t = `%${filter.q}%`;
      q = q.or(
        `first_name.ilike.${t},last_name.ilike.${t},email.ilike.${t},phone.ilike.${t},doc_number.ilike.${t}`,
      );
    }
    const { data, error } = await q;
    if (error) throw error;
    let rows = (data ?? []).map(mapCustomer);
    if (filter?.repeatersOnly || filter?.property) {
      const { data: res } = await db.from("reservations").select("customer_id, property_id, status");
      const byCustomer = new Map<string, { props: Set<string>; confirmed: number }>();
      for (const r of res ?? []) {
        if (!r.customer_id) continue;
        const e = byCustomer.get(r.customer_id) ?? { props: new Set(), confirmed: 0 };
        if (r.status === "confirmed") {
          e.props.add(r.property_id);
          e.confirmed++;
        }
        byCustomer.set(r.customer_id, e);
      }
      rows = rows.filter((c) => {
        const e = byCustomer.get(c.id);
        if (filter.repeatersOnly && (!e || e.confirmed < 2)) return false;
        if (filter.property && (!e || !e.props.has(filter.property))) return false;
        return true;
      });
    }
    return rows;
  },

  async getCustomer(id) {
    const db = supabaseAdmin();
    const { data } = await db.from("customers").select().eq("id", id).maybeSingle();
    return data ? mapCustomer(data) : null;
  },

  async createCustomer(input) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("customers")
      .insert(customerToRow({ ...input, firstName: input.firstName, lastName: input.lastName }))
      .select()
      .single();
    if (error) throw error;
    return mapCustomer(data);
  },

  async updateCustomer(id, patch) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("customers")
      .update(customerToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapCustomer(data);
  },

  async customerProfile(id) {
    const db = supabaseAdmin();
    const customer = await this.getCustomer(id);
    if (!customer) return null;
    const { data } = await db.from("reservations").select().eq("customer_id", id);
    return buildCustomerProfile(customer, (data ?? []).map(mapReservation));
  },

  async findCustomerDuplicates(id) {
    const target = await this.getCustomer(id);
    if (!target) return [];
    const all = await this.listCustomers();
    return findDuplicates(target, all);
  },

  async mergeCustomers(primaryId, duplicateId, actorEmail) {
    const db = supabaseAdmin();
    const primary = await this.getCustomer(primaryId);
    const dup = await this.getCustomer(duplicateId);
    if (!primary || !dup) throw new Error("CUSTOMER_NOT_FOUND");
    if (primaryId === duplicateId) return primary;

    const merged = mergedFields(primary, dup);
    await db.from("reservations").update({ customer_id: primaryId }).eq("customer_id", duplicateId);
    const { data, error } = await db
      .from("customers")
      .update(
        customerToRow({
          firstName: merged.firstName,
          lastName: merged.lastName,
          email: merged.email,
          phone: merged.phone,
          whatsapp: merged.whatsapp,
          docType: merged.docType,
          docNumber: merged.docNumber,
          address: merged.address,
          postalCode: merged.postalCode,
          city: merged.city,
          province: merged.province,
          country: merged.country,
          language: merged.language,
          channelOrigin: merged.channelOrigin,
          notes: merged.notes,
        }),
      )
      .eq("id", primaryId)
      .select()
      .single();
    if (error) throw error;
    if (merged.marketingConsent && !primary.marketingConsent) {
      await db
        .from("customers")
        .update({
          marketing_consent: true,
          marketing_consent_at: merged.marketingConsentAt,
          marketing_consent_source: merged.marketingConsentSource,
        })
        .eq("id", primaryId);
    }
    await db.from("customers").update({ merged_into: primaryId }).eq("id", duplicateId);
    await db
      .from("customer_merges")
      .insert({ primary_id: primaryId, merged_id: duplicateId, actor_email: actorEmail ?? null, snapshot: dup });
    await db.from("admin_audit_log").insert({
      actor_email: actorEmail ?? null,
      action: "customer.merge",
      entity: "customer",
      entity_id: primaryId,
      meta: { merged: duplicateId },
    });
    return mapCustomer(data);
  },

  async createManualReservation(input: CreateManualReservationInput) {
    const db = supabaseAdmin();
    const genCode = `PV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data, error } = await db
      .from("reservations")
      .insert({
        property_id: input.propertyId,
        code: genCode,
        status: input.status,
        source: input.source,
        channel_detail: input.channelDetail ?? null,
        check_in: input.checkIn,
        check_out: input.checkOut,
        guests: input.guests,
        currency: input.currency ?? "EUR",
        total_cents: input.totalCents,
        price_breakdown: { manual: true },
        customer_id: input.customerId ?? null,
        guest_name: input.guestName ?? null,
        guest_email: input.guestEmail ?? null,
        guest_phone: input.guestPhone ?? null,
        guest_doc_type: input.guestDocType ?? null,
        guest_doc_number: input.guestDocNumber ?? null,
        guest_address: input.guestAddress ?? null,
        guest_postal_code: input.guestPostalCode ?? null,
        guest_city: input.guestCity ?? null,
        guest_province: input.guestProvince ?? null,
        guest_country: input.guestCountry ?? null,
        external_locator: input.externalLocator ?? null,
        invoice_number: input.invoiceNumber ?? null,
        payment_method: input.paymentMethod ?? null,
        payment_state: input.paymentState ?? "pending",
        coupon_code: input.couponCode ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (isUnavailable(error)) throw new PropertyUnavailableError();
    if (error) throw error;
    const reservation = mapReservation(data);
    if (
      !reservation.customerId &&
      (reservation.guestEmail || reservation.guestPhone || reservation.guestName)
    ) {
      await this.linkOrCreateCustomerFromReservation(reservation.id);
      return (await this.getReservation(reservation.id)) ?? reservation;
    }
    return reservation;
  },

  async updateReservation(id, patch) {
    const db = supabaseAdmin();
    const row: Record<string, unknown> = {};
    const set = (k: string, v: unknown) => {
      if (v !== undefined) row[k] = v;
    };
    set("source", patch.source);
    set("channel_detail", patch.channelDetail);
    set("customer_id", patch.customerId);
    set("guest_name", patch.guestName);
    set("guest_email", patch.guestEmail);
    set("guest_phone", patch.guestPhone);
    set("guest_doc_type", patch.guestDocType);
    set("guest_doc_number", patch.guestDocNumber);
    set("guest_address", patch.guestAddress);
    set("guest_postal_code", patch.guestPostalCode);
    set("guest_city", patch.guestCity);
    set("guest_province", patch.guestProvince);
    set("guest_country", patch.guestCountry);
    set("external_locator", patch.externalLocator);
    set("invoice_number", patch.invoiceNumber);
    set("payment_method", patch.paymentMethod);
    set("payment_state", patch.paymentState);
    set("notes", patch.notes);
    const { data, error } = await db
      .from("reservations")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapReservation(data);
  },

  async linkOrCreateCustomerFromReservation(reservationId) {
    const r = await this.getReservation(reservationId);
    if (!r) return null;
    if (r.customerId) return this.getCustomer(r.customerId);
    if (!r.guestEmail && !r.guestPhone && !r.guestName) return null;
    const all = await this.listCustomers();
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
    const dup = findDuplicates(synthetic, all)[0];
    let customer: Customer;
    if (dup) {
      customer = dup.customer;
    } else {
      customer = await this.createCustomer({
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
    }
    await this.updateReservation(reservationId, { customerId: customer.id });
    return customer;
  },

  // --- Invoicing (issue #56 §3) --------------------------------------
  async listInvoices(filter) {
    const db = supabaseAdmin();
    let q = db.from("invoices").select().order("number", { ascending: false });
    if (filter?.propertyId) q = q.eq("property_id", filter.propertyId);
    if (filter?.series) q = q.eq("series", filter.series);
    if (filter?.status) q = q.in("status", filter.status);
    if (filter?.customerId) q = q.eq("customer_id", filter.customerId);
    if (filter?.q) {
      const t = `%${filter.q}%`;
      q = q.or(`number.ilike.${t},bill_to_name.ilike.${t},bill_to_tax_id.ilike.${t},bill_to_email.ilike.${t}`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  },

  async getInvoice(id) {
    const db = supabaseAdmin();
    const { data } = await db.from("invoices").select().eq("id", id).maybeSingle();
    if (!data) return null;
    const { data: items } = await db
      .from("invoice_items")
      .select()
      .eq("invoice_id", id)
      .order("position", { ascending: true });
    return { ...mapInvoice(data), items: (items ?? []).map(mapInvoiceItem) };
  },

  async getInvoiceByNumber(number) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("invoices")
      .select()
      .ilike("number", number.trim())
      .maybeSingle();
    return data ? mapInvoice(data) : null;
  },

  async invoicesForReservation(reservationId) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("invoices")
      .select()
      .eq("reservation_id", reservationId)
      .order("number", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  },

  async allInvoiceNumbers(propertyId) {
    const db = supabaseAdmin();
    let q = db.from("invoices").select("number");
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r: any) => r.number as string);
  },

  async invoiceSettings(propertyId) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("invoice_settings")
      .select()
      .eq("property_id", propertyId)
      .maybeSingle();
    if (data) {
      return {
        propertyId,
        series: data.series,
        taxRate: Number(data.tax_rate),
        taxExempt: !!data.tax_exempt,
        taxNote: data.tax_note,
      };
    }
    const slug = getPropertyById(propertyId)?.slug ?? propertyId;
    return {
      propertyId,
      series: defaultSeriesFor(slug),
      taxRate: 0,
      taxExempt: true,
      taxNote: DEFAULT_TAX_NOTE,
    } satisfies InvoiceSettings;
  },

  async setInvoiceSettings(propertyId, patch) {
    const db = supabaseAdmin();
    const current = await this.invoiceSettings(propertyId);
    const next: InvoiceSettings = { ...current, ...patch, propertyId };
    const { error } = await db.from("invoice_settings").upsert(
      {
        property_id: propertyId,
        series: next.series,
        tax_rate: next.taxRate,
        tax_exempt: next.taxExempt,
        tax_note: next.taxNote,
      },
      { onConflict: "property_id" },
    );
    if (error) throw error;
    return next;
  },

  async createInvoice(input: CreateInvoiceInput) {
    const db = supabaseAdmin();
    const cleanItems = input.items.filter((it) => it.description.trim());
    const totals = computeInvoiceTotals(cleanItems, {
      taxExempt: input.taxExempt,
      taxRate: input.taxRate,
    });
    const { data, error } = await db
      .from("invoices")
      .insert({ ...invoiceRowFrom(input, totals), status: "draft" })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new InvoiceNumberTakenError();
      throw error;
    }
    if (cleanItems.length) {
      const { error: itemErr } = await db.from("invoice_items").insert(
        cleanItems.map((it, position) => ({
          invoice_id: data.id,
          position,
          description: it.description.trim(),
          quantity: it.quantity,
          unit_cents: it.unitCents,
          amount_cents: lineAmountCents(it.quantity, it.unitCents),
        })),
      );
      if (itemErr) throw itemErr;
    }
    return (await this.getInvoice(data.id)) as InvoiceWithItems;
  },

  async updateInvoiceDraft(id, input: CreateInvoiceInput) {
    const db = supabaseAdmin();
    const existing = await db.from("invoices").select("status").eq("id", id).maybeSingle();
    if (!existing.data) throw new Error("INVOICE_NOT_FOUND");
    if (existing.data.status !== "draft") throw new InvoiceLockedError();
    const cleanItems = input.items.filter((it) => it.description.trim());
    const totals = computeInvoiceTotals(cleanItems, {
      taxExempt: input.taxExempt,
      taxRate: input.taxRate,
    });
    const { error } = await db
      .from("invoices")
      .update(invoiceRowFrom(input, totals))
      .eq("id", id);
    if (error) {
      if (error.code === "23505") throw new InvoiceNumberTakenError();
      throw error;
    }
    await db.from("invoice_items").delete().eq("invoice_id", id);
    if (cleanItems.length) {
      await db.from("invoice_items").insert(
        cleanItems.map((it, position) => ({
          invoice_id: id,
          position,
          description: it.description.trim(),
          quantity: it.quantity,
          unit_cents: it.unitCents,
          amount_cents: lineAmountCents(it.quantity, it.unitCents),
        })),
      );
    }
    return (await this.getInvoice(id)) as InvoiceWithItems;
  },

  async issueInvoice(id) {
    const db = supabaseAdmin();
    const { data: cur } = await db.from("invoices").select().eq("id", id).maybeSingle();
    if (!cur) throw new Error("INVOICE_NOT_FOUND");
    if (cur.status === "issued" || cur.status === "paid") return mapInvoice(cur);
    if (cur.status !== "draft") throw new InvoiceLockedError();
    const { data, error } = await db
      .from("invoices")
      .update({ status: "issued", issued_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapInvoice(data);
  },

  async setInvoiceStatus(id, status: InvoiceStatus) {
    const db = supabaseAdmin();
    const { data: cur } = await db.from("invoices").select("status").eq("id", id).maybeSingle();
    if (!cur) throw new Error("INVOICE_NOT_FOUND");
    const allowed: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ["issued"],
      issued: ["paid", "void", "rectified"],
      paid: ["void", "rectified"],
      void: [],
      rectified: [],
    };
    if (cur.status === status) {
      const { data } = await db.from("invoices").select().eq("id", id).single();
      return mapInvoice(data);
    }
    if (!allowed[cur.status as InvoiceStatus].includes(status)) {
      throw new InvoiceLockedError(`INVOICE_TRANSITION_INVALID: ${cur.status} → ${status}`);
    }
    const { data, error } = await db
      .from("invoices")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapInvoice(data);
  },

  async deleteInvoiceDraft(id) {
    const db = supabaseAdmin();
    const { data: cur } = await db.from("invoices").select("status").eq("id", id).maybeSingle();
    if (!cur) return;
    if (cur.status !== "draft") throw new InvoiceLockedError();
    const { error } = await db.from("invoices").delete().eq("id", id);
    if (error) throw error;
  },

  async getImportFeedUrl(propertyId: string, channel: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("channel_feeds")
      .select("url")
      .eq("property_id", propertyId)
      .eq("channel", channel)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.url ?? null;
  },

  async getCouponByCode(codeStr: string) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("coupons")
      .select()
      .eq("code", normalizeCode(codeStr))
      .maybeSingle();
    return data ? mapCoupon(data) : null;
  },

  async listCoupons() {
    const db = supabaseAdmin();
    const { data, error } = await db.from("coupons").select().order("code");
    if (error) throw error;
    return (data ?? []).map(mapCoupon);
  },

  async createCoupon(input: CouponInput) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("coupons")
      .insert(couponToRow(input))
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("COUPON_CODE_TAKEN");
      throw error;
    }
    return mapCoupon(data);
  },

  async updateCoupon(id: string, patch: Partial<CouponInput>) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("coupons")
      .update(couponToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapCoupon(data);
  },

  async deleteCoupon(id: string) {
    const db = supabaseAdmin();
    const { error } = await db.from("coupons").delete().eq("id", id);
    if (error) throw error;
  },

  async countCouponRedemptionsByEmail(couponId: string, email: string) {
    const db = supabaseAdmin();
    const { count, error } = await db
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", couponId)
      .ilike("guest_email", email.trim());
    if (error) throw error;
    return count ?? 0;
  },

  async redeemCoupon(couponId, reservationId, email, discountCents) {
    const db = supabaseAdmin();
    const { error } = await db.rpc("redeem_coupon", {
      p_coupon: couponId,
      p_reservation: reservationId,
      p_email: email,
      p_discount_cents: discountCents,
    });
    if (error && !error.message?.includes("COUPON_EXHAUSTED")) throw error;
    if (error) throw new Error("COUPON_EXHAUSTED");
  },

  async couponRedemptions(couponId: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("coupon_redemptions")
      .select("discount_cents, guest_email, created_at, reservations(code)")
      .eq("coupon_id", couponId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      reservationCode: r.reservations?.code ?? "—",
      discountCents: Number(r.discount_cents),
      email: r.guest_email,
      createdAt: r.created_at,
    }));
  },

  async setImportFeedUrl(propertyId: string, channel: string, url: string | null) {
    const db = supabaseAdmin();

    if (!url) {
      const { error } = await db
        .from("channel_feeds")
        .delete()
        .eq("property_id", propertyId)
        .eq("channel", channel);
      if (error) throw new Error(`No se pudo borrar en la base de datos: ${error.message}`);
      return;
    }

    const { error } = await db.from("channel_feeds").upsert(
      { property_id: propertyId, channel, url, updated_at: new Date().toISOString() },
      { onConflict: "property_id,channel" },
    );
    if (error) throw new Error(`No se pudo guardar en la base de datos: ${error.message}`);

    // Read-after-write: only a confirmed row counts as saved.
    const { data, error: readErr } = await db
      .from("channel_feeds")
      .select("url")
      .eq("property_id", propertyId)
      .eq("channel", channel)
      .maybeSingle();
    if (readErr) throw new Error(`No se pudo verificar el guardado: ${readErr.message}`);
    if (data?.url !== url) {
      throw new Error("La base de datos no confirmó el guardado de la URL.");
    }
  },

  async listImportFeeds(propertyId: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("channel_feeds")
      .select("channel, url")
      .eq("property_id", propertyId);
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((r: any) => r.url)
      .map((r: any) => ({ channel: r.channel as string, url: r.url as string }));
  },

  async reconcileExternalReservations(propertyId, source) {
    const db = supabaseAdmin();
    const [{ data: blocks }, { data: reservations }] = await Promise.all([
      db.from("availability_blocks").select().eq("property_id", propertyId).eq("source", source),
      db.from("reservations").select().eq("property_id", propertyId).eq("source", source),
    ]);
    const plan = planExternalReservations(
      (blocks ?? []).map(mapBlock),
      (reservations ?? []).map(mapReservation),
    );
    const channelDetail =
      source === "booking" ? "Booking.com" : source === "airbnb" ? "Airbnb" : String(source);

    for (const c of plan.toCreate) {
      const genCode = `PV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await db.from("reservations").insert({
        property_id: propertyId,
        code: genCode,
        status: "external",
        source,
        channel_detail: channelDetail,
        check_in: c.startDate,
        check_out: c.endDate,
        guests: 1,
        currency: "EUR",
        total_cents: 0,
        price_breakdown: { imported: true },
        external_uid: c.externalUid,
        external_locator: c.externalUid,
        notes: c.summary,
        payment_state: "pending",
      });
    }
    for (const u of plan.toUpdate) {
      await db
        .from("reservations")
        .update({ check_in: u.startDate, check_out: u.endDate })
        .eq("id", u.id);
    }
    for (const c of plan.toCancel) {
      await db
        .from("reservations")
        .update({ status: "cancelled", notes: `Bloqueo retirado del feed ${source}` })
        .eq("id", c.id);
    }
    return {
      created: plan.toCreate.length,
      updated: plan.toUpdate.length,
      cancelled: plan.toCancel.length,
    };
  },

  async getSyncRows(propertyId?: string) {
    const db = supabaseAdmin();
    let q = db.from("calendar_syncs").select();
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(
      (r: any): CalendarSyncRow => ({
        id: r.id,
        propertyId: r.property_id,
        channel: r.channel,
        direction: r.direction,
        feedUrl: r.feed_url,
        lastRunAt: r.last_run_at,
        lastStatus: r.last_status,
        lastError: r.last_error,
        eventsImported: r.events_imported,
      }),
    );
  },

  async recordSyncRun(propertyId, channel, direction, result) {
    const db = supabaseAdmin();
    // Telemetry only — NEVER writes feed_url. The feed URL lives in
    // channel_feeds and is owned exclusively by setImportFeedUrl().
    const { error } = await db.from("calendar_syncs").upsert(
      {
        property_id: propertyId,
        channel,
        direction,
        last_run_at: new Date().toISOString(),
        last_status: result.status,
        last_error: result.error ?? null,
        events_imported: result.eventsImported ?? 0,
      },
      { onConflict: "property_id,channel,direction" },
    );
    if (error) throw error;
  },

  // --- Durable jobs / transactional outbox (issue #76) -------------
  async enqueueJob(input: EnqueueJobInput) {
    const db = supabaseAdmin();
    const key = input.idempotencyKey ?? null;
    if (key) {
      const { data: existing } = await db
        .from("jobs")
        .select()
        .eq("idempotency_key", key)
        .neq("status", "cancelled")
        .maybeSingle();
      if (existing) return mapJob(existing);
    }
    const { data, error } = await db
      .from("jobs")
      .insert({
        type: input.type,
        payload: input.payload ?? {},
        idempotency_key: key,
        max_attempts: input.maxAttempts ?? 5,
        run_after: input.runAfter ?? new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      // Lost an enqueue race on the unique idempotency_key — return the winner.
      if (error.code === "23505" && key) {
        const { data: winner } = await db
          .from("jobs")
          .select()
          .eq("idempotency_key", key)
          .maybeSingle();
        if (winner) return mapJob(winner);
      }
      throw error;
    }
    return mapJob(data);
  },

  async claimJobs(worker: string, batch: number, leaseSeconds: number) {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("claim_jobs", {
      p_worker: worker,
      p_batch: batch,
      p_lease_seconds: leaseSeconds,
    });
    if (error) throw error;
    return (data ?? []).map(mapJob);
  },

  async settleJob(id: string, s: JobSettlement) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("jobs")
      .update({
        status: s.status,
        attempts: s.attempts,
        run_after: s.runAfter,
        last_error: s.lastError,
        result: s.result,
        succeeded_at: s.succeededAt,
        dead_lettered_at: s.deadLetteredAt,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  },

  async listJobs(filter?: JobFilter) {
    const db = supabaseAdmin();
    let q = db.from("jobs").select().order("created_at", { ascending: false });
    if (filter?.status?.length) q = q.in("status", filter.status);
    if (filter?.type) q = q.eq("type", filter.type);
    q = q.limit(filter?.limit ?? 200);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapJob);
  },

  async getJob(id: string) {
    const db = supabaseAdmin();
    const { data } = await db.from("jobs").select().eq("id", id).maybeSingle();
    return data ? mapJob(data) : null;
  },

  async retryJob(id: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("jobs")
      .update({
        status: "queued",
        run_after: new Date().toISOString(),
        last_error: null,
        dead_lettered_at: null,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapJob(data);
  },

  async cancelJob(id: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("jobs")
      .update({
        status: "cancelled",
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .neq("status", "succeeded")
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) return mapJob(data);
    const current = await db.from("jobs").select().eq("id", id).single();
    return mapJob(current.data);
  },

  // --- Guest communications lifecycle (issue #69) -----------------
  async syncReservationMessages(reservationId: string, desired: DesiredMessage[]) {
    const db = supabaseAdmin();
    const { data: existing } = await db
      .from("scheduled_messages")
      .select()
      .eq("reservation_id", reservationId);
    const rows = (existing ?? []) as any[];
    const wanted = new Map(desired.map((d) => [d.kind, d.sendAt]));

    const inserts: any[] = [];
    for (const [kind, sendAt] of wanted) {
      const row = rows.find((r) => r.kind === kind);
      if (!row) {
        inserts.push({ reservation_id: reservationId, kind, send_at: sendAt, status: "planned" });
      } else if (row.status === "planned" && row.send_at !== sendAt) {
        await db.from("scheduled_messages").update({ send_at: sendAt }).eq("id", row.id);
      }
    }
    if (inserts.length) {
      const { error } = await db.from("scheduled_messages").insert(inserts);
      if (error && error.code !== "23505") throw error;
    }
    const retire = rows
      .filter((r) => r.status === "planned" && !wanted.has(r.kind))
      .map((r) => r.id);
    if (retire.length) {
      await db.from("scheduled_messages").update({ status: "cancelled" }).in("id", retire);
    }
  },

  async cancelReservationMessages(reservationId: string) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("scheduled_messages")
      .update({ status: "cancelled" })
      .eq("reservation_id", reservationId)
      .eq("status", "planned");
    if (error) throw error;
  },

  async listScheduledMessages(filter?: CommsFilter) {
    const db = supabaseAdmin();
    let q = db.from("scheduled_messages").select().order("send_at", { ascending: false });
    if (filter?.status?.length) q = q.in("status", filter.status);
    if (filter?.kind) q = q.eq("kind", filter.kind);
    q = q.limit(filter?.limit ?? 200);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapScheduledMessage);
  },

  async listReservationMessages(reservationId: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("scheduled_messages")
      .select()
      .eq("reservation_id", reservationId)
      .order("send_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapScheduledMessage);
  },

  async dueScheduledMessages(nowIso: string, limit: number) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("scheduled_messages")
      .select()
      .eq("status", "planned")
      .lte("send_at", nowIso)
      .order("send_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapScheduledMessage);
  },

  async markScheduledMessage(id, patch) {
    const db = supabaseAdmin();
    const upd: Record<string, unknown> = { status: patch.status };
    if (patch.attempts != null) upd.attempts = patch.attempts;
    if (patch.sendAt !== undefined) upd.send_at = patch.sendAt;
    if (patch.sentAt !== undefined) upd.sent_at = patch.sentAt;
    if (patch.lastError !== undefined) upd.last_error = patch.lastError;
    if (patch.providerId !== undefined) upd.provider_id = patch.providerId;
    const { error } = await db.from("scheduled_messages").update(upd).eq("id", id);
    if (error) throw error;
  },

  async resetScheduledMessage(id: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("scheduled_messages")
      .update({ status: "planned", send_at: new Date().toISOString(), last_error: null })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapScheduledMessage(data);
  },

  // --- Admin users / RBAC (issue #65) ----------------------------
  async listAdminUsers() {
    const db = supabaseAdmin();
    const { data, error } = await db.from("admin_users").select().order("email");
    if (error) throw error;
    return (data ?? []).map(mapAdminUser);
  },

  async getAdminUserById(id: string) {
    const db = supabaseAdmin();
    const { data, error } = await db.from("admin_users").select().eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapAdminUser(data) : null;
  },

  async getAdminUserByEmail(email: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("admin_users")
      .select()
      .ilike("email", email.trim())
      .maybeSingle();
    if (error) throw error;
    return data ? mapAdminUser(data) : null;
  },

  async createAdminUser(input) {
    const db = supabaseAdmin();
    const insert: Record<string, unknown> = {
      email: input.email.trim(),
      full_name: input.fullName ?? null,
      role: input.role,
      active: !input.inviteTokenHash,
      invited_by: input.invitedBy ?? null,
      invite_token_hash: input.inviteTokenHash ?? null,
      invite_expires_at: input.inviteExpiresAt ?? null,
    };
    if (input.id) insert.id = input.id;
    const { data, error } = await db.from("admin_users").insert(insert).select().single();
    if (error) {
      if ((error as { code?: string }).code === "23505") throw new Error("ADMIN_USER_EMAIL_TAKEN");
      throw error;
    }
    return mapAdminUser(data);
  },

  async updateAdminUser(id, patch) {
    const db = supabaseAdmin();
    const upd: Record<string, unknown> = {};
    if (patch.role !== undefined) upd.role = patch.role;
    if (patch.active !== undefined) upd.active = patch.active;
    if (patch.fullName !== undefined) upd.full_name = patch.fullName;
    if (patch.mfaRequired !== undefined) upd.mfa_required = patch.mfaRequired;
    const { data, error } = await db.from("admin_users").update(upd).eq("id", id).select().single();
    if (error) throw error;
    return mapAdminUser(data);
  },

  async revokeAdminUserSessions(id: string) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("admin_users")
      .update({ sessions_valid_from: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async acceptAdminInvite(id: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("admin_users")
      .update({ invite_token_hash: null, invite_expires_at: null, active: true })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapAdminUser(data);
  },

  async deleteAdminUser(id: string) {
    const db = supabaseAdmin();
    const { error } = await db.from("admin_users").delete().eq("id", id);
    if (error) throw error;
  },

  async touchAdminUser(id: string) {
    const db = supabaseAdmin();
    await db.from("admin_users").update({ last_seen_at: new Date().toISOString() }).eq("id", id);
  },

  // --- Privacy lifecycle / GDPR (issue #79) ----------------------
  async anonymizeReservationContact(id: string) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("reservations")
      .update({
        guest_name: "[borrado a petición]",
        guest_email: null,
        guest_phone: null,
        guest_doc_number: null,
        guest_doc_type: null,
        guest_address: null,
        guest_city: null,
        guest_postal_code: null,
        external_locator: null,
        notes: null,
      })
      .eq("id", id);
    if (error) throw error;
  },

  async anonymizeCustomerContact(id: string) {
    const db = supabaseAdmin();
    const { error } = await db
      .from("customers")
      .update({
        first_name: "[borrado]",
        last_name: "",
        email: null,
        phone: null,
        whatsapp: null,
        doc_number: null,
        address: null,
        postal_code: null,
        notes: null,
        marketing_consent: false,
        marketing_consent_at: null,
        marketing_consent_source: null,
      })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteReservationHard(id: string) {
    const db = supabaseAdmin();
    await db.from("invoices").update({ reservation_id: null }).eq("reservation_id", id);
    await db.from("scheduled_messages").delete().eq("reservation_id", id);
    await db.from("payments").delete().eq("reservation_id", id);
    const { error } = await db.from("reservations").delete().eq("id", id);
    if (error) throw error;
  },

  async deleteScheduledMessagesBefore(beforeIso: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("scheduled_messages")
      .delete()
      .in("status", ["sent", "failed", "cancelled", "skipped"])
      .lt("updated_at", beforeIso)
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  },

  async deleteAuditLogBefore(beforeIso: string) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("admin_audit_log")
      .delete()
      .lt("created_at", beforeIso)
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  },

  // --- Media library (issue #81) --------------------------------
  async listMedia(filter) {
    const db = supabaseAdmin();
    let q = db.from("media_assets").select().order("created_at", { ascending: false });
    if (filter?.tag) q = q.contains("tags", [filter.tag]);
    if (filter?.q) q = q.or(`filename.ilike.%${filter.q}%,alt.ilike.%${filter.q}%`);
    q = q.limit(filter?.limit ?? 200);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []).map(mapMediaAsset);
    await attachSignedUrls(rows);
    return rows;
  },

  async getMediaAsset(id: string) {
    const db = supabaseAdmin();
    const { data, error } = await db.from("media_assets").select().eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = mapMediaAsset(data);
    await attachSignedUrls([row]);
    return row;
  },

  async createMediaAsset(input) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("media_assets")
      .insert({
        bucket: "media",
        path: input.path,
        filename: input.filename,
        mime: input.mime,
        size_bytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        alt: input.alt ?? "",
        tags: input.tags ?? [],
        uploaded_by: input.uploadedBy ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMediaAsset(data);
  },

  async updateMediaAsset(id, patch) {
    const db = supabaseAdmin();
    const upd: Record<string, unknown> = {};
    if (patch.alt !== undefined) upd.alt = patch.alt;
    if (patch.focalX !== undefined) upd.focal_x = patch.focalX;
    if (patch.focalY !== undefined) upd.focal_y = patch.focalY;
    if (patch.tags !== undefined) upd.tags = patch.tags;
    const { data, error } = await db.from("media_assets").update(upd).eq("id", id).select().single();
    if (error) throw error;
    return mapMediaAsset(data);
  },

  async deleteMediaAsset(id: string) {
    const db = supabaseAdmin();
    const { data } = await db.from("media_assets").select("bucket,path").eq("id", id).maybeSingle();
    if (data) {
      await db.storage.from((data as { bucket: string }).bucket).remove([(data as { path: string }).path]);
    }
    const { error } = await db.from("media_assets").delete().eq("id", id);
    if (error) throw error;
  },
};

function mapMediaAsset(row: any): MediaAsset {
  return {
    id: row.id,
    bucket: row.bucket ?? "media",
    path: row.path,
    filename: row.filename,
    mime: row.mime,
    sizeBytes: Number(row.size_bytes ?? 0),
    width: row.width ?? null,
    height: row.height ?? null,
    alt: row.alt ?? "",
    focalX: typeof row.focal_x === "number" ? row.focal_x : 0.5,
    focalY: typeof row.focal_y === "number" ? row.focal_y : 0.5,
    tags: row.tags ?? [],
    uploadedBy: row.uploaded_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function attachSignedUrls(rows: MediaAsset[]): Promise<void> {
  if (!rows.length) return;
  const db = supabaseAdmin();
  const byBucket = new Map<string, MediaAsset[]>();
  for (const r of rows) {
    const list = byBucket.get(r.bucket) ?? [];
    list.push(r);
    byBucket.set(r.bucket, list);
  }
  for (const [bucket, list] of byBucket) {
    const { data } = await db.storage.from(bucket).createSignedUrls(
      list.map((r) => r.path),
      3600,
    );
    for (const entry of data ?? []) {
      const match = list.find((r) => r.path === entry.path);
      if (match && entry.signedUrl) match.signedUrl = entry.signedUrl;
    }
  }
}

function mapAdminUser(row: any): AdminUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? null,
    role: row.role,
    active: !!row.active,
    sessionsValidFrom: row.sessions_valid_from,
    mfaRequired: !!row.mfa_required,
    invitedBy: row.invited_by ?? null,
    inviteTokenHash: row.invite_token_hash ?? null,
    inviteExpiresAt: row.invite_expires_at ?? null,
    lastSeenAt: row.last_seen_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScheduledMessage(row: any): ScheduledMessage {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    kind: row.kind,
    sendAt: row.send_at,
    status: row.status,
    attempts: Number(row.attempts ?? 0),
    sentAt: row.sent_at ?? null,
    lastError: row.last_error ?? null,
    providerId: row.provider_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row: any): Job {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload ?? {},
    idempotencyKey: row.idempotency_key ?? null,
    status: row.status,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 5),
    runAfter: row.run_after,
    lockedAt: row.locked_at ?? null,
    lockedBy: row.locked_by ?? null,
    lastError: row.last_error ?? null,
    result: row.result ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    succeededAt: row.succeeded_at ?? null,
    deadLetteredAt: row.dead_lettered_at ?? null,
  };
}
