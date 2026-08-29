import type { IsoDate } from "@/lib/dates";

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "expired";
export type ReservationSource = "direct" | "booking" | "airbnb" | "manual" | "other";
export type BlockSource = "booking" | "airbnb" | "manual" | "other";
export type PaymentState = "pending" | "partial" | "paid" | "refunded";

export interface Reservation {
  id: string;
  propertyId: string;
  code: string;
  status: ReservationStatus;
  source: ReservationSource;
  checkIn: IsoDate;
  checkOut: IsoDate;
  nights: number;
  guests: number;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  currency: "EUR";
  totalCents: number;
  originalTotalCents: number | null;
  discountCents: number;
  couponCode: string | null;
  priceBreakdown: unknown;
  termsAcceptedAt: string | null;
  holdExpiresAt: string | null;
  externalUid: string | null;
  idempotencyKey: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // --- Intranet fields (issue #56) ------------------------------------
  customerId: string | null;
  channelDetail: string | null;
  guestDocType: string | null;
  guestDocNumber: string | null;
  guestAddress: string | null;
  guestPostalCode: string | null;
  guestCity: string | null;
  guestProvince: string | null;
  guestCountry: string | null;
  externalLocator: string | null;
  invoiceNumber: string | null;
  paymentMethod: string | null;
  paymentState: PaymentState;
}

export interface AvailabilityBlock {
  id: string;
  propertyId: string;
  startDate: IsoDate;
  endDate: IsoDate;
  source: BlockSource;
  externalUid: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A contiguous occupied span [start, end). */
export interface BusyRange {
  start: IsoDate;
  end: IsoDate;
  kind: "reservation" | "block";
}

export type DayState = "free" | "busy" | "past" | "checkout-only";

export interface CalendarDay {
  date: IsoDate;
  state: DayState;
}

export interface Payment {
  id: string;
  reservationId: string;
  provider: string;
  providerCheckoutSession: string | null;
  providerPaymentIntent: string | null;
  status: "created" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
  amountCents: number;
  currency: "EUR";
  raw: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSyncRow {
  id: string;
  propertyId: string;
  channel: string;
  direction: "import" | "export";
  feedUrl: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  eventsImported: number;
}
