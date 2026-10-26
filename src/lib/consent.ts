/**
 * Analytics cookie consent, stored on the visitor's device. `null` means the
 * visitor has not chosen yet (the banner is shown).
 */
export type Consent = "granted" | "denied" | null;

const KEY = "pv_cookie_consent";
export const CONSENT_EVENT = "pv:consent-change";

export function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/** Saves the choice (or clears it with `null` to ask again) and notifies listeners. */
export function writeConsent(value: Consent): void {
  const wasGranted = readConsent() === "granted";
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the choice lasts for this page view only */
  }
  if (wasGranted && value !== "granted") {
    // Withdrawal: remove Google's cookies and reload so the tag is gone.
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0]?.trim();
      if (name && (name === "_ga" || name.startsWith("_ga_"))) {
        const domain = window.location.hostname.replace(/^www\./, "");
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    }
    window.location.reload();
    return;
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
