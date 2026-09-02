import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getAdminContext } from "./context";

/**
 * Admin session (issue #13 · D-005, extended for multi-user in issue #65).
 *
 * Two login paths, resolved by `getAdminContext()`:
 *   - Supabase Auth (when Supabase is configured) — per-user accounts, MFA,
 *     revocable from `/admin/usuarios`.
 *   - Password cookie — a signed, HttpOnly `<issuedAt>.<hmac>` cookie checked
 *     against `ADMIN_PASSWORD`. Still the only path in DEMO mode.
 *
 * This module owns the password-cookie primitives; the role/identity decision
 * is in `context.ts`.
 */

const COOKIE = "pv_admin";
const MAX_AGE = 60 * 60 * 8; // 8h

function secret(): string {
  return env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || "insecure-dev-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  if (!env.adminConfigured) return false;
  return safeEqual(input, env.ADMIN_PASSWORD!);
}

export async function createAdminSession(): Promise<void> {
  const issued = Date.now().toString();
  const token = `${issued}.${sign(issued)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The password cookie's issue time (ms) when present and well-signed, else null. */
export async function passwordCookieIssuedAt(): Promise<number | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [issued, mac] = raw.split(".");
  if (!issued || !mac) return null;
  if (!safeEqual(mac, sign(issued))) return null;
  const issuedAt = Number(issued);
  const age = (Date.now() - issuedAt) / 1000;
  if (age < 0 || age >= MAX_AGE) return null;
  return issuedAt;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return !!(await getAdminContext());
}

export async function requireAdmin(): Promise<void> {
  if (!(await getAdminContext())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

export const adminEnabled = env.adminConfigured || env.supabaseConfigured;
