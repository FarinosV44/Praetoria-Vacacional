"use client";

import { useEffect, useState } from "react";

interface Insight {
  level: "high" | "medium" | "low";
  occupancyPct: number;
  horizonDays: number;
}

/**
 * Honest, data-backed availability signal (issue #49). Renders only when real
 * occupancy for the next weeks is genuinely high or medium — never invented
 * scarcity, no countdowns, no "X people viewing".
 *
 * It is a CLIENT component that fetches `/api/properties/[slug]/availability-
 * insight` after hydration: availability is live data and must not be baked into
 * the statically-prerendered property page (the production build no longer
 * depends on the database). If the request fails or occupancy is low, nothing
 * renders — this is a soft enhancement, not the booking calendar.
 */
export function AvailabilityNote({
  propertySlug,
  locale = "es",
}: {
  propertySlug: string;
  locale?: "es" | "en";
}) {
  const [insight, setInsight] = useState<Insight | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/properties/${propertySlug}/availability-insight`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Insight | null) => {
        if (alive && data && (data.level === "high" || data.level === "medium")) setInsight(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [propertySlug]);

  if (!insight) return null;

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
    <p className="pv-chip pv-chip--accent mt-3">
      <span aria-hidden>📅</span>
      {text}
    </p>
  );
}
