"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { createHash } from "node:crypto";
import { planErasure } from "./erasure";
import { applyErasurePlan, buildDataExport, collectSubjectData, type DataExport } from "./subject";
import { runRetentionSweep } from "./sweep";
import type { ErasurePlan } from "./types";

const emailSchema = z.string().trim().email().max(200);

function subjectHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);
}

async function guard(cap: "customers.write" | "settings.write") {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability(cap);
}

export interface SubjectPreview {
  ok: boolean;
  error?: string;
  found?: boolean;
  counts?: { reservations: number; invoices: number; messages: number; customer: boolean };
  plan?: ErasurePlan;
}

export async function previewSubjectAction(_prev: unknown, formData: FormData): Promise<SubjectPreview> {
  await guard("customers.write");
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Correo no válido" };

  const bundle = await collectSubjectData(parsed.data);
  const found = !!bundle.customer || bundle.reservations.length > 0;
  return {
    ok: true,
    found,
    counts: {
      reservations: bundle.reservations.length,
      invoices: bundle.invoices.length,
      messages: bundle.messages.length,
      customer: !!bundle.customer,
    },
    plan: planErasure(bundle),
  };
}

export async function exportSubjectAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true; data: DataExport } | { ok: false; error: string }> {
  await guard("customers.write");
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Correo no válido" };

  const bundle = await collectSubjectData(parsed.data);
  await logAction("privacy.export", { entity: "subject", entityId: subjectHash(parsed.data) });
  return { ok: true, data: buildDataExport(bundle) };
}

export async function eraseSubjectAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  await guard("customers.write");
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Correo no válido" };
  if (String(formData.get("confirm") ?? "") !== "BORRAR") {
    return { ok: false, error: "Escribe BORRAR para confirmar" };
  }

  const bundle = await collectSubjectData(parsed.data);
  const plan = planErasure(bundle);
  const outcome = await applyErasurePlan(bundle, plan);

  await logAction("privacy.erase", {
    entity: "subject",
    entityId: subjectHash(parsed.data),
    meta: { ...outcome, blocked: plan.blockedReasons.length },
  });
  revalidatePath("/admin/privacidad");

  return {
    ok: true,
    message:
      `Eliminados ${outcome.deleted}, anonimizados ${outcome.anonymized}.` +
      (plan.blockedReasons.length
        ? ` ${plan.blockedReasons.length} registro(s) conservados por obligación legal.`
        : ""),
  };
}

export async function runRetentionSweepNowAction(): Promise<void> {
  await guard("settings.write");
  const result = await runRetentionSweep();
  await logAction("privacy.retention_sweep", { entity: "system", meta: result });
  revalidatePath("/admin/privacidad");
}
