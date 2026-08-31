"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatRange, guestsLabel, nightsLabel } from "@/lib/format";
import { track } from "@/lib/analytics";
import { getCheckoutStrings } from "@/i18n/checkout";
import { localizedPath, type Locale } from "@/i18n/config";
import { CouponField, type CouponState } from "@/components/booking/CouponField";
import { DirectBookingSaving } from "@/components/booking/DirectBooking";
import { RatingBadge } from "@/components/property/RatingBadge";
import { feeLabel } from "@/domains/pricing/fees";
import { useRouter, usePathname } from "next/navigation";

interface QuoteData {
  nights: number;
  nightlySubtotalCents: number;
  fees: { key: string; label: string; amountCents: number; description?: string }[];
  extraGuestFeeCents: number;
  taxCents: number;
  totalCents: number;
  lengthOfStayDiscount: { label: string; amountCents: number } | null;
  coupon: CouponState | null;
}

interface Props {
  propertySlug: string;
  propertyName: string;
  experience: "ski" | "sea";
  checkIn: string;
  checkOut: string;
  guests: number;
  quote: QuoteData;
  cancellationSummary: string;
  locale?: Locale;
  paymentsConfigured?: boolean;
  rating?: { value: number; count: number; source: "booking" } | null;
}

type Step = 1 | 2 | 3;

function useIdempotencyKey(seed: string): string {
  return useMemo(() => {
    const storageKey = `pv:idem:${seed}`;
    try {
      const existing = sessionStorage.getItem(storageKey);
      if (existing) return existing;
      const fresh = crypto.randomUUID();
      sessionStorage.setItem(storageKey, fresh);
      return fresh;
    } catch {
      return crypto.randomUUID();
    }
  }, [seed]);
}

