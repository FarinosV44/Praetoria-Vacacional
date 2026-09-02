import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { reportError, reportMessage } from "@/lib/observability/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issue #73 — Resend event webhook. A bounced or complained recipient is added
 * to the suppression list so future campaigns skip them. Signature is the Svix
 * scheme Resend uses; without `RESEND_WEBHOOK_SECRET` the endpoint is disabled.
 */
function verify(secret: string, id: string, ts: string, body: string, header: string): boolean {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  for (const part of header.split(" ")) {
    const sig = part.split(",")[1];
    if (!sig) continue;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export async function POST(req: Request) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }
  const id = req.headers.get("svix-id");
  const ts = req.headers.get("svix-timestamp");
  const sig = req.headers.get("svix-signature");
  const body = await req.text();
  if (!id || !ts || !sig || !verify(env.RESEND_WEBHOOK_SECRET, id, ts, body, sig)) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const event = JSON.parse(body) as { type?: string; data?: { to?: string | string[]; email?: string } };
    const suppressTypes = ["email.bounced", "email.complained", "email.failed"];
    if (event.type && suppressTypes.includes(event.type)) {
      const raw = event.data?.to ?? event.data?.email;
      const emails = Array.isArray(raw) ? raw : raw ? [raw] : [];
      for (const email of emails) {
        await getRepository()
          .addUnsubscribe(email, event.type.replace("email.", ""))
          .catch(() => undefined);
      }
      reportMessage(`resend ${event.type} → suppressed ${emails.length}`, "info", {
        scope: "webhook/resend",
      });
    }
  } catch (err) {
    reportError(err, { scope: "webhook/resend" });
    return new Response("Handler error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}
