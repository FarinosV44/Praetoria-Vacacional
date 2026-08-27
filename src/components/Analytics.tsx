import Script from "next/script";
import { publicEnv } from "@/lib/env";

/**
 * GA4 loader (issue #19). Only renders when NEXT_PUBLIC_GA4_ID is configured.
 * Consent handling (issue #20) is stubbed to "denied" defaults until a CMP is
 * wired; events are still queued and no PII is ever sent (see lib/analytics).
 */
export function Analytics() {
  const id = publicEnv.ga4Id;
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied', analytics_storage: 'denied', wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
