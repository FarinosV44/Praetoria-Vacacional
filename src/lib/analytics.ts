/**
 * Thin analytics wrapper (issue #19). Sends GA4 events when configured, no-ops
 * otherwise. NEVER pass PII (names, emails, phone) — only property/date/step.
 */
type EventName =
  | "search_availability"
  | "select_property"
  | "select_dates"
  | "begin_checkout"
  | "payment_started"
  | "reservation_confirmed"
  | "reservation_failed"
  | "coupon_applied"
  | "coupon_rejected"
  | "coupon_field_open"
  | "checkout_step"
  | "checkout_abandoned"
  | "contact_click";

type Params = Record<string, string | number | boolean | undefined>;

const PII_KEYS = /name|email|phone|dni|tel|address/i;

export function track(event: EventName, params: Params = {}): void {
  const safe: Params = {};
  for (const [k, v] of Object.entries(params)) if (!PII_KEYS.test(k)) safe[k] = v;

  if (typeof window !== "undefined") {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("event", event, safe);
  }
}
