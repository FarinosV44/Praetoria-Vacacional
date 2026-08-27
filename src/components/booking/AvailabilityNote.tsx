import { getAvailabilityInsight } from "@/domains/booking/service";

/**
 * Honest, data-backed availability signal (issue #49). Renders only when real
 * occupancy for the next weeks is genuinely high or medium — never invented
 * scarcity, no countdowns, no "X people viewing".
 */
export async function AvailabilityNote({
  propertySlug,
  locale = "es",
}: {
  propertySlug: string;
  locale?: "es" | "en";
}) {
  const insight = await getAvailabilityInsight(propertySlug);
  if (!insight || insight.level === "low") return null;

  const weeks = Math.round(insight.horizonDays / 7);
  const text =
    locale === "en"
      ? insight.level === "high"
        ? `Filling up: ${insight.occupancyPct}% of the nights in the next ${weeks} weeks are already booked.`
        : `${insight.occupancyPct}% of the nights in the next ${weeks} weeks are already booked.`
      : insight.level === "high"
        ? `Ocupación alta: el ${insight.occupancyPct}% de las noches de las próximas ${weeks} semanas ya está reservado.`
        : `El ${insight.occupancyPct}% de las noches de las próximas ${weeks} semanas ya está reservado.`;

  return (
    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-50)] px-3 py-1 text-sm text-[var(--accent-700)]">
      <span aria-hidden>📅</span>
      {text}
    </p>
  );
}
