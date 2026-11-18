"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import {
  passwordProblem,
  requestOwnerPasswordReset,
  revokeOwnerSessions,
  setOwnerPassword,
  signInOwner,
  signOutOwner,
} from "../auth";
import { getOwnerContext } from "../context";
import { audit } from "../service";

export type AccountResult =
  { ok: true; message?: string; demoUrl?: string } | { ok: false; error: string };

/** Solo rutas internas de la carpeta: evita redirecciones abiertas. */
function safeNext(raw: unknown): string {
  const n = typeof raw === "string" ? raw : "";
  return /^\/mi-cuenta\/tramites(\/[\w\-/]*)?$/.test(n) ? n : "/mi-cuenta/tramites";
}

async function ipKey(prefix: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}

export async function ownerLoginAction(_prev: unknown, formData: FormData): Promise<AccountResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const limited = await rateLimit(await ipKey("tramites-login"), 10, 15 * 60_000);
  if (!limited.ok) return { ok: false, error: "Demasiados intentos. Espera unos minutos." };
  const r = await signInOwner(email, password);
  if (!r.ok) return { ok: false, error: r.error };
  if (r.needsVerification)
    return { ok: false, error: "Confirma primero tu correo con el enlace que te enviamos." };
  redirect(safeNext(formData.get("next")));
}

export async function ownerLogoutAction(): Promise<void> {
  await signOutOwner();
  redirect("/mi-cuenta/acceso");
}

export async function ownerRevokeSessionsAction(): Promise<void> {
  const ctx = await getOwnerContext();
  if (!ctx) redirect("/mi-cuenta/acceso");
  await audit(
    { type: "owner", id: ctx.session.userId, label: "Cliente" },
    "sesiones.cerrar",
    ctx.account.id,
    "cuenta",
    ctx.account.id,
    {},
  );
  await revokeOwnerSessions(ctx.session.userId);
  redirect("/mi-cuenta/acceso");
}

export async function ownerForgotAction(
  _prev: unknown,
  formData: FormData,
): Promise<AccountResult> {
  const email = String(formData.get("email") ?? "").trim();
  const limited = await rateLimit(await ipKey("tramites-forgot"), 5, 60 * 60_000);
  if (!limited.ok) return { ok: false, error: "Demasiadas solicitudes. Inténtalo más tarde." };
  const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const r = await requestOwnerPasswordReset(
    email,
    `${site}/mi-cuenta/acceso/confirmar?next=/mi-cuenta/acceso/nueva-clave`,
  );
  return {
    ok: true,
    message:
      "Si el correo tiene una carpeta, te hemos enviado un enlace para crear una contraseña nueva.",
    ...(r.demoResetToken
      ? { demoUrl: `/mi-cuenta/acceso/nueva-clave?token=${r.demoResetToken}` }
      : {}),
  };
}

export async function ownerResetAction(_prev: unknown, formData: FormData): Promise<AccountResult> {
  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };
  const token = String(formData.get("token") ?? "") || undefined;
  const r = await setOwnerPassword(password, token);
  if (!r.ok) return { ok: false, error: r.error ?? "No se pudo cambiar la contraseña." };
  redirect("/mi-cuenta/tramites");
}
