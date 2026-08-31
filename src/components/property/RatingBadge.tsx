import type { Locale } from "@/i18n/config";

interface Rating {
  value: number;
  count: number;
  source: "booking";
}

/**
 * Real, source-attributed rating — shown next to the property name across the
 * funnel (issue #90). Never a fabricated score; renders nothing without data.
 * Booking's /10 scale is kept as-is to stay faithful to the source.
 */
export function RatingBadge({
  rating,
  locale = "es",
  size = "sm",
  withSource = true,
}: {
  rating: Rating | undefined | null;
  locale?: Locale;
  size?: "sm" | "xs";
  withSource?: boolean;
}) {
  if (!rating || rating.count <= 0) return null;
  const es = locale !== "en";
  const reviews = es ? "opiniones" : "reviews";
  const on = es ? "en Booking" : "on Booking";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${size === "xs" ? "text-xs" : "text-sm"}`}
      aria-label={`${rating.value.toFixed(1)} de 10, ${rating.count} ${reviews} ${on}`}
    >
      <span className="pv-badge pv-badge--score">{rating.value.toFixed(1)}</span>
      <span className="text-[var(--color-ink-soft)]">
        {rating.count} {reviews}
        {withSource ? ` · ${on}` : ""}
      </span>
    </span>
  );
}
