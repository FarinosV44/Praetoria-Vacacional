import type { IsoDate } from "@/lib/dates";
import type {
  AvailabilityBlock,
  BlockSource,
  BusyRange,
  CalendarSyncRow,
  Payment,
  Reservation,
  ReservationStatus,
} from "@/domains/booking/types";
import type { Coupon } from "@/domains/pricing/coupons";

export interface CreateHoldInput {
  propertyId: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  totalCents: number;
  originalTotalCents?: number | null;
  discountCents?: number;
  couponCode?: string | null;
  currency: "EUR";
  priceBreakdown: unknown;
  holdMinutes: number;
  idempotencyKey: string;
}

export interface CouponInput {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  propertySlug: string | null;
  startsOn: IsoDate | null;
  endsOn: IsoDate | null;
  minNights: number;
  minTotalCents: number;
  maxUses: number | null;
  maxUsesPerEmail: number | null;
  autoApply: boolean;
  active: boolean;
  description: string | null;
}

export interface AttachGuestInput {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  termsAccepted: boolean;
  notes?: string | null;
}

export interface ReservationFilter {
  propertyId?: string;
  status?: ReservationStatus[];
  from?: IsoDate;
  to?: IsoDate;
}

export interface CreateBlockInput {
  propertyId: string;
  startDate: IsoDate;
  endDate: IsoDate;
  source: BlockSource;
  summary?: string | null;
  externalUid?: string | null;
}

export interface ExternalEvent {
  uid: string;
  startDate: IsoDate;
  endDate: IsoDate;
  summary: string | null;
}

export interface UpsertPaymentInput {
  reservationId: string;
  provider: string;
  providerCheckoutSession?: string | null;
  providerPaymentIntent?: string | null;
  status: Payment["status"];
  amountCents: number;
  currency: "EUR";
  raw?: unknown;
}

export interface EmailLogEntry {
  reservationId?: string | null;
  kind: "confirmation" | "payment_failed" | "internal";
  recipient: string;
  status: "sent" | "failed" | "skipped";
  providerId?: string | null;
  error?: string | null;
}

export interface EmailLogRow extends EmailLogEntry {
  id: string;
  createdAt: string;
}

export interface ContentOverrideRow {
  key: string;
  value: unknown;
  updatedAt: string;
}

/** Thrown when a hold/block cannot be created because the dates are taken. */
export class PropertyUnavailableError extends Error {
  constructor(message = "PROPERTY_UNAVAILABLE") {
    super(message);
    this.name = "PropertyUnavailableError";
  }
}

export interface Repository {
  readonly kind: "memory" | "supabase";

  // --- Availability -------------------------------------------------------
  getBusyRanges(propertyId: string, from: IsoDate, to: IsoDate): Promise<BusyRange[]>;
  isStayAvailable(propertyId: string, checkIn: IsoDate, checkOut: IsoDate): Promise<boolean>;

  // --- Reservations ------------------------------------------------------
  createHold(input: CreateHoldInput): Promise<Reservation>;
  attachGuest(input: AttachGuestInput): Promise<Reservation>;
  getReservation(id: string): Promise<Reservation | null>;
  getReservationByCode(code: string): Promise<Reservation | null>;
  getReservationByIdempotencyKey(key: string): Promise<Reservation | null>;
  listReservations(filter: ReservationFilter): Promise<Reservation[]>;
  confirmReservation(id: string, paymentIntent: string): Promise<Reservation>;
  cancelReservation(id: string, reason?: string): Promise<Reservation>;
  expireStaleHolds(): Promise<number>;

  // --- Availability blocks ---------------------------------------------
  listBlocks(propertyId: string): Promise<AvailabilityBlock[]>;
  createBlock(input: CreateBlockInput): Promise<AvailabilityBlock>;
  deleteBlock(id: string): Promise<void>;
  /** iCal import: replace the set of external blocks for (property, source). */
  syncExternalBlocks(
    propertyId: string,
    source: BlockSource,
    events: ExternalEvent[],
  ): Promise<{ created: number; removed: number; kept: number }>;

  // --- Payments --------------------------------------------------------
  upsertPayment(input: UpsertPaymentInput): Promise<Payment>;
  getPaymentBySession(session: string): Promise<Payment | null>;
  listPayments(limit?: number): Promise<Payment[]>;

  // --- Webhook idempotency -------------------------------------------
  /** Returns true the first time an event id is seen, false afterwards. */
  claimWebhookEvent(provider: string, eventId: string, type: string, payload: unknown): Promise<boolean>;

  // --- Rate config overrides (admin-editable, issue #13) ------------
  /** Admin-saved rate config for a property, or null to use the file default. */
  getRateOverride(propertyId: string): Promise<unknown | null>;
  setRateOverride(propertyId: string, rateConfig: unknown): Promise<void>;

  // --- Content overrides — light CMS (issue #50) -------------------
  /** One override document by key (e.g. "property:javalambre", "guide:valencia:...") */
  getContentOverride(key: string): Promise<ContentOverrideRow | null>;
  listContentOverrides(prefix?: string): Promise<ContentOverrideRow[]>;
  /** Pass `null` to clear the override. */
  setContentOverride(key: string, value: unknown | null): Promise<void>;

  // --- Email log (issue #42) ---------------------------------------
  logEmail(entry: EmailLogEntry): Promise<void>;
  listEmailLog(limit?: number): Promise<EmailLogRow[]>;

  // --- Coupons (issue #45) ----------------------------------------
  getCouponByCode(code: string): Promise<Coupon | null>;
  listCoupons(): Promise<Coupon[]>;
  createCoupon(input: CouponInput): Promise<Coupon>;
  updateCoupon(id: string, patch: Partial<CouponInput>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;
  countCouponRedemptionsByEmail(couponId: string, email: string): Promise<number>;
  redeemCoupon(
    couponId: string,
    reservationId: string,
    email: string | null,
    discountCents: number,
  ): Promise<void>;
  couponRedemptions(couponId: string): Promise<
    { reservationCode: string; discountCents: number; email: string | null; createdAt: string }[]
  >;

  // --- Channel import feed URLs, admin-editable (issue #42) --------
  getImportFeedUrl(propertyId: string, channel: string): Promise<string | null>;
  setImportFeedUrl(propertyId: string, channel: string, url: string | null): Promise<void>;

  // --- Calendar sync bookkeeping -----------------------------------
  getSyncRows(propertyId?: string): Promise<CalendarSyncRow[]>;
  recordSyncRun(
    propertyId: string,
    channel: string,
    direction: "import" | "export",
    result: { status: string; error?: string | null; eventsImported?: number; feedUrl?: string | null },
  ): Promise<void>;
}
