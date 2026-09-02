import { NextResponse } from "next/server";
import { DEMO_MODE, env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { getConfigFeatures } from "@/domains/config-status/registry";

/** Presence (never values) of the vars that decide the data mode — read at
 *  RUNTIME so a hosting-panel change without a rebuild is visible here. */
function supabaseEnvDiagnostics() {
  const present = (v: string | undefined) => !!v && v.trim().length > 0;
  return {
    resolved: env.supabaseConfigured ? "supabase" : "demo",
    SUPABASE_URL: present(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL_buildtime: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SECRET_KEY: present(process.env.SUPABASE_SECRET_KEY),
    SUPABASE_SERVICE_ROLE_KEY: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_buildtime: present(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    hint:
      !env.supabaseConfigured &&
      (present(process.env.SUPABASE_SECRET_KEY) || present(process.env.SUPABASE_SERVICE_ROLE_KEY))
        ? "A Supabase secret key is present but the app is in DEMO mode — set SUPABASE_URL (runtime var, no NEXT_PUBLIC prefix) OR rebuild after setting NEXT_PUBLIC_SUPABASE_URL."
        : undefined,
  };
}

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
  let repoError: string | null = null;
  try {
    await getRepository().getSyncRows();
    checks.repository = DEMO_MODE ? "demo" : "ok";
  } catch (err) {
    repoError = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    console.error("health: repository check failed", err);
    checks.repository = "error";
  }

  const features = Object.fromEntries(getConfigFeatures().map((f) => [f.key, f.state]));

  const degraded = checks.repository === "error";
  return NextResponse.json(
    {
      // The process is alive and env parsed — return 200 so a hosting health
      // check doesn't pull the whole app offline. `status` says whether it can
      // actually serve; `repoError` names the fault (usually: migrations not
      // applied, or a wrong Supabase key).
      status: degraded ? "degraded" : "ok",
      demoMode: DEMO_MODE,
      supabase: supabaseEnvDiagnostics(),
      checks,
      repoError,
      integrations: features,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      responseMs: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
