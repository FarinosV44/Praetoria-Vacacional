"use client";

import Script from "next/script";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  readConsent,
  writeConsent,
  type Consent,
} from "@/lib/consent";

/**
 * GA4 + cookie consent (issues #19, #20).
 *
 * Google's tag is NOT loaded until the visitor accepts analytics cookies, so
 * nothing is sent to Google before consent (basic consent mode). The choice
 * is stored on this device and can be changed from the cookie policy page.
 * Never renders under /admin.
 */
export function AnalyticsConsent({ id }: { id: string }) {
  const pathname = usePathname() ?? "/";
  const [consent, setConsent] = useState<Consent | "unknown">("unknown");

  useEffect(() => {
    setConsent(readConsent());
    const onChange = () => setConsent(readConsent());
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (pathname.startsWith("/admin")) return null;
  const en = pathname === "/en" || pathname.startsWith("/en/");

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
                analytics_storage: 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${id}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}
      {consent === null && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={en ? "Cookies" : "Aviso de cookies"}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-lg)] sm:bottom-6"
        >
          <p className="text-sm text-[var(--color-ink-soft)]">
            {en
              ? "We use analytics cookies (Google Analytics) to understand which pages help our guests. They are only set if you accept. "
              : "Usamos cookies analíticas (Google Analytics) para saber qué páginas ayudan a nuestros huéspedes. Solo se instalan si aceptas. "}
            <Link href="/legal/cookies" className="underline underline-offset-2">
              {en ? "Cookie policy" : "Política de cookies"}
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="pv-btn pv-btn--sm pv-btn--secondary flex-1"
              onClick={() => writeConsent("denied")}
            >
              {en ? "Reject" : "Rechazar"}
            </button>
            <button
              type="button"
              className="pv-btn pv-btn--sm pv-btn--ink flex-1"
              onClick={() => writeConsent("granted")}
            >
              {en ? "Accept" : "Aceptar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
