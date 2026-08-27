"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatMoney, nightsLabel } from "@/lib/format";
import { track } from "@/lib/analytics";
import { localizedPath, type Locale } from "@/i18n/config";

const STR = {
  es: {
    property: "Alojamiento",
    anyProperty: "Cualquiera",
    checkIn: "Entrada",
    checkOut: "Salida",
    guests: "Huéspedes",
    submit: "Ver disponibilidad",
    checking: "Comprobando…",
    priceTotal: "precio total",
    book: "Reservar",
    seeProperty: "Ver alojamiento",
    notAvailable: "No disponible para estas fechas",
    minStay: (n: number) => ` · estancia mínima ${n} noches`,
    connError: "Problema de conexión. Inténtalo de nuevo.",
    genericError: "No se pudo comprobar la disponibilidad",
    summary: (nights: number, guests: number, nl: (n: number) => string) =>
      `${nl(nights)} · ${guests} ${guests === 1 ? "huésped" : "huéspedes"}`,
  },
  en: {
    property: "Property",
    anyProperty: "Either",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    submit: "Check availability",
    checking: "Checking…",
    priceTotal: "total price",
    book: "Book",
    seeProperty: "View property",
    notAvailable: "Not available for these dates",
    minStay: (n: number) => ` · minimum stay ${n} nights`,
    connError: "Connection problem. Please try again.",
    genericError: "Could not check availability",
    summary: (nights: number, guests: number, nl: (n: number) => string) =>
      `${nl(nights)} · ${guests} ${guests === 1 ? "guest" : "guests"}`,
  },
} as const;

const PROPERTIES = [
  { slug: "javalambre", name: "Javalambre Mountain SuperSki" },
  { slug: "valencia", name: "Valencia Frente al Mar" },
];

interface QuoteLite {
  totalCents: number;
  nights: number;
  minNights: number;
}
interface ResultRow {
  propertySlug: string;
  propertyName: string;
  experience: "ski" | "sea";
  available: boolean;
  quote: QuoteLite | null;
  reason: string | null;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AvailabilitySearch({
  compact = false,
  locale = "es",
}: {
  compact?: boolean;
  locale?: Locale;
}) {
  const t = STR[locale];
  const [property, setProperty] = useState<string>("");
  const [checkIn, setCheckIn] = useState(todayPlus(14));
  const [checkOut, setCheckOut] = useState(todayPlus(17));
  const [guests, setGuests] = useState(2);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    track("search_availability", { check_in: checkIn, check_out: checkOut, guests });
    try {
      const res = await fetch("/api/availability/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, guests }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? t.genericError);
        return;
      }
      setResults(data.results as ResultRow[]);
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage(t.connError);
    }
  }

  const shown = property ? results.filter((r) => r.propertySlug === property) : results;
  const chosen = property ? results.find((r) => r.propertySlug === property) : null;
  const alt =
    property && chosen && !chosen.available
      ? results.find((r) => r.available && r.propertySlug !== property)
      : null;

  const query = new URLSearchParams({ checkIn, checkOut, guests: String(guests) }).toString();
  const reservePath = (slug: string) => localizedPath(locale, `/reservar/${slug}`) + `?${query}`;
  const propertyPath = (slug: string) => localizedPath(locale, `/${slug}`);

  return (
    <div className={compact ? "" : "rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"}>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto] lg:items-end">
        <label className="text-sm sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">{t.property}</span>
          <select
            value={property}
            onChange={(e) => setProperty(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 text-base"
          >
            <option value="">{t.anyProperty}</option>
            {PROPERTIES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">{t.checkIn}</span>
          <input
            type="date"
            required
            value={checkIn}
            min={todayPlus(0)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">{t.checkOut}</span>
          <input
            type="date"
            required
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">{t.guests}</span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="h-12 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 text-base lg:w-24"
          >
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className="h-12 sm:col-span-2 lg:col-span-1 lg:h-12"
        >
          {status === "loading" ? t.checking : t.submit}
        </Button>
      </form>

      {(checkIn < checkOut) && (
        <p className="mt-2 text-center text-xs text-[var(--color-ink-soft)]">
          {property ? PROPERTIES.find((p) => p.slug === property)?.name : t.anyProperty} ·{" "}
          {t.summary(
            Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000),
            guests,
            nightsLabel,
          )}
        </p>
      )}

      {message && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {message}
        </p>
      )}

      {status === "loading" && (
        <ul className="mt-5 grid gap-3" aria-hidden>
          {[0, 1].map((i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-4"
            >
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-[var(--color-line)]/70 motion-reduce:animate-none" />
                <div className="h-4 w-56 animate-pulse rounded bg-[var(--color-line)]/70 motion-reduce:animate-none" />
              </div>
              <div className="h-11 w-24 animate-pulse rounded-full bg-[var(--color-line)]/70 motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
      )}

      {status === "done" && (
        <ul className="mt-5 grid gap-3">
          {shown.map((r) => (
            <li
              key={r.propertySlug}
              data-experience={r.experience}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-4"
            >
              <div>
                <p className="font-display text-lg">{r.propertyName}</p>
                {r.available && r.quote ? (
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {formatMoney(r.quote.totalCents)} · {nightsLabel(r.quote.nights)} · {t.priceTotal}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {r.reason ?? t.notAvailable}
                    {r.quote && r.quote.minNights > r.quote.nights ? t.minStay(r.quote.minNights) : ""}
                  </p>
                )}
              </div>
              {r.available ? (
                <Link
                  href={reservePath(r.propertySlug)}
                  onClick={() => track("select_property", { property_slug: r.propertySlug })}
                  className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
                >
                  {t.book}
                </Link>
              ) : (
                <Link
                  href={propertyPath(r.propertySlug)}
                  className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[var(--accent-700)] ring-1 ring-[var(--color-line)]"
                >
                  {t.seeProperty}
                </Link>
              )}
            </li>
          ))}
          {alt && alt.quote && (
            <li className="rounded-xl border border-dashed border-[var(--accent-500)] bg-[var(--accent-50)] p-4 text-sm">
              {locale === "en" ? (
                <>
                  These dates are free at <strong>{alt.propertyName}</strong> for{" "}
                  {formatMoney(alt.quote.totalCents)}.{" "}
                </>
              ) : (
                <>
                  Estas fechas sí están libres en <strong>{alt.propertyName}</strong> por{" "}
                  {formatMoney(alt.quote.totalCents)}.{" "}
                </>
              )}
              <Link href={reservePath(alt.propertySlug)} className="font-medium underline">
                {t.book}
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
