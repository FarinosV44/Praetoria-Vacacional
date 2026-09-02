/**
 * Issue #65 — admin users, per-user roles, revocable sessions, MFA.
 *
 * This file is pure (no I/O): the access decision, the session-validity check
 * and the invite-token helpers. The repository persists `AdminUser` rows; the
 * request-scoped resolution lives in `context.ts`.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { AdminRole } from "./roles";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  active: boolean;
  /** Bump this to invalidate every existing session for the user. */
  sessionsValidFrom: string;
  /** When true, sensitive capabilities require an AAL2 (MFA) session. */
  mfaRequired: boolean;
  invitedBy: string | null;
  /** sha256 of the invite token while the invite is pending; null once accepted. */
  inviteTokenHash: string | null;
  inviteExpiresAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserInput {
  email: string;
  fullName?: string | null;
  role: AdminRole;
  invitedBy?: string | null;
}

export const INVITE_TTL_MS = 7 * 24 * 60 * 60_000;

export type AccessReason = "ok" | "unknown" | "disabled" | "invite_pending";

export interface AccessDecision {
  ok: boolean;
  role: AdminRole | null;
  reason: AccessReason;
}

/** Pure: can this (possibly missing) user reach the admin panel right now? */
export function resolveAdminAccess(user: AdminUser | null): AccessDecision {
  if (!user) return { ok: false, role: null, reason: "unknown" };
  if (user.inviteTokenHash) return { ok: false, role: null, reason: "invite_pending" };
  if (!user.active) return { ok: false, role: null, reason: "disabled" };
  return { ok: true, role: user.role, reason: "ok" };
}

/**
 * Pure: is a session (identified by when it was issued) still valid given the
 * user's `sessionsValidFrom` watermark? A revoke bumps the watermark to now, so
 * every token minted earlier is rejected on its next request.
 */
export function sessionAcceptable(issuedAtMs: number, validFromIso: string): boolean {
  const validFrom = Date.parse(validFromIso);
  if (Number.isNaN(validFrom)) return true;
  return issuedAtMs >= validFrom - 1000; // 1s slack for clock skew
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateInviteToken(): { raw: string; hash: string; expiresAt: string } {
  const raw = randomBytes(32).toString("base64url");
  return {
    raw,
    hash: hashInviteToken(raw),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  };
}

export function inviteTokenMatches(raw: string, hash: string | null): boolean {
  if (!hash) return false;
  const a = Buffer.from(hashInviteToken(raw));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function inviteExpired(user: Pick<AdminUser, "inviteExpiresAt">, now = Date.now()): boolean {
  if (!user.inviteExpiresAt) return false;
  return Date.parse(user.inviteExpiresAt) < now;
}
