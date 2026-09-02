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
import type { Customer, CustomerFilter, CustomerInput, CustomerProfile } from "@/domains/crm/types";
import type { DuplicateMatch } from "@/domains/crm/dedup";
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceFilter,
  InvoiceSettings,
  InvoiceStatus,
  InvoiceWithItems,
} from "@/domains/invoicing/types";
import type {
  Campaign,
  CampaignInput,
  CampaignRecipient,
  Segment,
  SegmentInput,
} from "@/domains/marketing/types";
import type { SegmentCriteria } from "@/domains/marketing/segments";
import type {
  EnqueueJobInput,
  Job,
  JobFilter,
  JobSettlement,
} from "@/domains/jobs/types";
import type {
  CommsFilter,
  DesiredMessage,
  ScheduledMessage,
  ScheduledMessageStatus,
} from "@/domains/comms/types";
import type { AdminUser, AdminUserInput } from "@/domains/admin/users";

/** Thrown when an invoice number is already used by another invoice. */
export class InvoiceNumberTakenError extends Error {
  constructor(message = "INVOICE_NUMBER_TAKEN") {
    super(message);
    this.name = "InvoiceNumberTakenError";
  }
}

/** Thrown when an operation is not allowed for the invoice's current status. */
export class InvoiceLockedError extends Error {
  constructor(message = "INVOICE_LOCKED") {
    super(message);
    this.name = "InvoiceLockedError";
  }
}

/**
 * Thrown when a write that must survive a refresh could not be persisted —
 * e.g. DEMO mode on a read-only serverless filesystem. The caller must surface
 * this to the user, never report success.
 */
export class PersistenceUnavailableError extends Error {
  constructor(message = "PERSISTENCE_UNAVAILABLE") {
    super(message);
    this.name = "PersistenceUnavailableError";
  }
}

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

/** Manually register a reservation from any channel (issue #56 §2). */
export interface CreateManualReservationInput {
  propertyId: string;
  source: import("@/domains/booking/types").ReservationSource;
  channelDetail?: string | null;
  /** 'confirmed' holds availability; 'external' is informational (block holds it). */
  status: "confirmed" | "external" | "pending";
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  totalCents: number;
  currency?: "EUR";
  customerId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestDocType?: string | null;
  guestDocNumber?: string | null;
  guestAddress?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  guestProvince?: string | null;
  guestCountry?: string | null;
  externalLocator?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  paymentState?: import("@/domains/booking/types").PaymentState;
  couponCode?: string | null;
  notes?: string | null;
}

/** Fields the intranet can set on a reservation (issue #56 §2). */
export interface ReservationPatch {
  source?: import("@/domains/booking/types").ReservationSource;
  channelDetail?: string | null;
  customerId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestDocType?: string | null;
  guestDocNumber?: string | null;
  guestAddress?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  guestProvince?: string | null;
  guestCountry?: string | null;
  externalLocator?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  paymentState?: import("@/domains/booking/types").PaymentState;
  notes?: string | null;
}

export interface ReservationFilter {
  propertyId?: string;
  status?: ReservationStatus[];
  from?: IsoDate;
  to?: IsoDate;
  source?: import("@/domains/booking/types").ReservationSource;
  paymentState?: import("@/domains/booking/types").PaymentState;
  customerId?: string;
  /** Free-text over code, guest name/email/phone/doc, invoice number, locator. */
  q?: string;
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
  kind:
    | "confirmation"
    | "payment_failed"
    | "internal"
    | "pre_arrival"
    | "checkin_info"
    | "checkout_reminder"
    | "review_request";
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

export interface AuditEntry {
  actorEmail?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  meta?: unknown;
}

export interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: unknown;
  createdAt: string;
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

  // --- Per-date price / min-stay overrides (issue #56 §5) ----------
  listDailyRates(
    propertyId: string,
    from?: IsoDate,
    to?: IsoDate,
  ): Promise<import("@/domains/pricing/types").DayRate[]>;
  /** Upsert one patch across many dates. null clears that field. */
  setDailyRates(
    propertyId: string,
    dates: IsoDate[],
    patch: { nightlyCents?: number | null; minNights?: number | null },
  ): Promise<void>;
  clearDailyRates(propertyId: string, dates: IsoDate[]): Promise<void>;

  // --- Content overrides — light CMS (issue #50) -------------------
  /** One override document by key (e.g. "property:javalambre", "guide:valencia:...") */
  getContentOverride(key: string): Promise<ContentOverrideRow | null>;
  listContentOverrides(prefix?: string): Promise<ContentOverrideRow[]>;
  /** Pass `null` to clear the override. */
  setContentOverride(key: string, value: unknown | null): Promise<void>;

