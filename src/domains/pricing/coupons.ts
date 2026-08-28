import { compareIso, type IsoDate } from "@/lib/dates";

/** A discount code as stored/edited (issue #45). Amounts in EUR cents. */
export interface Coupon {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  propertySlug: string | null;
  startsOn: IsoDate | null;
  endsOn: IsoDate | null;
  minNights: number;
  minTotalCents: number;
  maxUses: number | null;
  usesCount: number;
  maxUsesPerEmail: number | null;
  autoApply: boolean;
  active: boolean;
  description: string | null;
}

export type CouponRejection =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted"
  | "wrong_property"
  | "min_nights"
  | "min_total"
  | "per_email_limit";

export interface CouponCheck {
  ok: boolean;
  rejection?: CouponRejection;
  discountCents: number;
  /** Public label, e.g. "Código VERANO25 · −15 %". Safe to show the guest. */
  label: string;
}

export interface CouponContext {
  propertySlug: string;
  nights: number;
  /** Total BEFORE the coupon (nightly + fees + tax − LOS discount). */
  baseTotalCents: number;
  now: IsoDate;
  /** Uses already made by this email, if known. */
  emailUses?: number;
}

function discountFor(coupon: Coupon, baseTotalCents: number): number {
  const raw =
    coupon.kind === "percent"
      ? Math.round((baseTotalCents * coupon.value) / 100)
      : coupon.value;
  // Never below zero, never more than the base total.
  return Math.max(0, Math.min(raw, baseTotalCents));
}

export function couponLabel(coupon: Coupon, discountCents: number): string {
  const amount =
    coupon.kind === "percent"
      ? `−${coupon.value} %`
      : `−${(discountCents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`;
  return `Código ${coupon.code} · ${amount}`;
}

/**
 * Pure validation. Returns the discount that WOULD apply and whether it's valid.
 * Internal reasons are mapped to a small enum; the caller decides what to show.
 */
export function checkCoupon(coupon: Coupon | null, ctx: CouponContext): CouponCheck {
  if (!coupon) return { ok: false, rejection: "not_found", discountCents: 0, label: "" };

  const fail = (rejection: CouponRejection): CouponCheck => ({
    ok: false,
    rejection,
    discountCents: 0,
    label: "",
  });

  if (!coupon.active) return fail("inactive");
  if (coupon.startsOn && compareIso(ctx.now, coupon.startsOn) < 0) return fail("not_started");
  if (coupon.endsOn && compareIso(ctx.now, coupon.endsOn) > 0) return fail("expired");
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) return fail("exhausted");
  if (coupon.propertySlug && coupon.propertySlug !== ctx.propertySlug) return fail("wrong_property");
  if (ctx.nights < coupon.minNights) return fail("min_nights");
  if (ctx.baseTotalCents < coupon.minTotalCents) return fail("min_total");
  if (
    coupon.maxUsesPerEmail !== null &&
    ctx.emailUses !== undefined &&
    ctx.emailUses >= coupon.maxUsesPerEmail
  ) {
    return fail("per_email_limit");
  }

  const discountCents = discountFor(coupon, ctx.baseTotalCents);
  return { ok: true, discountCents, label: couponLabel(coupon, discountCents) };
}

/** Non-revealing guest messages (issue #45: "nunca revelar reglas internas innecesarias"). */
export function describeRejection(rejection: CouponRejection, locale: "es" | "en" = "es"): string {
  const es: Record<CouponRejection, string> = {
    not_found: "Este código no es válido.",
    inactive: "Este código no es válido.",
    not_started: "Este código todavía no está activo.",
    expired: "Este código ha caducado.",
    exhausted: "Este código ya no está disponible.",
    wrong_property: "Este código no se puede aplicar a este alojamiento.",
    min_nights: "Este código requiere una estancia más larga.",
    min_total: "Este código no se aplica a este importe.",
    per_email_limit: "Ya has utilizado este código.",
  };
  const en: Record<CouponRejection, string> = {
    not_found: "This code isn't valid.",
    inactive: "This code isn't valid.",
    not_started: "This code isn't active yet.",
    expired: "This code has expired.",
    exhausted: "This code is no longer available.",
    wrong_property: "This code can't be applied to this property.",
    min_nights: "This code needs a longer stay.",
    min_total: "This code doesn't apply to this amount.",
    per_email_limit: "You've already used this code.",
  };
  return (locale === "en" ? en : es)[rejection];
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Issue #54 — the live promotional code. 10% off, both properties, no expiry,
 * no usage limit, active. The production DB gets it via the migration
 * `supabase/migrations/20260828120000_coupon_10praetoria10.sql`; DEMO mode seeds
 * this same object (see the memory repository) so both agree.
 */
export const PRAETORIA10_CODE = "10PRAETORIA10";

export const PRAETORIA10_COUPON: Omit<Coupon, "id"> = {
  code: PRAETORIA10_CODE,
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
  description: "Promoción 10PRAETORIA10 · 10% de descuento (todos los alojamientos)",
};
