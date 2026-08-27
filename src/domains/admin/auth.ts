import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Admin session (issue #13, decision D-005).
 *
 * A signed, HttpOnly cookie holds `<issuedAt>.<hmac>`. The password is checked
 * server-side against ADMIN_PASSWORD. When Supabase is configured the admin can
 * additionally be backed by Supabase Auth, but the password gate always applies
 * so the panel is never open just because Supabase exists.
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

export async function isAdminAuthenticated(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [issued, mac] = raw.split(".");
  if (!issued || !mac) return false;
  if (!safeEqual(mac, sign(issued))) return false;
  const age = (Date.now() - Number(issued)) / 1000;
  return age >= 0 && age < MAX_AGE;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

export const adminEnabled = env.adminConfigured;
