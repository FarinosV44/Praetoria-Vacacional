import type { IsoDate } from "@/lib/dates";

/** A recurring season defined by month-day boundaries; may wrap the year end. */
export interface Season {
  key: string;
  label: string;
  /** "MM-DD" inclusive start. */
  start: string;
  /** "MM-DD" inclusive end. May be < start to mean "wraps past 31 Dec". */
  end: string;
  nightlyCents: number;
  /** Optional weekend (Fri/Sat night) override within the season. */
  weekendNightlyCents?: number;
  /** Optional minimum-stay override within the season. */
  minNights?: number;
}

/** Length-of-stay discount: stays of >= minNights get `percent` off the nightly subtotal. */
export interface LengthOfStayDiscount {
  minNights: number;
  percent: number;
  label: string;
}

export interface RateConfig {
  propertySlug: string;
  currency: "EUR";
  /** Fallback nightly rate when no season matches. */
  baseNightlyCents: number;
  /** Fallback weekend (Fri/Sat) nightly rate. Defaults to baseNightlyCents. */
  weekendNightlyCents?: number;
  /** Default minimum nights when no season overrides it. */
  minNights: number;
  /** Maximum nights a single direct booking may span (0 = unlimited). */
  maxNights: number;
  /** One-off cleaning fee per stay. */
  cleaningFeeCents: number;
  /** Guests included in the nightly rate; extras add a per-night surcharge. */
  includedGuests: number;
  extraGuestNightlyCents: number;
  /** Hard capacity — quotes above this are invalid. */
  maxGuests: number;
  seasons: Season[];
  discounts: LengthOfStayDiscount[];
  /** Tourist tax etc., applied to the nightly subtotal after discounts. 0 = none. */
  taxPercent: number;
  /** How far ahead bookings are accepted, in days (0 = unlimited). */
  bookingWindowDays: number;
  /** Minimum days between "now" and check-in. */
  leadTimeDays: number;
}

export interface QuoteRequest {
  propertySlug: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
}

export interface NightBreakdown {
  date: IsoDate;
  cents: number;
  seasonKey: string | null;
  weekend: boolean;
}

export type QuoteViolation =
  | { code: "min_nights"; required: number; got: number }
  | { code: "max_nights"; allowed: number; got: number }
  | { code: "max_guests"; allowed: number; got: number }
  | { code: "min_guests" }
  | { code: "invalid_range" }
  | { code: "lead_time"; requiredDays: number }
  | { code: "booking_window"; allowedDays: number }
  | { code: "unknown_property" };

export interface Quote {
  propertySlug: string;
  currency: "EUR";
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  nights: number;
  perNight: NightBreakdown[];
  /** Sum of per-night rates before any discount. */
  nightlySubtotalCents: number;
  lengthOfStayDiscount: { label: string; percent: number; amountCents: number } | null;
  extraGuestFeeCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  /** What the guest pays. */
  totalCents: number;
  /** Minimum nights that applied to these dates. */
  minNights: number;
  valid: boolean;
  violations: QuoteViolation[];
}
