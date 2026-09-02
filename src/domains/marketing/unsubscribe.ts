import { createHmac, timingSafeEqual } from "node:crypto";
import { env, publicEnv } from "@/lib/env";

/**
 * Issue #73 — one-click unsubscribe tokens for marketing emails. Stateless HMAC
 * of the lower-cased email; no expiry (an unsubscribe link should always work).
 */

function secret(): string {
  return env.ADMIN_SESSION_SECRET || env.CRON_SECRET || env.ICAL_EXPORT_TOKEN || "insecure-unsub-secret";
}

export function signUnsubToken(email: string): string {
  const e = email.trim().toLowerCase();
  const mac = createHmac("sha256", secret()).update(`unsub:${e}`).digest("base64url");
  return `${Buffer.from(e).toString("base64url")}.${mac}`;
}

export function verifyUnsubToken(token: string): string | null {
  const [ePart, mac] = token.split(".");
  if (!ePart || !mac) return null;
  const email = Buffer.from(ePart, "base64url").toString();
  const expected = createHmac("sha256", secret()).update(`unsub:${email}`).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return email;
}

/** Human-facing page. */
export function unsubscribeUrl(email: string): string {
  return `${publicEnv.siteUrl.replace(/\/$/, "")}/baja?t=${signUnsubToken(email)}`;
}

/** Machine endpoint for the RFC-8058 one-click `List-Unsubscribe` header. */
export function unsubscribeApiUrl(email: string): string {
  return `${publicEnv.siteUrl.replace(/\/$/, "")}/api/marketing/unsubscribe?t=${signUnsubToken(email)}`;
}
