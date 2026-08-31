"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStay } from "@/domains/booking/stay";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/analytics";
import { localizedPath, type Locale } from "@/i18n/config";
import { RatingBadge } from "@/components/property/RatingBadge";

const STR = {
  es: {
    open: "Ver fechas",
    book: "Reservar",
    price: "Ver precio",
    from: "desde",
    total: "total",
    property: "Alojamiento",
    any: "Cualquiera",
    checkIn: "Entrada",
    checkOut: "Salida",
    guests: "Huéspedes",
    checking: "Comprobando…",
    notAvail: "Sin disponibilidad para estas fechas.",
    nearby: "Fechas cercanas libres",
    choose: "Elegir",
    close: "Cerrar",
    heading: "Consulta disponibilidad",
  },
  en: {
    open: "See dates",
    book: "Book",
    price: "See price",
    from: "from",
    total: "total",
    property: "Property",
    any: "Either",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    checking: "Checking…",
    notAvail: "No availability for these dates.",
    nearby: "Nearby free dates",
    choose: "Choose",
    close: "Close",
    heading: "Check availability",
  },
} as const;

const PROPERTIES = [
  { slug: "javalambre", name: "Javalambre Mountain SuperSki" },
  { slug: "valencia", name: "Valencia Frente al Mar" },
];

interface ResultRow {
  propertySlug: string;
  propertyName: string;
  available: boolean;
  quote: { totalCents: number; nights: number } | null;
  alternatives: { checkIn: string; checkOut: string; totalCents: number }[];
  rating: { value: number; count: number; source: "booking" } | null;
}

