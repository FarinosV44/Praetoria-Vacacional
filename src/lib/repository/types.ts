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

export interface CreateHoldInput {
  propertyId: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  totalCents: number;
  currency: "EUR";
  priceBreakdown: unknown;
  holdMinutes: number;
  idempotencyKey: string;
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

  // --- Email log (issue #42) ---------------------------------------
  logEmail(entry: EmailLogEntry): Promise<void>;
  listEmailLog(limit?: number): Promise<EmailLogRow[]>;

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
