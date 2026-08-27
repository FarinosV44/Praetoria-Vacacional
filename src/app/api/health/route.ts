import { NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { getConfigFeatures } from "@/domains/config-status/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health / status endpoint (issue #42). Returns 200 when the app is alive and
 * the data layer answers; 503 if the configured database is unreachable.
 * Safe to expose — no secrets, no counts of sensitive data.
 */
export async function GET() {
  const started = Date.now();
  const checks: Record<string, "ok" | "demo" | "error"> = {};

  // Data layer round-trip.
  try {
    await getRepository().getSyncRows();
    checks.repository = DEMO_MODE ? "demo" : "ok";
  } catch (err) {
    console.error("health: repository check failed", err);
    checks.repository = "error";
  }

  const features = Object.fromEntries(getConfigFeatures().map((f) => [f.key, f.state]));

  const healthy = checks.repository !== "error";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      demoMode: DEMO_MODE,
      checks,
      integrations: features,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      responseMs: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
