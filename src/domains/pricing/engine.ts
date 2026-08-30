import {
  addDays,
  compareIso,
  isWeekendNight,
  nightsBetween,
  nightsOf,
  todayIso,
  type IsoDate,
} from "@/lib/dates";
import type {
  NightBreakdown,
  Quote,
  QuoteRequest,
  QuoteViolation,
  RateConfig,
  Season,
} from "./types";
import { feesTotalCents, quoteFees, taxableFeesCents } from "./fees";

/**
 * Server-side price engine (issue #8).
 *
 * Pure function of (RateConfig, QuoteRequest). No I/O. The browser never sends a
 * price — it sends dates + guests and the server calls `buildQuote`. Checkout and
 * the Stripe webhook re-run this and compare before charging / confirming.
 */

const mmdd = (iso: IsoDate) => iso.slice(5); // "MM-DD"

/** Does an "MM-DD" fall within a season whose window may wrap the year end? */
export function seasonCovers(season: Season, iso: IsoDate): boolean {
  const day = mmdd(iso);
  if (season.start <= season.end) {
    return day >= season.start && day <= season.end;
  }
  // Wrapping season, e.g. 12-01 .. 03-31
  return day >= season.start || day <= season.end;
}

function seasonForNight(config: RateConfig, iso: IsoDate): Season | null {
  return config.seasons.find((s) => seasonCovers(s, iso)) ?? null;
}

function dayRateFor(config: RateConfig, iso: IsoDate) {
  return config.dayRates?.find((d) => d.date === iso);
}

function nightlyRate(config: RateConfig, iso: IsoDate): NightBreakdown {
  const weekend = isWeekendNight(iso);
  const override = dayRateFor(config, iso);
  if (override?.nightlyCents != null) {
    return { date: iso, cents: override.nightlyCents, seasonKey: "override", weekend };
  }
  const season = seasonForNight(config, iso);
  let cents: number;
  if (season) {
    cents = weekend ? (season.weekendNightlyCents ?? season.nightlyCents) : season.nightlyCents;
  } else {
    cents = weekend ? (config.weekendNightlyCents ?? config.baseNightlyCents) : config.baseNightlyCents;
  }
  return { date: iso, cents, seasonKey: season?.key ?? null, weekend };
}

/** The nightly price for a single date, overrides included. Used by the admin calendar. */
export function nightlyRateCents(config: RateConfig, iso: IsoDate): number {
  return nightlyRate(config, iso).cents;
}

/** Minimum nights that applies to a stay: the max minNights across its nights. */
export function effectiveMinNights(config: RateConfig, checkIn: IsoDate, checkOut: IsoDate): number {
  let min = config.minNights;
  for (const night of nightsOf(checkIn, checkOut)) {
    const season = seasonForNight(config, night);
    if (season?.minNights && season.minNights > min) min = season.minNights;
    const override = dayRateFor(config, night);
    if (override?.minNights && override.minNights > min) min = override.minNights;
  }
  return min;
}

function roundCents(n: number): number {
  return Math.round(n);
}

export function buildQuote(
  config: RateConfig,
  req: QuoteRequest,
  now: IsoDate = todayIso(),
  opts: { skipMinNights?: boolean } = {},
): Quote {
  const violations: QuoteViolation[] = [];
  const rangeValid =
    /^\d{4}-\d{2}-\d{2}$/.test(req.checkIn) &&
    /^\d{4}-\d{2}-\d{2}$/.test(req.checkOut) &&
    compareIso(req.checkIn, req.checkOut) < 0;

  const nights = rangeValid ? nightsBetween(req.checkIn, req.checkOut) : 0;

  if (!rangeValid) violations.push({ code: "invalid_range" });
  if (req.guests < 1) violations.push({ code: "min_guests" });
  if (req.guests > config.maxGuests)
    violations.push({ code: "max_guests", allowed: config.maxGuests, got: req.guests });

  const perNight: NightBreakdown[] = rangeValid
    ? nightsOf(req.checkIn, req.checkOut).map((iso) => nightlyRate(config, iso))
    : [];

  const nightlySubtotalCents = perNight.reduce((sum, n) => sum + n.cents, 0);

  const minNights = rangeValid ? effectiveMinNights(config, req.checkIn, req.checkOut) : config.minNights;
  if (rangeValid && nights < minNights && !opts.skipMinNights)
    violations.push({ code: "min_nights", required: minNights, got: nights });

  if (rangeValid && config.maxNights > 0 && nights > config.maxNights)
    violations.push({ code: "max_nights", allowed: config.maxNights, got: nights });

  if (rangeValid) {
    const leadOk = compareIso(req.checkIn, addDays(now, config.leadTimeDays)) >= 0;
    if (!leadOk) violations.push({ code: "lead_time", requiredDays: config.leadTimeDays });
    if (config.bookingWindowDays > 0) {
      const lastBookable = addDays(now, config.bookingWindowDays);
      if (compareIso(req.checkIn, lastBookable) > 0)
        violations.push({ code: "booking_window", allowedDays: config.bookingWindowDays });
    }
  }

  // Length-of-stay discount: best matching tier.
  const tier =
    [...config.discounts]
      .filter((d) => nights >= d.minNights)
      .sort((a, b) => b.percent - a.percent)[0] ?? null;
  const losDiscountCents = tier ? roundCents((nightlySubtotalCents * tier.percent) / 100) : 0;
  const lengthOfStayDiscount = tier
    ? { label: tier.label, percent: tier.percent, amountCents: losDiscountCents }
    : null;

  const extraGuests = Math.max(0, Math.min(req.guests, config.maxGuests) - config.includedGuests);
  const extraGuestFeeCents = extraGuests * config.extraGuestNightlyCents * nights;

  // Optional per-stay charges (issue #58) — only the enabled, non-zero ones.
  const fees = quoteFees(config);
  const feesCents = feesTotalCents(config);

  const taxableBase = nightlySubtotalCents - losDiscountCents + extraGuestFeeCents;
  const taxCents =
    config.taxPercent > 0
      ? roundCents(((taxableBase + taxableFeesCents(config)) * config.taxPercent) / 100)
      : 0;

  const totalCents = taxableBase + feesCents + taxCents;

  return {
    propertySlug: config.propertySlug,
    currency: config.currency,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    guests: req.guests,
    nights,
    perNight,
    nightlySubtotalCents,
    lengthOfStayDiscount,
    extraGuestFeeCents,
    fees,
    feesCents,
    taxCents,
    totalCents: rangeValid ? totalCents : 0,
    minNights,
    valid: violations.length === 0,
    violations,
  };
}

/** Human-readable, locale-ready reasons for a rejected quote. */
export function describeViolation(v: QuoteViolation): string {
  switch (v.code) {
    case "min_nights":
      return `La estancia mínima para estas fechas es de ${v.required} noches.`;
    case "max_nights":
      return `La estancia máxima para reserva directa es de ${v.allowed} noches.`;
    case "max_guests":
      return `El alojamiento admite un máximo de ${v.allowed} huéspedes.`;
    case "min_guests":
      return "Indica al menos 1 huésped.";
    case "invalid_range":
      return "Selecciona una fecha de salida posterior a la de entrada.";
    case "lead_time":
      return `Las reservas requieren al menos ${v.requiredDays} día(s) de antelación.`;
    case "booking_window":
      return `Por ahora solo se aceptan reservas con hasta ${v.allowedDays} días de antelación.`;
    case "unknown_property":
      return "Alojamiento no encontrado.";
  }
}