export function CheckoutFlow(props: Props) {
  const { propertySlug, propertyName, checkIn, checkOut, guests, quote } = props;
  const locale = props.locale ?? "es";
  const t = getCheckoutStrings(locale);
  const path = (n: string) => localizedPath(locale, n);
  const router = useRouter();
  const pathname = usePathname();

  /** Re-runs the server quote with (or without) a coupon by updating the URL. */
  function setCouponInUrl(codeValue: string) {
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    if (codeValue) params.set("coupon", codeValue.toUpperCase());
    router.replace(`${pathname}?${params.toString()}`);
  }

  const [step, setStep] = useState<Step>(1);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accept, setAccept] = useState(false);

  const idempotencyKey = useIdempotencyKey(`${propertySlug}|${checkIn}|${checkOut}|${guests}`);

  useEffect(() => {
    track("select_dates", { property_slug: propertySlug, nights: quote.nights });
  }, [propertySlug, quote.nights]);

  // Per-step funnel events (issue #49).
  useEffect(() => {
    track("checkout_step", { property_slug: propertySlug, step, nights: quote.nights });
  }, [step, propertySlug, quote.nights]);

  // Abandoned-checkout signal: left before reaching payment and not confirmed.
  const paidRef = useRef(false);
  const stepRef = useRef<Step>(step);
  stepRef.current = step;
  useEffect(() => {
    function onHide() {
      if (document.visibilityState !== "hidden") return;
      if (paidRef.current || stepRef.current >= 3) return;
      track("checkout_abandoned", { property_slug: propertySlug, step: stepRef.current });
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [propertySlug]);

  async function createHold() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          property: propertySlug,
          checkIn,
          checkOut,
          guests,
          coupon: quote.coupon?.applied ? quote.coupon.code : undefined,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.reviewData);
        return false;
      }
      setReservationId(data.reservationId);
      setCode(data.code);
      return true;
    } catch {
      setError(t.connError);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function goToDetails() {
    const ok = reservationId ? true : await createHold();
    if (ok) setStep(2);
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!reservationId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/guest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId,
          fullName,
          email,
          phone: phone || undefined,
          acceptTerms: accept,
          notes: undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.fields ? Object.values(data.fields).flat().join(" · ") : (data.error ?? t.reviewData),
        );
        return;
      }
      setStep(3);
    } catch {
      setError(t.connError);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!reservationId) return;
    setBusy(true);
    setError(null);
    paidRef.current = true;
    track("payment_started", { property_slug: propertySlug });
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reservationId, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.connError);
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t.connError);
      setBusy(false);
    }
  }

  const q = quote;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]" lang={locale === "en" ? "en" : undefined}>
      <div>
        <ol className="mb-6 flex items-center gap-2 text-sm">
          {t.steps.map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[var(--accent-600)] text-white"
                      : done
                        ? "bg-[var(--accent-100)] text-[var(--accent-800)]"
                        : "bg-[var(--color-mist)] text-[var(--color-ink-faint)]"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span className={active ? "font-medium" : "text-[var(--color-ink-soft)]"}>{label}</span>
                {i < 2 && (
                  <span aria-hidden className="text-[var(--color-line)]">
                    —
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {error && (
          <p role="alert" className="pv-note pv-note--error mb-4">
            {error}
            {error.includes(t.datesGone) && (
              <>
                {" "}
                <Link href={path(`/${propertySlug}`)} className="underline">
                  {t.chooseOther}
                </Link>
              </>
            )}
          </p>
        )}

        {step === 1 && (
          <section className="pv-card pv-card--soft pv-card--pad">
            <h2 className="font-display text-xl">{t.confirmGetaway}</h2>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              {propertyName} · {formatRange(checkIn, checkOut)} · {nightsLabel(quote.nights)} ·{" "}
              {guestsLabel(guests)}
            </p>
            <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
              {t.needChange}{" "}
              <Link href={path(`/${propertySlug}`)} className="underline">
                {t.backToProperty}
              </Link>
            </p>
            <CouponField
              value={quote.coupon?.code ?? ""}
              status={quote.coupon}
              onChange={setCouponInUrl}
              locale={locale}
              propertySlug={propertySlug}
            />
            <Button block className="mt-5" disabled={busy} onClick={goToDetails}>
              {busy ? t.oneMoment : t.continue}
            </Button>
          </section>
        )}

        {step === 2 && (
          <form
            onSubmit={submitDetails}
            className="pv-card pv-card--soft pv-card--pad"
          >
            <h2 className="font-display text-xl">{t.yourDetails}</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{t.noAccount}</p>
            <div className="mt-4 space-y-3">
              <Field label={t.fullName} value={fullName} onChange={setFullName} required autoComplete="name" />
              <Field
                label={t.email}
                type="email"
                value={email}
                onChange={setEmail}
                required
                autoComplete="email"
              />
              <Field
                label={t.phoneOptional}
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accept}
                  onChange={(e) => setAccept(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span>
                  {t.acceptPre}
                  <Link href={path("/legal/condiciones-reserva")} target="_blank" className="underline">
                    {t.bookingTerms}
                  </Link>
                  {t.and}
                  <Link href={path("/legal/privacidad")} target="_blank" className="underline">
                    {t.privacy}
                  </Link>
                  .
                </span>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                {t.back}
              </Button>
              <Button type="submit" className="flex-1" disabled={busy || !accept}>
                {busy ? t.saving : t.toPayment}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <section className="pv-card pv-card--soft pv-card--pad">
            <h2 className="font-display text-xl">{t.securePayment}</h2>
            {props.paymentsConfigured === false && (
              <p className="pv-note pv-note--warn mt-2">
                {locale === "en"
                  ? "Card payments are not enabled yet. This step runs in demo mode and no charge is made."
                  : "Los pagos con tarjeta aún no están activos. Este paso funciona en modo demostración y no se realiza ningún cobro."}
              </p>
            )}
            <p className="mt-2 text-[var(--color-ink-soft)]">{t.secureBlurb}</p>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{props.cancellationSummary}</p>
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                {t.back}
              </Button>
              <Button className="flex-1" disabled={busy} onClick={pay}>
                {busy ? t.redirecting : t.pay(formatMoney(quote.totalCents))}
              </Button>
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="pv-card pv-card--soft pv-card--pad">
          <p className="font-display text-lg">{propertyName}</p>
          {props.rating && (
            <div className="mt-1">
              <RatingBadge rating={props.rating} locale={locale} size="xs" />
            </div>
          )}
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {formatRange(checkIn, checkOut)} · {nightsLabel(quote.nights)} · {guestsLabel(guests)}
          </p>
          {code && (
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
              {t.provisionalRef}: {code}
            </p>
          )}
          <dl className="mt-4 space-y-1 text-sm">
            <Line label={t.accommodationN(nightsLabel(q.nights))} value={formatMoney(q.nightlySubtotalCents)} />
            {q.lengthOfStayDiscount && (
              <Line
                label={q.lengthOfStayDiscount.label}
                value={`− ${formatMoney(q.lengthOfStayDiscount.amountCents)}`}
              />
            )}
            {q.extraGuestFeeCents > 0 && (
              <Line label={t.extraGuests} value={formatMoney(q.extraGuestFeeCents)} />
            )}
            {q.fees.map((f) => (
              <Line key={f.key} label={feeLabel(f, locale === "en" ? "en" : "es")} value={formatMoney(f.amountCents)} />
            ))}
            {q.taxCents > 0 && <Line label={t.taxes} value={formatMoney(q.taxCents)} />}
            {q.coupon?.applied && (
              <Line
                label={`${locale === "en" ? "Discount" : "Descuento"} · ${q.coupon.code}`}
                value={`− ${formatMoney(q.coupon.discountCents)}`}
              />
            )}
          </dl>
          <div className="mt-3 flex justify-between border-t border-[var(--color-line)] pt-3 font-semibold">
            <span>{t.total}</span>
            <span>{formatMoney(q.totalCents)}</span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{t.finalPrice}</p>
          {!q.coupon?.applied && (
            <div className="mt-3">
              <DirectBookingSaving totalCents={q.totalCents} locale={locale} />
            </div>
          )}
          <ul className="mt-3 space-y-1.5 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-ink-soft)]">
            <li className="flex gap-2">
              <span aria-hidden className="text-[var(--accent-600)]">
                🔒
              </span>
              {locale === "en" ? "Secure card payment via Stripe" : "Pago seguro con tarjeta vía Stripe"}
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-[var(--accent-600)]">
                ↩
              </span>
              {props.cancellationSummary}
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--color-ink-soft)]">
      <dt>{label}</dt>
      <dd className="text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="pv-label">{label}</span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pv-input"
      />
    </label>
  );
}
