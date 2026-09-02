import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { reportError } from "@/lib/observability/report";
import { passwordCookieIssuedAt } from "./auth";
import type { AdminRole } from "./roles";
import { resolveAdminAccess, sessionAcceptable } from "./users";

/**
 * Issue #65 — who is the current admin, memoised per request.
 *
 * Order of resolution:
 *   1. Supabase Auth session (if Supabase is configured) → `admin_users` row.
 *   2. The password cookie → the seeded/first `admin_users` row, or a synthetic
 *      context from `ADMIN_ROLE` when no rows exist (DEMO, first boot).
 *
 * Returns `null` when nobody is authenticated OR the account is disabled /
 * pending / its sessions were revoked.
 */

export type MfaLevel = "aal1" | "aal2";

export interface AdminContext {
  userId: string | null;
  email: string;
  fullName: string | null;
  role: AdminRole;
  mfaRequired: boolean;
  mfaLevel: MfaLevel;
  /** True when the user must finish an MFA challenge before the panel unlocks. */
  needsMfa: boolean;
  source: "supabase" | "password";
}

async function fromSupabase(): Promise<AdminContext | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user?.email) return null;

    const repo = getRepository();
    let row =
      (await repo.getAdminUserById(user.id).catch(() => null)) ??
      (await repo.getAdminUserByEmail(user.email).catch(() => null));

    // Bootstrap: an email listed in ADMIN_EMAILS with no row yet becomes the
    // first `admin` on its first authenticated visit.
    if (!row && env.adminEmails.includes(user.email.toLowerCase())) {
      row = await repo
        .createAdminUser({ id: user.id, email: user.email, role: "admin" })
        .catch(() => null);
    }

    // First sign-in after an invite: activate the pending row once Supabase has
    // confirmed the email (the invite link does exactly that).
    if (row?.inviteTokenHash && user.email_confirmed_at) {
      row = await repo.acceptAdminInvite(row.id).catch(() => row);
    }

    const access = resolveAdminAccess(row);
    if (!access.ok || !row) return null;

    // AAL from Supabase MFA: aal2 means an MFA factor was verified this session.
    let mfaLevel: MfaLevel = "aal1";
    let needsMfa = row.mfaRequired;
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") mfaLevel = "aal2";
      needsMfa =
        (row.mfaRequired || aal?.nextLevel === "aal2") && aal?.currentLevel !== "aal2";
    } catch {
      /* keep needsMfa = row.mfaRequired */
    }

    void repo.touchAdminUser(row.id).catch(() => undefined);

    return {
      userId: row.id,
      email: row.email,
      fullName: row.fullName,
      role: access.role!,
      mfaRequired: row.mfaRequired,
      mfaLevel,
      needsMfa: !!needsMfa,
      source: "supabase",
    };
  } catch (err) {
    reportError(err, { scope: "admin/context/supabase" });
    return null;
  }
}

async function fromPassword(): Promise<AdminContext | null> {
  const issuedAt = await passwordCookieIssuedAt();
  if (issuedAt == null) return null;

  const email = env.adminEmails[0] ?? "admin@local";
  try {
    const repo = getRepository();
    const row = await repo.getAdminUserByEmail(email).catch(() => null);
    if (row) {
      const access = resolveAdminAccess(row);
      if (!access.ok) return null;
      if (!sessionAcceptable(issuedAt, row.sessionsValidFrom)) return null;
      void repo.touchAdminUser(row.id).catch(() => undefined);
      return {
        userId: row.id,
        email: row.email,
        fullName: row.fullName,
        role: access.role!,
        mfaRequired: false,
        mfaLevel: "aal1",
        needsMfa: false,
        source: "password",
      };
    }
  } catch {
    // fall through to the synthetic context
  }

  // No admin_users rows yet — single implicit admin from the env role.
  return {
    userId: null,
    email,
    fullName: null,
    role: env.adminRole,
    mfaRequired: false,
    mfaLevel: "aal1",
    needsMfa: false,
    source: "password",
  };
}

export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  if (env.supabaseBrowserConfigured) {
    const viaSupabase = await fromSupabase();
    if (viaSupabase) return viaSupabase;
  }
  return fromPassword();
});
