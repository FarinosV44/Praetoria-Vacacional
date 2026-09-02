import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Issue #68 — passwordless guest portal tokens.
 *
 * Stateless: `<reservationId>.<expiryMs>.<hmac>`, base64url-encoded parts. No DB
 * row — a stolen link works only until it expires (7 days) and the guest can
 * always request a fresh one with their code + email.
 */

const TTL_MS = 7 * 24 * 60 * 60_000;

function secret(): string {
  return (
    env.ADMIN_SESSION_SECRET ||
    env.CRON_SECRET ||
    env.ICAL_EXPORT_TOKEN ||
    env.ADMIN_PASSWORD ||
    "insecure-portal-dev-secret"
  );
}

function b64u(s: string): string {
  return Buffer.from(s).toString("base64url");
}
function unb64u(s: string): string {
  return Buffer.from(s, "base64url").toString();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signPortalToken(reservationId: string, now: Date = new Date()): string {
  const expiry = String(now.getTime() + TTL_MS);
  const payload = `${b64u(reservationId)}.${b64u(expiry)}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyPortalToken(token: string, now: Date = new Date()): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idPart, expPart, mac] = parts;
  const expected = sign(`${idPart}.${expPart}`);
  const a = Buffer.from(mac!);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const expiry = Number(unb64u(expPart!));
  if (!Number.isFinite(expiry) || expiry < now.getTime()) return null;
  return unb64u(idPart!);
}
