import { apiOk, requireServiceAuth } from "@/lib/api";
import { getAllProperties } from "@/domains/properties/registry";
import { applyDynamicPricing } from "@/domains/pricing/dynamic-apply";
import { reportError } from "@/lib/observability/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Issue #74 — daily dynamic-pricing pass. Only applies to properties that have
 * "aplicar automáticamente" enabled; guardrails (±band, floor) are enforced in
 * `applyDynamicPricing`. Auth: CRON_SECRET (#64).
 */
async function run(req: Request) {
  const denied = requireServiceAuth(req);
  if (denied) return denied;

  const results = [];
  for (const property of getAllProperties()) {
    try {
      results.push(await applyDynamicPricing(property.slug));
    } catch (err) {
      reportError(err, { scope: "cron/pricing", extra: { slug: property.slug } });
    }
  }
  return apiOk({ results });
}

export const GET = run;
export const POST = run;
