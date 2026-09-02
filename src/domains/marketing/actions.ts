"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { isIsoDate } from "@/lib/dates";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import type { SegmentCriteria } from "./segments";
import type { CampaignChannel } from "./types";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

const SOURCES = ["direct", "booking", "airbnb", "manual", "other"] as const;

function criteriaFromForm(formData: FormData): SegmentCriteria {
  const c: SegmentCriteria = {};
  const propertyIds = new Set(getAllProperties().map((p) => p.id));
  const props = formData.getAll("properties").map(String).filter((v) => propertyIds.has(v));
  if (props.length) c.properties = props;
  const channels = formData
    .getAll("channels")
    .map(String)
    .filter((v): v is (typeof SOURCES)[number] => (SOURCES as readonly string[]).includes(v));
  if (channels.length) c.channels = channels;
  const langs = String(formData.get("languages") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (langs.length) c.languages = langs;
  const origin = String(formData.get("origin") ?? "");
  if (origin === "national" || origin === "foreign") c.origin = origin;
  if (formData.get("repeatersOnly") === "on" || formData.get("repeatersOnly") === "true")
    c.repeatersOnly = true;
  if (formData.get("consentOnly") === "on" || formData.get("consentOnly") === "true")
    c.consentOnly = true;
  if (formData.get("couponUsed") === "on" || formData.get("couponUsed") === "true")
    c.couponUsed = true;
  const minSpend = Number(formData.get("minTotalEuros"));
  if (Number.isFinite(minSpend) && minSpend > 0) c.minTotalSpentCents = Math.round(minSpend * 100);
  const before = String(formData.get("lastStayBefore") ?? "");
  if (isIsoDate(before)) c.lastStayBefore = before;
  const after = String(formData.get("lastStayAfter") ?? "");
  if (isIsoDate(after)) c.lastStayAfter = after;
  return c;
}

const segmentMeta = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional(),
});

export async function saveSegmentAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = segmentMeta.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Ponle un nombre al segmento (mín. 2 caracteres)" };
  const criteria = criteriaFromForm(formData);
  const repo = getRepository();
  const input = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    criteria,
  };
  const seg = parsed.data.id
    ? await repo.updateSegment(parsed.data.id, input)
    : await repo.createSegment(input);
  revalidatePath("/admin/marketing");
  revalidatePath(`/admin/marketing/segmentos/${seg.id}`);
  return { ok: true, id: seg.id };
}

export async function createSegmentAndRedirect(_prev: unknown, formData: FormData) {
  const res = await saveSegmentAction(_prev, formData);
  if (res.ok && res.id) redirect(`/admin/marketing/segmentos/${res.id}`);
  return res;
}

export async function deleteSegmentAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getRepository().deleteSegment(id);
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing");
}

const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  channel: z.enum(["email", "whatsapp", "promo"]),
  segmentId: z.string().optional(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().max(8000).optional(),
  couponCode: z.string().trim().max(40).optional(),
  consentRequired: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(true),
});

export async function saveCampaignAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const d = parsed.data;
  const repo = getRepository();
  const input = {
    name: d.name,
    channel: d.channel as CampaignChannel,
    segmentId: d.segmentId || null,
    subject: d.subject || null,
    body: d.body || null,
    couponCode: d.couponCode || null,
    consentRequired: d.consentRequired,
  };
  try {
    const campaign = d.id
      ? await repo.updateCampaign(d.id, input)
      : await repo.createCampaign(input);
    revalidatePath("/admin/marketing");
    revalidatePath(`/admin/marketing/campanas/${campaign.id}`);
    return { ok: true, id: campaign.id };
  } catch (err) {
    if (err instanceof Error && err.message === "CAMPAIGN_SENT") {
      return { ok: false, error: "La campaña ya se ha enviado y no se puede modificar" };
    }
    throw err;
  }
}

export async function createCampaignAndRedirect(_prev: unknown, formData: FormData) {
  const res = await saveCampaignAction(_prev, formData);
  if (res.ok && res.id) redirect(`/admin/marketing/campanas/${res.id}`);
  return res;
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getRepository().deleteCampaign(id);
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing");
}

export async function prepareCampaignAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getRepository().prepareCampaign(id);
  revalidatePath(`/admin/marketing/campanas/${id}`);
}

export async function sendCampaignAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("marketing.write");
  const id = String(formData.get("id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  // Double confirmation: the form asks the admin to type ENVIAR.
  if (id && confirm === "ENVIAR") {
    const campaign = await getRepository().getCampaign(id);
    if (campaign?.channel === "email" && (await import("@/lib/env")).env.emailConfigured) {
      const { sendCampaignSafe } = await import("./sender");
      const outcome = await sendCampaignSafe(id);
      await logAction("campaign.send", { entity: "campaign", entityId: id, meta: outcome });
    } else {
      // No live sender for this channel — record the intent, recipients skipped.
      await getRepository().markCampaignSent(id);
      await logAction("campaign.send", { entity: "campaign", entityId: id, meta: { mode: "intent-only" } });
    }
  }
  revalidatePath(`/admin/marketing/campanas/${id}`);
}

const unsubSchema = z.object({ email: z.string().trim().email().max(200) });

export async function addUnsubscribeAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = unsubSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Email no válido" };
  await getRepository().addUnsubscribe(parsed.data.email, "admin");
  revalidatePath("/admin/marketing/bajas");
  return { ok: true };
}
