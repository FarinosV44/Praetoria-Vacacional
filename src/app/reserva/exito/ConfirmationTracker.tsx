"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Fires the reservation_confirmed conversion exactly once per locator
 * (issue #19 — "una reserva confirmada genera una sola conversión").
 */
export function ConfirmationTracker({
  propertySlug,
  totalCents,
  code,
}: {
  propertySlug: string;
  totalCents: number;
  code: string;
}) {
  useEffect(() => {
    const key = `pv:conv:${code}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    track("reservation_confirmed", {
      property_slug: propertySlug,
      value: totalCents / 100,
      currency: "EUR",
      transaction_id: code,
    });
  }, [propertySlug, totalCents, code]);

  return null;
}
