import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client. Server-only. Bypasses RLS — never import this
 * into a client component or expose its results without an auth check.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!env.supabaseConfigured) {
    throw new Error("Supabase is not configured (running in DEMO mode).");
  }
  if (!cached) {
    cached = createClient(env.supabaseUrl!, env.supabaseSecretKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
      // Never let an unreachable database hang a request/worker indefinitely.
      global: {
        fetch: (input, init) =>
          fetch(input as RequestInfo, { ...init, signal: AbortSignal.timeout(8000) }),
      },
    });
  }
  return cached;
}
