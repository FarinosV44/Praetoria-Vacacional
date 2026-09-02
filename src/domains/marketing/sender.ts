import "server-only";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { sendEmail, brandedEmail } from "@/domains/notifications/email";
import { reportError, reportMessage } from "@/lib/observability/report";
import { unsubscribeApiUrl, unsubscribeUrl } from "./unsubscribe";

/**
 * Issue #73 — real campaign send over Resend.
 *
 * Honours the suppression list at send time (not just at prepare time),
 * attaches RFC-8058 one-click unsubscribe headers + a visible link, marks each
 * recipient sent/failed and closes the campaign. A bounce/complaint webhook
 * (`/api/webhooks/resend`) feeds the suppression list going forward.
 */

export interface SendOutcome {
  sent: number;
  failed: number;
  suppressed: number;
}

const MARKETING_FROM = env.MARKETING_FROM || env.EMAIL_FROM;

export async function sendCampaign(campaignId: string): Promise<SendOutcome> {
  const repo = getRepository();
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
  if (campaign.status !== "prepared") throw new Error("CAMPAIGN_NOT_PREPARED");
  if (campaign.channel !== "email") throw new Error("CHANNEL_NOT_SUPPORTED");
  if (!env.emailConfigured) throw new Error("EMAIL_NOT_CONFIGURED");

  const recipients = (await repo.listCampaignRecipients(campaignId)).filter(
    (r) => r.status === "pending" && r.email,
  );

  const outcome: SendOutcome = { sent: 0, failed: 0, suppressed: 0 };
  const subject = campaign.subject ?? campaign.name;

  for (const r of recipients) {
    const email = r.email!;
    // Re-check suppression right now.
    if (await repo.isUnsubscribed(email).catch(() => false)) {
      await repo.markCampaignRecipient(r.id, "unsubscribed", "baja de marketing");
      outcome.suppressed += 1;
      continue;
    }

    const unsub = unsubscribeUrl(email);
    const bodyHtml = (campaign.body ?? "")
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");
    const html = brandedEmail({
      heading: subject,
      intro: "",
      rows: [],
      footer:
        `${bodyHtml}` +
        (campaign.couponCode ? `<p><strong>Código: ${escapeHtml(campaign.couponCode)}</strong></p>` : "") +
        `<p style="font-size:12px;color:#888">Recibes este correo porque reservaste con nosotros. ` +
        `<a href="${unsub}">Darte de baja</a>.</p>`,
    });

    const res = await sendEmail(email, subject, html, `${campaign.body ?? ""}\n\nBaja: ${unsub}`, {
      kind: "marketing",
      from: MARKETING_FROM,
      headers: {
        "List-Unsubscribe": `<${unsubscribeApiUrl(email)}>, <${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (res.ok && !res.skipped) {
      await repo.markCampaignRecipient(r.id, "sent");
      outcome.sent += 1;
    } else {
      await repo.markCampaignRecipient(r.id, "failed", res.error ?? "envío omitido");
      outcome.failed += 1;
    }
  }

  await repo.finishCampaign(campaignId, outcome.sent);
  reportMessage("marketing campaign sent", "info", {
    scope: "marketing/send",
    extra: { campaignId, ...outcome },
  });
  return outcome;
}

export async function sendCampaignSafe(campaignId: string): Promise<SendOutcome | { error: string }> {
  try {
    return await sendCampaign(campaignId);
  } catch (err) {
    reportError(err, { scope: "marketing/send", extra: { campaignId } });
    return { error: err instanceof Error ? err.message : "error" };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
