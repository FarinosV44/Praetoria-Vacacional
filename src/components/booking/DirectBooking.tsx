import { directBooking } from "@/content/site";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";

/**
 * Direct-booking value proposition (issue #91). Real, configurable benefits —
 * no false price comparisons, no fake struck-through prices.
 */

const STR = {
  es: {
    heading: "Reservando directamente con Praetoria",
    here: "Reservando aquí",
    platform: "Reservando en una plataforma",
    promo: (pct: number, code: string) => `Código ${code}: ${pct}% de descuento en reserva directa.`,
    saveApprox: (amount: string) => `Con el código ${directBooking.promo?.code} ahorras aprox. ${amount}.`,
  },
  en: {
    heading: "When you book directly with Praetoria",
    here: "Booking here",
    platform: "Booking on a platform",
    promo: (pct: number, code: string) => `Code ${code}: ${pct}% off when you book direct.`,
    saveApprox: (amount: string) => `With code ${directBooking.promo?.code} you save about ${amount}.`,
  },
} as const;

/** The "here vs platform" microblock. */
export function DirectBookingCompare({ locale }: { locale: Locale }) {
  const t = STR[locale === "en" ? "en" : "es"];
  const c = directBooking.compare;
  const l = locale === "en" ? "en" : "es";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[var(--radius-card)] border border-[var(--accent-500)] bg-[var(--accent-50)] p-5">
        <p className="text-sm font-semibold text-[var(--accent-700)]">{t.here}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {c.here[l].map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-[var(--accent-600)]">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-5">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">{t.platform}</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-soft)]">
          {c.platform[l].map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden>·</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * A one-line promo nudge for use next to a CTA. When `totalCents` is known the
 * approximate € saving is shown; otherwise just the offer.
 */
export function DirectBookingSaving({
  totalCents,
  locale = "es",
  className = "",
}: {
  totalCents?: number;
  locale?: Locale;
  className?: string;
}) {
  const promo = directBooking.promo;
  if (!promo) return null;
  const t = STR[locale === "en" ? "en" : "es"];
  const saving =
    totalCents && totalCents > 0 ? Math.round((totalCents * promo.percent) / 100) : null;

  return (
    <p
      className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-50)] px-3 py-1 text-sm text-[var(--accent-700)] ${className}`}
    >
      <span aria-hidden>🏷️</span>
      {saving ? t.saveApprox(formatMoney(saving)) : t.promo(promo.percent, promo.code)}
    </p>
  );
}