  // --- Email log (issue #42) ---------------------------------------
  logEmail(entry: EmailLogEntry): Promise<void>;
  listEmailLog(limit?: number): Promise<EmailLogRow[]>;

  // --- Admin action audit log (issue #56 §10) ---------------------
  auditLog(entry: AuditEntry): Promise<void>;
  listAuditLog(limit?: number): Promise<AuditRow[]>;

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

  // --- Customers / CRM (issue #56 §4) -----------------------------
  listCustomers(filter?: CustomerFilter): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  createCustomer(input: CustomerInput): Promise<Customer>;
  updateCustomer(id: string, patch: Partial<CustomerInput>): Promise<Customer>;
  customerProfile(id: string): Promise<CustomerProfile | null>;
  findCustomerDuplicates(id: string): Promise<DuplicateMatch[]>;
  /** Fold `duplicateId` into `primaryId`; reservations follow, dup is hidden. */
  mergeCustomers(
    primaryId: string,
    duplicateId: string,
    actorEmail?: string | null,
  ): Promise<Customer>;

  // --- Reservation editing from the intranet (issue #56 §2) -------
  createManualReservation(input: CreateManualReservationInput): Promise<Reservation>;
  updateReservation(id: string, patch: ReservationPatch): Promise<Reservation>;
  /** Get-or-create a customer from a reservation's guest fields and link it. */
  linkOrCreateCustomerFromReservation(reservationId: string): Promise<Customer | null>;

  // --- Invoicing (issue #56 §3) ----------------------------------
  listInvoices(filter?: InvoiceFilter): Promise<Invoice[]>;
  getInvoice(id: string): Promise<InvoiceWithItems | null>;
  getInvoiceByNumber(number: string): Promise<Invoice | null>;
  invoicesForReservation(reservationId: string): Promise<Invoice[]>;
  allInvoiceNumbers(propertyId?: string): Promise<string[]>;
  invoiceSettings(propertyId: string): Promise<InvoiceSettings>;
  setInvoiceSettings(
    propertyId: string,
    patch: Partial<Omit<InvoiceSettings, "propertyId">>,
  ): Promise<InvoiceSettings>;
  /** Always created as 'draft'. Rejects a number already in use. */
  createInvoice(input: CreateInvoiceInput): Promise<InvoiceWithItems>;
  /** Only while 'draft'. Replaces items and recomputes totals. */
  updateInvoiceDraft(id: string, input: CreateInvoiceInput): Promise<InvoiceWithItems>;
  /** 'draft' → 'issued'; freezes the invoice (immutable thereafter). */
  issueInvoice(id: string): Promise<Invoice>;
  /** Status transitions after issue: issued→paid/void/rectified, paid→void. */
  setInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice>;
  /** Only a 'draft' can be deleted. */
  deleteInvoiceDraft(id: string): Promise<void>;

  // --- Marketing: segments + campaigns (issue #56 §6) -------------
  listCustomerProfiles(): Promise<CustomerProfile[]>;
  segmentMembers(criteria: SegmentCriteria): Promise<CustomerProfile[]>;
  listSegments(): Promise<Segment[]>;
  getSegment(id: string): Promise<Segment | null>;
  createSegment(input: SegmentInput): Promise<Segment>;
  updateSegment(id: string, patch: Partial<SegmentInput>): Promise<Segment>;
  deleteSegment(id: string): Promise<void>;

  listCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | null>;
  createCampaign(input: CampaignInput): Promise<Campaign>;
  updateCampaign(id: string, patch: Partial<CampaignInput>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  /** Materialise the recipient list from the segment, honouring consent + unsubscribes. */
  prepareCampaign(id: string): Promise<{ campaign: Campaign; recipients: number; skipped: number }>;
  listCampaignRecipients(id: string): Promise<CampaignRecipient[]>;
  /** Records the send intent. Real bulk send is not wired (Aún no configurado). */
  markCampaignSent(id: string): Promise<Campaign>;

  addUnsubscribe(email: string, source?: string): Promise<void>;
  isUnsubscribed(email: string): Promise<boolean>;
  listUnsubscribes(): Promise<{ email: string; unsubscribedAt: string; source: string | null }[]>;

  // --- Channel import feed URLs, admin-editable (issue #42) --------
  getImportFeedUrl(propertyId: string, channel: string): Promise<string | null>;
  setImportFeedUrl(propertyId: string, channel: string, url: string | null): Promise<void>;
  /** All channels with an admin-set import URL for a property. */
  listImportFeeds(propertyId: string): Promise<{ channel: string; url: string }[]>;

  // --- Booking/Airbnb → internal reservation records (issue #56 §8) -
  /** Mirror this channel's availability blocks as `external` reservations. */
  reconcileExternalReservations(
    propertyId: string,
    source: BlockSource,
  ): Promise<{ created: number; updated: number; cancelled: number }>;

  // --- Calendar sync bookkeeping (telemetry only) -----------------
  getSyncRows(propertyId?: string): Promise<CalendarSyncRow[]>;
  /** Records the outcome of a sync run. Never writes the feed URL — that is
   *  owned exclusively by setImportFeedUrl (`channel_feeds`). */
  recordSyncRun(
    propertyId: string,
    channel: string,
    direction: "import" | "export",
    result: { status: string; error?: string | null; eventsImported?: number },
  ): Promise<void>;

  // --- Durable jobs / transactional outbox (issue #76) -------------
  /**
   * Persist an intention to do async work. When `idempotencyKey` is set and a
   * non-cancelled job already exists for it, the existing job is returned and
   * nothing new is inserted — so enqueuing twice (a retried request, two
   * workers) is safe.
   */
  enqueueJob(input: EnqueueJobInput): Promise<Job>;
  /**
   * Atomically lease up to `batch` due jobs for `worker`: status becomes
   * `running`, `attempts` is incremented, a lease of `leaseSeconds` is taken.
   * Only `queued`/`retrying` jobs with `run_after <= now`, plus `running` jobs
   * whose lease has elapsed (crash recovery), are eligible.
   */
  claimJobs(worker: string, batch: number, leaseSeconds: number): Promise<Job[]>;
  /** Apply the state transition computed by `decideNext` / `decideOrphan`. */
  settleJob(id: string, settlement: JobSettlement): Promise<void>;
  listJobs(filter?: JobFilter): Promise<Job[]>;
  getJob(id: string): Promise<Job | null>;
  /** Admin: send a `dead_letter` (or `retrying`) job back to `queued`, run now. */
  retryJob(id: string): Promise<Job>;
  /** Admin: stop a job that has not finished. */
  cancelJob(id: string): Promise<Job>;

  // --- Guest communications lifecycle (issue #69) -----------------
  /**
   * Reconcile the scheduled messages for a reservation to `desired`: upsert by
   * kind (moving the `send_at` of a still-`planned` row), and retire any
   * `planned` row whose kind is no longer desired. Rows already sent/queued are
   * left alone.
   */
  syncReservationMessages(reservationId: string, desired: DesiredMessage[]): Promise<void>;
  /** Retire every still-`planned` message for a reservation (on cancellation). */
  cancelReservationMessages(reservationId: string): Promise<void>;
  listScheduledMessages(filter?: CommsFilter): Promise<ScheduledMessage[]>;
  listReservationMessages(reservationId: string): Promise<ScheduledMessage[]>;
  /** `planned` messages whose `send_at` has passed. */
  dueScheduledMessages(nowIso: string, limit: number): Promise<ScheduledMessage[]>;
  markScheduledMessage(
    id: string,
    patch: {
      status: ScheduledMessageStatus;
      attempts?: number;
      sendAt?: string;
      sentAt?: string | null;
      lastError?: string | null;
      providerId?: string | null;
    },
  ): Promise<void>;
  /** Admin manual resend: back to `planned`, `send_at` now. */
  resetScheduledMessage(id: string): Promise<ScheduledMessage>;

  // --- Admin users / RBAC (issue #65) ----------------------------
  listAdminUsers(): Promise<AdminUser[]>;
  getAdminUserById(id: string): Promise<AdminUser | null>;
  getAdminUserByEmail(email: string): Promise<AdminUser | null>;
  /** Create an operator. When `inviteTokenHash` is given the row is "pending". */
  createAdminUser(
    input: AdminUserInput & {
      id?: string;
      inviteTokenHash?: string | null;
      inviteExpiresAt?: string | null;
    },
  ): Promise<AdminUser>;
  updateAdminUser(
    id: string,
    patch: Partial<Pick<AdminUser, "role" | "active" | "fullName" | "mfaRequired">>,
  ): Promise<AdminUser>;
  /** Bump `sessionsValidFrom` to now — revokes every existing session. */
  revokeAdminUserSessions(id: string): Promise<void>;
  /** Consume a pending invite: clears the token, activates the row. */
  acceptAdminInvite(id: string): Promise<AdminUser>;
  deleteAdminUser(id: string): Promise<void>;
  /** Best-effort last-seen touch; never throws on the hot path. */
  touchAdminUser(id: string): Promise<void>;
}
