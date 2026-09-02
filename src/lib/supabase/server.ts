import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Cookie-bound Supabase client for Server Components / Route Handlers / Server
 * Actions. Reserved for Supabase-Auth admin sessions (issue #65) — NOT wired in
 * today: the admin panel authenticates with its own signed cookie and every
 * data call goes through `supabaseAdmin()` (the secret key) behind that check
 * (decision D-005). The anon/publishable key therefore has no live read path,
 * which is why migration 20260831130000 revokes anon access to every table.
 */
export async function supabaseServer() {
  if (!env.supabaseBrowserConfigured) {
    throw new Error(
      "Supabase Auth needs NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or _ANON_KEY) at build time.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl!, env.supabasePublishableKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}
