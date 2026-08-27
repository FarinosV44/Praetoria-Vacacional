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
  type EmailLogEntry,
  type EmailLogRow,
  type ExternalEvent,
  type Repository,
  type ReservationFilter,
  type UpsertPaymentInput,
} from "./types";
import { normalizeCode, type Coupon } from "@/domains/pricing/coupons";

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
  };
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
    if (filter.from) q = q.gte("check_out", filter.from);
    if (filter.to) q = q.lte("check_in", filter.to);
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

  async getImportFeedUrl(propertyId: string, channel: string) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("calendar_syncs")
      .select("feed_url")
      .eq("property_id", propertyId)
      .eq("channel", channel)
      .eq("direction", "import")
      .maybeSingle();
    return data?.feed_url ?? null;
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
    const { error } = await db.from("calendar_syncs").upsert(
      { property_id: propertyId, channel, direction: "import", feed_url: url },
      { onConflict: "property_id,channel,direction" },
    );
    if (error) throw error;
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
    const { error } = await db.from("calendar_syncs").upsert(
      {
        property_id: propertyId,
        channel,
        direction,
        feed_url: result.feedUrl ?? null,
        last_run_at: new Date().toISOString(),
        last_status: result.status,
        last_error: result.error ?? null,
        events_imported: result.eventsImported ?? 0,
      },
      { onConflict: "property_id,channel,direction" },
    );
    if (error) throw error;
  },
};
