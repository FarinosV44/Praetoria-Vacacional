"use client";

import { writeConsent } from "@/lib/consent";

/** Re-opens the cookie banner so the visitor can change or withdraw consent. */
export function CookieSettingsButton() {
  return (
    <button type="button" className="pv-btn pv-btn--sm pv-btn--secondary mt-6" onClick={() => writeConsent(null)}>
      Cambiar mis preferencias de cookies
    </button>
  );
}
