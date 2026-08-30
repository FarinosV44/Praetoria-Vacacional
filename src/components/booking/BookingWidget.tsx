"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatRange, nightsLabel } from "@/lib/format";
import { track } from "@/lib/analytics";
import { localizedPath, type Locale } from "@/i18n/config";
import { AvailabilityCalendar, type RangeSelection } from "./AvailabilityCalendar";
import { CouponField, type CouponState } from "./CouponField";
import { feeLabel } from "@/domains/pricing/fees";

const WIDGET_STR = {
  es: {
    heading: "Consulta tus fechas",
    pickDates: "Elige tus fechas en el calendario",
    pickCheckout: (d: string) => `Entrada ${d} · elige la salida`,
    guests: "Huéspedes",
    guest: "huésped",
    guestsPl: "huéspedes",
    checking: "Comprobando disponibilidad…",
    checkoutAfter: "La salida debe ser posterior a la entrada.",
    connError: "Problema de conexión.",
    priceError: "No se pudo calcular el precio.",
    notAvailable: "No disponible para estas fechas.",
    minStay: (n: number) => ` La estancia mínima es de ${n} noches.`,
    accommodationN: (n: string) => `Alojamiento · ${n}`,
    extraGuests: "Huéspedes adicionales",
    cleaning: "Limpieza",
    taxes: "Impuestos",
    total: "Total",
    discount: "Descuento",
    reserve: "Reservar",
    noCharge: "No se cobra nada hasta el último paso. Precio total, sin comisiones ocultas.",
  },
  en: {
    heading: "Check your dates",
    pickDates: "Pick your dates on the calendar",
    pickCheckout: (d: string) => `Check-in ${d} · choose check-out`,
    guests: "Guests",
    guest: "guest",
    guestsPl: "guests",
    checking: "Checking availability…",
    checkoutAfter: "Check-out must be after check-in.",
    connError: "Connection problem.",
    priceError: "Could not calculate the price.",
    notAvailable: "Not available for these dates.",
    minStay: (n: number) => ` The minimum stay is ${n} nights.`,
    accommodationN: (n: string) => `Accommodation · ${n}`,
    extraGuests: "Extra guests",
    cleaning: "Cleaning",
    taxes: "Taxes",
    total: "Total",
    discount: "Discount",
    reserve: "Book",
    noCharge: "Nothing is charged until the last step. Full price, no hidden fees.",
  },
} as const;

interface QuoteResponse {
  available: boolean;
  reason: string | null;
  quote: {
    nights: number;
    minNights: number;
    nightlySubtotalCents: number;
    fees: { key: string; label: string; amountCents: number; description?: string }[];
    extraGuestFeeCents: number;
    taxCents: number;
    totalCents: number;
    subtotalBeforeCouponCents: number;
    lengthOfStayDiscount: { label: string; amountCents: number } | null;
    coupon: CouponState | null;
    valid: boolean;
  } | null;
}

export function BookingWidget({
  propertySlug,
  maxGuests,
  minNightsHint,
  initial,
  locale = "es",
}: {
  propertySlug: string;
  maxGuests: number;
  minNightsHint?: number;
  initial?: { checkIn?: string; checkOut?: string; guests?: number };
  locale?: Locale;
}) {
  const router = useRouter();
  const s = WIDGET_STR[locale];
  const [range, setRange] = useState<RangeSelection>({
    checkIn: initial?.checkIn ?? null,
    checkOut: initial?.checkOut ?? null,
  });
  const [guests, setGuests] = useState(initial?.guests ?? 2);
  const [coupon, setCoupon] = useState("");
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { checkIn, checkOut } = range;

  const fetchQuote = useCallback(async () => {
    if (!checkIn || !checkOut) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          property: propertySlug,
          checkIn,
          checkOut,
          guests,
          coupon: coupon || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? s.priceError);
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError(s.connError);
    } finally {
      setLoading(false);
    }
  }, [propertySlug, checkIn, checkOut, guests, coupon, s]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 200);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  function reserve() {
    if (!checkIn || !checkOut) return;
    track("begin_checkout", { property_slug: propertySlug, nights: data?.quote?.nights ?? 0 });
    const params: Record<string, string> = { checkIn, checkOut, guests: String(guests) };
    if (data?.quote?.coupon?.applied) params.coupon = data.quote.coupon.code;
    const q = new URLSearchParams(params).toString();
    router.push(`${localizedPath(locale, `/reservar/${propertySlug}`)}?${q}`);
  }

  const q = data?.quote;

  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]"
      lang={locale === "en" ? "en" : undefined}
    >
      <p className="font-display text-lg">{s.heading}</p>

      <div className="mt-3 rounded-xl bg-[var(--color-paper)] p-2 text-center text-sm">
        {checkIn && checkOut
          ? `${formatRange(checkIn, checkOut)}`
          : checkIn
            ? s.pickCheckout(checkIn)
            : s.pickDates}
      </div>

      <div className="mt-3">
        <AvailabilityCalendar
          propertySlug={propertySlug}
          value={range}
          onChange={setRange}
          minNightsHint={minNightsHint}
        />
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">{s.guests}</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="h-12 w-full rounded-xl border border-[var(--color-line)] px-3 text-base"
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? s.guest : s.guestsPl}
            </option>
          ))}
        </select>
      </label>

      <div aria-live="polite" className="mt-4 min-h-[3rem] text-sm">
        {loading && <p className="text-[var(--color-ink-soft)]">{s.checking}</p>}
        {error && !loading && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && !data.available && (
          <p className="text-[var(--color-ink-soft)]">
            {data.reason ?? s.notAvailable}
            {q && q.minNights > q.nights ? s.minStay(q.minNights) : ""}
          </p>
        )}
        {!loading && !error && data?.available && q && (
          <dl className="space-y-1">
            <Row label={s.accommodationN(nightsLabel(q.nights))} value={formatMoney(q.nightlySubtotalCents)} />
            {q.lengthOfStayDiscount && (
              <Row
                label={q.lengthOfStayDiscount.label}
                value={`− ${formatMoney(q.lengthOfStayDiscount.amountCents)}`}
              />
            )}
            {q.extraGuestFeeCents > 0 && (
              <Row label={s.extraGuests} value={formatMoney(q.extraGuestFeeCents)} />
            )}
            {q.fees.map((f) => (
              <Row key={f.key} label={feeLabel(f, locale)} value={formatMoney(f.amountCents)} />
            ))}
            {q.taxCents > 0 && <Row label={s.taxes} value={formatMoney(q.taxCents)} />}
            {q.coupon?.applied && (
              <Row
                label={`${s.discount} · ${q.coupon.code}`}
                value={`− ${formatMoney(q.coupon.discountCents)}`}
              />
            )}
            <div className="mt-2 flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
              <dt>{s.total}</dt>
              <dd>{formatMoney(q.totalCents)}</dd>
            </div>
          </dl>
        )}
      </div>

      {(checkIn && checkOut) && (
        <CouponField
          value={coupon}
          status={data?.quote?.coupon ?? null}
          onChange={setCoupon}
          locale={locale}
          propertySlug={propertySlug}
        />
      )}

      <Button
        size="lg"
        className="mt-3 w-full"
        disabled={!data?.available || loading}
        onClick={reserve}
      >
        {s.reserve}
      </Button>
      <p className="mt-2 text-center text-xs text-[var(--color-ink-soft)]">{s.noCharge}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--color-ink-soft)]">
      <dt>{label}</dt>
      <dd className="text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
