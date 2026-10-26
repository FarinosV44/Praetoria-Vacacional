import "server-only";
import { createHash } from "node:crypto";
import webpush, { type PushSubscription } from "web-push";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";

/**
 * Web Push to the owner's phone (admin mobile app).
 *
 * The admin panel is installable as an app (manifest + service worker, see
 * public/admin.webmanifest and public/admin-sw.js). Each phone that turns
 * notifications on stores its browser push subscription here; when a booking
 * is confirmed a durable job (`push.reservation_notice`) sends it a message.
 *
 * Storage reuses the server-only `content_overrides` key/value table (RLS
 * locked, never read by public pages except under their own prefixes), so no
 * migration is needed:
 *   - `push:sub:<hash>` — one subscription per device
 *   - `push:vapid`      — the VAPID key pair, generated on first use when the
 *                          VAPID_* env vars are not set (zero-config install)
 */

const SUB_PREFIX = "push:sub:";
const VAPID_KEY = "push:vapid";

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** Human label for the device list ("iPhone · Safari"). */
  label: string;
  createdAt: string;
  lastOkAt?: string;
}

export interface PushMessage {
  title: string;
  body: string;
  /** Path opened when the notification is tapped (must be under /admin). */
  url: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag?: string;
}

interface VapidPair {
  publicKey: string;
  privateKey: string;
}

let cachedVapid: VapidPair | null = null;

/** VAPID keys: env first, else a pair generated once and stored server-side. */
export async function getVapidKeys(): Promise<VapidPair> {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    return { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
  }
  if (cachedVapid) return cachedVapid;
  const repo = getRepository();
  const row = await repo.getContentOverride(VAPID_KEY);
  const stored = row?.value as Partial<VapidPair> | undefined;
  if (stored?.publicKey && stored?.privateKey) {
    cachedVapid = { publicKey: stored.publicKey, privateKey: stored.privateKey };
    return cachedVapid;
  }
  const fresh = webpush.generateVAPIDKeys();
  await repo.setContentOverride(VAPID_KEY, fresh);
  cachedVapid = fresh;
  return fresh;
}

function vapidSubject(): string {
  const email = env.adminEmails[0] ?? env.EMAIL_REPLY_TO?.match(/[^<\s]+@[^>\s]+/)?.[0];
  return email ? `mailto:${email}` : env.NEXT_PUBLIC_SITE_URL;
}

function keyFor(endpoint: string): string {
  return SUB_PREFIX + createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

/** Validates the browser's PushSubscription JSON before storing it. */
export function parseSubscription(input: unknown): Pick<StoredSubscription, "endpoint" | "keys"> | null {
  if (!input || typeof input !== "object") return null;
  const s = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof s.endpoint !== "string" || !/^https:\/\/[^\s]{8,2000}$/.test(s.endpoint)) return null;
  const p256dh = s.keys?.p256dh;
  const auth = s.keys?.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(auth)) return null;
  return { endpoint: s.endpoint, keys: { p256dh, auth } };
}

export async function saveSubscription(sub: Pick<StoredSubscription, "endpoint" | "keys">, label: string) {
  const value: StoredSubscription = {
    ...sub,
    label: label.slice(0, 80) || "Dispositivo",
    createdAt: new Date().toISOString(),
  };
  await getRepository().setContentOverride(keyFor(sub.endpoint), value);
}

export async function removeSubscription(endpoint: string) {
  await getRepository().setContentOverride(keyFor(endpoint), null);
}

export async function listSubscriptions(): Promise<StoredSubscription[]> {
  const rows = await getRepository().listContentOverrides(SUB_PREFIX);
  return rows
    .map((r) => r.value as StoredSubscription)
    .filter((s) => s && typeof s.endpoint === "string");
}

export interface PushReport {
  sent: number;
  removed: number;
  failed: number;
}

/**
 * Sends one message to every registered device. Subscriptions the push
 * service reports as gone (404/410) are deleted. Never throws.
 */
export async function sendPushToAdmins(message: PushMessage): Promise<PushReport> {
  const report: PushReport = { sent: 0, removed: 0, failed: 0 };
  let subs: StoredSubscription[];
  let vapid: VapidPair;
  try {
    subs = await listSubscriptions();
    if (subs.length === 0) return report;
    vapid = await getVapidKeys();
  } catch (err) {
    console.error("[push] could not load subscriptions or keys", err);
    report.failed = 1;
    return report;
  }

  const payload = JSON.stringify(message);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(s as PushSubscription, payload, {
          TTL: 60 * 60 * 24,
          urgency: "high",
          vapidDetails: { subject: vapidSubject(), ...vapid },
        });
        report.sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removeSubscription(s.endpoint).catch(() => undefined);
          report.removed++;
        } else {
          console.error("[push] send failed", status, (err as Error).message);
          report.failed++;
        }
      }
    }),
  );
  return report;
}
