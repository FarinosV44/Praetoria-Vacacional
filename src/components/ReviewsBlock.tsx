import type { Review } from "@/domains/properties/types";

const sourceLabel: Record<Review["source"], string> = {
  booking: "Booking.com",
  airbnb: "Airbnb",
  google: "Google",
  direct: "Reserva directa",
};

/**
 * Social proof (issue #18). Real reviews with their source, and the real
 * aggregate score from the channel. Never invents testimonials or ratings;
 * renders an empty-safe state when nothing is loaded.
 */
export function ReviewsBlock({
  reviews,
  propertyName,
  rating,
}: {
  reviews: Review[];
  propertyName: string;
  rating?: { value: number; count: number; source: "booking" };
}) {
  if (reviews.length === 0) {
    return (
      <section aria-labelledby="reviews-heading" className="container-page section-y-tight">
        <h2 id="reviews-heading" className="display-3">
          Opiniones
        </h2>
        <p className="lede mt-3 max-w-2xl">
          Todavía no hemos publicado opiniones verificadas de {propertyName} en la web. Cuando
          estén disponibles se mostrarán aquí, siempre indicando su procedencia.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="reviews-heading" className="container-page section-y-tight">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-heading" className="display-3">
          Opiniones
        </h2>
        {rating && (
          <p className="text-sm text-[var(--color-ink-soft)]">
            {rating.value.toFixed(1)}/10 · {rating.count} opiniones en {sourceLabel[rating.source]}
          </p>
        )}
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {reviews.map((r, i) => (
          <li key={i} className="pv-card pv-card--pad">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{r.author}</span>
              <span className="pv-badge pv-badge--neutral">{r.rating.toFixed(1)}/10</span>
            </div>
            <p className="mt-2 text-[var(--color-ink)]">{r.text}</p>
            <p className="mt-3 text-xs text-[var(--color-ink-soft)]">Fuente: {sourceLabel[r.source]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Kept for callers that still compute stats from the review list. */
export function reviewStats(reviews: Review[]): { ratingValue: number; reviewCount: number } | null {
  if (reviews.length === 0) return null;
  return {
    ratingValue: Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)),
    reviewCount: reviews.length,
  };
}
