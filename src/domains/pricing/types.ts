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

/** Per-date override of the nightly price and/or minimum stay (issue #56 §5). */
export interface DayRate {
  date: IsoDate;
  nightlyCents?: number;
  minNights?: number;
}

/**
 * An optional per-stay charge (issue #58). It is shown to the guest and added
 * to the total ONLY when `enabled` is true and `amountCents > 0` — a disabled
 * charge does not exist for the guest: no line, no "0 €", nothing in emails,
 * invoices or Stripe. Configured per property from the admin panel.
 */
export interface StayFee {
  /** Stable identifier, e.g. "cleaning". Never shown to the guest. */
  key: string;
  /** Guest-facing name, e.g. "Limpieza". */
  label: string;
  enabled: boolean;
  amountCents: number;
  /** Optional guest-visible note. */
  description?: string;
  /** Whether `taxPercent` applies to this charge. Default: no. */
  taxable?: boolean;
}

/** A charge that was actually applied to a quote (already filtered + priced). */
export interface QuoteFee {
  key: string;
  label: string;
  amountCents: number;
  description?: string;
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
  /**
   * @deprecated Legacy single cleaning fee. Kept for stored configs that predate
   * `fees`. When `fees` is absent and this is > 0 it is treated as one enabled
   * "cleaning" charge; when `fees` is present this is ignored. New configs set
   * it to 0 and use `fees`.
   */
  cleaningFeeCents: number;
  /**
   * Optional per-stay charges (issue #58). Each is shown and billed only when
   * `enabled` and `amountCents > 0`. Independent per property, editable from the
   * admin panel. Absent → fall back to `cleaningFeeCents` (legacy).
   */
  fees?: StayFee[];
  /** Guests included in the nightly rate; extras add a per-night surcharge. */
  includedGuests: number;
  extraGuestNightlyCents: number;
  /** Hard capacity — quotes above this are invalid. */
  maxGuests: number;
  seasons: Season[];
  discounts: LengthOfStayDiscount[];
  /**
   * Admin per-date overrides (issue #56 §5). Highest priority: a matching
   * `nightlyCents` wins over season/weekend/base; `minNights` raises the
   * effective minimum stay for that night. Not persisted in the file default —
   * merged in by `resolveRateConfig` from the `daily_rates` table.
   */
  dayRates?: DayRate[];
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
  /** Optional per-stay charges that were actually applied (issue #58). Empty = none. */
  fees: QuoteFee[];
  /** Sum of `fees[].amountCents`. */
  feesCents: number;
  taxCents: number;
  /** What the guest pays. */
  totalCents: number;
  /** Minimum nights that applied to these dates. */
  minNights: number;
  valid: boolean;
  violations: QuoteViolation[];
}