function todayPlus(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function fmtShort(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Routes where a persistent booking bar would be noise or redundant. */
const HIDDEN_PREFIXES = ["/admin", "/reservar", "/reserva", "/en/reservar"];
/** Pages that carry their own tailored on-page booking module + sticky CTA —
 *  the mobile bottom bar is suppressed there (the desktop floating bar stays). */
const OWN_BOOKING_UI = /^\/(en\/?)?(javalambre|valencia)?$/;

export function BookingBar({ locale }: { locale: Locale }) {
  const t = STR[locale];
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [stay, setStay] = useStay();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // local draft for the sheet form
  const [draft, setDraft] = useState({
    property: stay.property ?? "",
    checkIn: stay.checkIn ?? todayPlus(14),
    checkOut: stay.checkOut ?? todayPlus(17),
    guests: stay.guests,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft({
        property: stay.property ?? "",
        checkIn: stay.checkIn ?? todayPlus(14),
        checkOut: stay.checkOut ?? todayPlus(17),
        guests: stay.guests,
      });
      setStatus("idle");
    }
  }, [open, stay]);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const mobileBarHidden = OWN_BOOKING_UI.test(pathname);
  const hasDates = !!stay.checkIn && !!stay.checkOut;
  const label = useMemo(() => {
    if (!hasDates) return t.open;
    return `${fmtShort(stay.checkIn!, locale)} – ${fmtShort(stay.checkOut!, locale)}`;
  }, [hasDates, stay.checkIn, stay.checkOut, locale, t.open]);

  if (hidden) return null;

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setStay({
      property: draft.property || null,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: draft.guests,
    });
    track("search_availability", {
      check_in: draft.checkIn,
      check_out: draft.checkOut,
      guests: draft.guests,
    });
    try {
      const res = await fetch("/api/availability/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          guests: draft.guests,
        }),
      });
      const data = await res.json();
      setResults(res.ok ? (data.results as ResultRow[]) : []);
    } catch {
      setResults([]);
    }
    setStatus("done");
  }

  const reserve = (slug: string, ci: string, co: string) => {
    setStay({ property: slug, checkIn: ci, checkOut: co, guests: draft.guests });
    track("begin_checkout", { property_slug: slug, nights: 0 });
    router.push(
      localizedPath(locale, `/reservar/${slug}`) +
        `?${new URLSearchParams({ checkIn: ci, checkOut: co, guests: String(draft.guests) })}`,
    );
    setOpen(false);
  };

  const shown = draft.property
    ? results.filter((r) => r.propertySlug === draft.property)
    : results;

  return (
    <>
      {/* Desktop: slim floating bar, only once the main search has scrolled away */}
      <div
        className={`fixed inset-x-0 bottom-4 z-40 justify-center px-4 ${
          scrolled ? "hidden sm:flex" : "hidden"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full bg-white/95 py-2 pl-5 pr-2 shadow-[var(--shadow-lg)] backdrop-blur">
          <span className="text-sm font-medium">
            {stay.property
              ? PROPERTIES.find((p) => p.slug === stay.property)?.name.split(" ")[0]
              : t.heading}
          </span>
          {hasDates && (
            <span className="text-sm text-[var(--color-ink-soft)]">{label}</span>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pv-btn pv-btn--primary pv-btn--sm"
          >
            {hasDates ? t.price : t.open}
          </button>
        </div>
      </div>

      {/* Mobile: bottom bar — hidden on pages that carry their own booking module */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 p-3 backdrop-blur sm:hidden ${
          mobileBarHidden ? "hidden" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pv-btn pv-btn--primary pv-btn--block"
        >
          {hasDates ? `${label} · ${t.price}` : t.open}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.heading}
            className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-xl)] bg-white p-5 shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)]"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">{t.heading}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="rounded-full p-1.5 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-mist)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={search} className="mt-4 grid gap-3">
              <label>
                <span className="pv-label">{t.property}</span>
                <select
                  value={draft.property}
                  onChange={(e) => setDraft((d) => ({ ...d, property: e.target.value }))}
                  className="pv-select"
                >
                  <option value="">{t.any}</option>
                  {PROPERTIES.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="pv-label">{t.checkIn}</span>
                  <input
                    type="date"
                    required
                    value={draft.checkIn}
                    min={todayPlus(0)}
                    onChange={(e) => setDraft((d) => ({ ...d, checkIn: e.target.value }))}
                    className="pv-input"
                  />
                </label>
                <label>
                  <span className="pv-label">{t.checkOut}</span>
                  <input
                    type="date"
                    required
                    value={draft.checkOut}
                    min={draft.checkIn}
                    onChange={(e) => setDraft((d) => ({ ...d, checkOut: e.target.value }))}
                    className="pv-input"
                  />
                </label>
              </div>
              <label>
                <span className="pv-label">{t.guests}</span>
                <select
                  value={draft.guests}
                  onChange={(e) => setDraft((d) => ({ ...d, guests: Number(e.target.value) }))}
                  className="pv-select"
                >
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={status === "loading"} className="pv-btn pv-btn--primary">
                {status === "loading" ? t.checking : t.price}
              </button>
            </form>

            {status === "done" && (
              <ul className="mt-4 grid gap-3">
                {shown.map((r) => (
                  <li key={r.propertySlug} className="pv-card !p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        <span className="block font-medium">{r.propertyName}</span>
                        {r.rating && <RatingBadge rating={r.rating} locale={locale} size="xs" />}
                      </span>
                      {r.available && r.quote ? (
                        <button
                          type="button"
                          onClick={() => reserve(r.propertySlug, draft.checkIn, draft.checkOut)}
                          className="pv-btn pv-btn--primary pv-btn--sm"
                        >
                          {formatMoney(r.quote.totalCents)} · {t.book}
                        </button>
                      ) : (
                        <span className="text-sm text-[var(--color-ink-soft)]">{t.notAvail}</span>
                      )}
                    </div>
                    {!r.available && r.alternatives.length > 0 && (
                      <div className="mt-2 border-t border-[var(--color-line)] pt-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                          {t.nearby}
                        </p>
                        <ul className="mt-1.5 space-y-1.5">
                          {r.alternatives.map((a) => (
                            <li
                              key={`${a.checkIn}-${a.checkOut}`}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <span>
                                {fmtShort(a.checkIn, locale)} – {fmtShort(a.checkOut, locale)} ·{" "}
                                <span className="text-[var(--color-ink-soft)]">
                                  {formatMoney(a.totalCents)}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => reserve(r.propertySlug, a.checkIn, a.checkOut)}
                                className="pv-btn pv-btn--primary pv-btn--sm !h-8 !px-3 !text-xs"
                              >
                                {t.choose}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
