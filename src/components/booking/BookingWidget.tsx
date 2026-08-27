"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney, nightsLabel } from "@/lib/format";
import { track } from "@/lib/analytics";

interface QuoteResponse {
  available: boolean;
  reason: string | null;
  quote: {
    nights: number;
    minNights: number;
    nightlySubtotalCents: number;
    cleaningFeeCents: number;
    extraGuestFeeCents: number;
    taxCents: number;
    totalCents: number;
    lengthOfStayDiscount: { label: string; amountCents: number } | null;
    valid: boolean;
  } | null;
}

function todayPlus(d: number) {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export function BookingWidget({
  propertySlug,
  maxGuests,
  initial,
}: {
  propertySlug: string;
  maxGuests: number;
  initial?: { checkIn?: string; checkOut?: string; guests?: number };
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? todayPlus(14));
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? todayPlus(17));
  const [guests, setGuests] = useState(initial?.guests ?? 2);
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (checkIn >= checkOut) {
      setData(null);
      setError("La salida debe ser posterior a la entrada.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ property: propertySlug, checkIn, checkOut, guests }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo calcular el precio.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Problema de conexión.");
    } finally {
      setLoading(false);
    }
  }, [propertySlug, checkIn, checkOut, guests]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 250);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  function reserve() {
    track("begin_checkout", { property_slug: propertySlug, nights: data?.quote?.nights ?? 0 });
    const q = new URLSearchParams({ checkIn, checkOut, guests: String(guests) }).toString();
    router.push(`/reservar/${propertySlug}?${q}`);
  }

  const q = data?.quote;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="font-display text-lg">Consulta tus fechas</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Entrada</span>
          <input
            type="date"
            value={checkIn}
            min={todayPlus(0)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-line)] px-3 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Salida</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-line)] px-3 text-base"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Huéspedes</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="h-12 w-full rounded-xl border border-[var(--color-line)] px-3 text-base"
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "huésped" : "huéspedes"}
            </option>
          ))}
        </select>
      </label>

      <div aria-live="polite" className="mt-4 min-h-[3rem] text-sm">
        {loading && <p className="text-[var(--color-ink-soft)]">Comprobando disponibilidad…</p>}
        {error && !loading && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && !data.available && (
          <p className="text-[var(--color-ink-soft)]">
            {data.reason ?? "No disponible para estas fechas."}
            {q && q.minNights > q.nights ? ` La estancia mínima es de ${q.minNights} noches.` : ""}
          </p>
        )}
        {!loading && !error && data?.available && q && (
          <dl className="space-y-1">
            <Row label={`Alojamiento · ${nightsLabel(q.nights)}`} value={formatMoney(q.nightlySubtotalCents)} />
            {q.lengthOfStayDiscount && (
              <Row
                label={q.lengthOfStayDiscount.label}
                value={`− ${formatMoney(q.lengthOfStayDiscount.amountCents)}`}
              />
            )}
            {q.extraGuestFeeCents > 0 && (
              <Row label="Huéspedes adicionales" value={formatMoney(q.extraGuestFeeCents)} />
            )}
            <Row label="Limpieza" value={formatMoney(q.cleaningFeeCents)} />
            {q.taxCents > 0 && <Row label="Impuestos" value={formatMoney(q.taxCents)} />}
            <div className="mt-2 flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(q.totalCents)}</dd>
            </div>
          </dl>
        )}
      </div>

      <Button
        size="lg"
        className="mt-3 w-full"
        disabled={!data?.available || loading}
        onClick={reserve}
      >
        Reservar
      </Button>
      <p className="mt-2 text-center text-xs text-[var(--color-ink-soft)]">
        No se cobra nada hasta el último paso. Precio total, sin comisiones ocultas.
      </p>
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
