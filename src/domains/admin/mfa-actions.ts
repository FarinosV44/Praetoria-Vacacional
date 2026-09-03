"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import { isAdminAuthenticated } from "./auth";
import { logAction } from "./audit";

/**
 * Issue #65 — two-factor auth (TOTP) via Supabase Auth MFA. All no-ops unless
 * Supabase is configured. `enroll` → shows a QR; `verify` confirms the factor
 * and lifts the session to AAL2; `challenge` is the login-time code check.
 */

type EnrollResult =
  | { ok: true; factorId: string; qr: string; secret: string }
  | { ok: false; error: string };

type SimpleResult = { ok: true } | { ok: false; error: string };

async function supabase() {
  const { supabaseServer } = await import("@/lib/supabase/server");
  return supabaseServer();
}

async function requireUser() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  if (!env.adminSupabaseAuth) throw new Error("La verificación en dos pasos requiere el login por Supabase Auth (ADMIN_SUPABASE_AUTH).");
}

export async function startMfaEnrollmentAction(): Promise<EnrollResult> {
  await requireUser();
  const sb = await supabase();
  // Drop any half-finished unverified factor so re-enrolling is clean.
  const { data: list } = await sb.auth.mfa.listFactors();
  for (const f of list?.all ?? []) {
    if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo iniciar el registro" };
  return { ok: true, factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

const codeSchema = z.string().trim().regex(/^\d{6}$/, "Introduce el código de 6 dígitos");

export async function verifyMfaEnrollmentAction(_prev: unknown, formData: FormData): Promise<SimpleResult> {
  await requireUser();
  const factorId = String(formData.get("factorId") ?? "");
  const parsed = codeSchema.safeParse(formData.get("code"));
  if (!factorId || !parsed.success) return { ok: false, error: parsed.error?.issues[0]?.message ?? "Datos no válidos" };

  const sb = await supabase();
  const { data: challenge, error: cErr } = await sb.auth.mfa.challenge({ factorId });
  if (cErr || !challenge) return { ok: false, error: cErr?.message ?? "No se pudo generar el desafío" };
  const { error } = await sb.auth.mfa.verify({ factorId, challengeId: challenge.id, code: parsed.data });
  if (error) return { ok: false, error: "El código no es correcto" };

  await logAction("admin_user.mfa_enrolled", { entity: "admin_user" });
  revalidatePath("/admin/seguridad");
  revalidatePath("/admin");
  return { ok: true };
}

export async function challengeMfaAction(_prev: unknown, formData: FormData): Promise<SimpleResult> {
  await requireUser();
  const parsed = codeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Código no válido" };

  const sb = await supabase();
  const { data: list } = await sb.auth.mfa.listFactors();
  const factor = (list?.totp ?? []).find((f) => f.status === "verified");
  if (!factor) return { ok: false, error: "No hay ningún método de verificación configurado" };

  const { data: challenge, error: cErr } = await sb.auth.mfa.challenge({ factorId: factor.id });
  if (cErr || !challenge) return { ok: false, error: "No se pudo generar el desafío" };
  const { error } = await sb.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: parsed.data });
  if (error) return { ok: false, error: "El código no es correcto" };

  revalidatePath("/admin");
  return { ok: true };
}

export async function disableMfaAction(formData: FormData): Promise<void> {
  await requireUser();
  const factorId = String(formData.get("factorId") ?? "");
  if (!factorId) return;
  const sb = await supabase();
  await sb.auth.mfa.unenroll({ factorId });
  await logAction("admin_user.mfa_disabled", { entity: "admin_user" });
  revalidatePath("/admin/seguridad");
}
