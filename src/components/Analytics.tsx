import { publicEnv } from "@/lib/env";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";

/**
 * GA4 loader (issues #19, #20). Renders nothing unless NEXT_PUBLIC_GA4_ID is
 * configured; the tag itself only loads after the visitor accepts analytics
 * cookies (see AnalyticsConsent).
 */
export function Analytics() {
  const id = publicEnv.ga4Id;
  if (!id) return null;
  return <AnalyticsConsent id={id} />;
}
