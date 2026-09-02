"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { publicEnv } from "@/lib/env";
import { isAdminAuthenticated } from "./auth";
import { getAdminContext } from "./context";
import { assertCapability } from "./roles";
import { logAction } from "./audit";
import { generateInviteToken } from "./users";
import { reportError } from "@/lib/observability/report";

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function guard() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability("settings.write");
}

const inviteSchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().max(120).optional(),
  role: z.enum(["admin", "gestion", "lectura"]),
});

export async function inviteAdminUserAction(_prev: unknown, formData: FormData): Promise<Result> {
  await guard();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const repo = getRepository();
  const ctx = await getAdminContext();
  const existing = await repo.getAdminUserByEmail(parsed.data.email).catch(() => null);
  if (existing) return { ok: false, error: "Ya existe un usuario con ese correo" };

  const invite = generateInviteToken();
  let authUserId: string | undefined;
  let emailNote = "";

  if (env.supabaseConfigured) {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/admin");
      const redirectTo = `${publicEnv.siteUrl.replace(/\/$/, "")}/admin/login`;
      const { data, error } = await supabaseAdmin().auth.admin.inviteUserByEmail(parsed.data.email, {
        redirectTo,
      });
      if (error) throw error;
      authUserId = data.user?.id;
      emailNote = "Se ha enviado un correo de invitación de Supabase.";
    } catch (err) {
      reportError(err, { scope: "admin/invite" });
      return {
        ok: false,
        error:
          "Supabase rechazó la invitación. Revisa que Auth esté habilitado y el dominio de correo verificado.",
      };
    }
  } else {
    emailNote =
      "Modo demostración: sin Supabase no se envía correo. El usuario queda pendiente hasta que se conecte Auth.";
  }

  try {
    await repo.createAdminUser({
      id: authUserId,
      email: parsed.data.email,
      fullName: parsed.data.fullName ?? null,
      role: parsed.data.role,
      invitedBy: ctx?.userId ?? null,
      inviteTokenHash: invite.hash,
      inviteExpiresAt: invite.expiresAt,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ADMIN_USER_EMAIL_TAKEN") {
      return { ok: false, error: "Ya existe un usuario con ese correo" };
    }
    throw err;
  }

  await logAction("admin_user.invite", { entity: "admin_user", entityId: parsed.data.email, meta: { role: parsed.data.role } });
  revalidatePath("/admin/usuarios");
  return { ok: true, message: emailNote };
}

const idSchema = z.string().min(1);

async function loadTarget(id: string) {
  const user = await getRepository().getAdminUserById(id);
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

/** Guard against an admin removing the last remaining admin / locking themselves out. */
async function wouldOrphanAdmins(targetId: string, stillAdmin: boolean): Promise<boolean> {
  const users = await getRepository().listAdminUsers();
  const activeAdmins = users.filter(
    (u) => u.active && !u.inviteTokenHash && u.role === "admin" && u.id !== targetId,
  );
  return activeAdmins.length === 0 && !stillAdmin;
}

export async function updateAdminUserRoleAction(formData: FormData): Promise<void> {
  await guard();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  const role = z.enum(["admin", "gestion", "lectura"]).parse(String(formData.get("role") ?? ""));
  if (await wouldOrphanAdmins(id, role === "admin")) throw new Error("Debe quedar al menos un administrador activo");
  await getRepository().updateAdminUser(id, { role });
  await logAction("admin_user.role", { entity: "admin_user", entityId: id, meta: { role } });
  revalidatePath("/admin/usuarios");
}

export async function setAdminUserActiveAction(formData: FormData): Promise<void> {
  await guard();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  const active = String(formData.get("active") ?? "") === "true";
  const target = await loadTarget(id);
  if (!active && (await wouldOrphanAdmins(id, false)) && target.role === "admin") {
    throw new Error("Debe quedar al menos un administrador activo");
  }
  await getRepository().updateAdminUser(id, { active });
  if (!active) await getRepository().revokeAdminUserSessions(id);
  await logAction(active ? "admin_user.activate" : "admin_user.deactivate", {
    entity: "admin_user",
    entityId: id,
  });
  revalidatePath("/admin/usuarios");
}

export async function setAdminUserMfaRequiredAction(formData: FormData): Promise<void> {
  await guard();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  const required = String(formData.get("required") ?? "") === "true";
  await getRepository().updateAdminUser(id, { mfaRequired: required });
  await logAction("admin_user.mfa_required", { entity: "admin_user", entityId: id, meta: { required } });
  revalidatePath("/admin/usuarios");
}

export async function revokeAdminUserSessionsAction(formData: FormData): Promise<void> {
  await guard();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  await getRepository().revokeAdminUserSessions(id);
  if (env.supabaseConfigured) {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/admin");
      await supabaseAdmin().auth.admin.signOut(id, "global");
    } catch (err) {
      reportError(err, { scope: "admin/revoke" });
    }
  }
  await logAction("admin_user.revoke_sessions", { entity: "admin_user", entityId: id });
  revalidatePath("/admin/usuarios");
}

export async function deleteAdminUserAction(formData: FormData): Promise<void> {
  await guard();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  const target = await loadTarget(id);
  if (target.role === "admin" && (await wouldOrphanAdmins(id, false))) {
    throw new Error("Debe quedar al menos un administrador activo");
  }
  await getRepository().deleteAdminUser(id);
  if (env.supabaseConfigured) {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/admin");
      await supabaseAdmin().auth.admin.deleteUser(id);
    } catch {
      /* the auth user may not exist (DEMO-created row) */
    }
  }
  await logAction("admin_user.delete", { entity: "admin_user", entityId: target.email });
  revalidatePath("/admin/usuarios");
}
