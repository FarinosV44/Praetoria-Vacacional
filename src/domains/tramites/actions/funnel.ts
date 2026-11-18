"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/observability/report";
import { getRepository } from "@/lib/repository";
import { sendEmail, brandedEmail } from "@/domains/notifications/email";
import { company } from "@/content/company";
import { engagementSchema } from "../schema";
import { passwordProblem, signUpOwner, getOwnerSession } from "../auth";
import { getOwnerContext } from "../context";
import { createEngagement } from "../service";
import { saltedHash } from "../crypto";
import { contratacionActiva } from "../gate";
import { emailVerifyAccount } from "../emails";

export type FunnelResult =
  | { ok: true; next: "pagar"; orderId: string }
  | { ok: true; next: "verificar"; demoVerifyUrl?: string }
  | { ok: true; next: "solicitud" }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function clientMeta() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { ip, ipHash: saltedHash(ip), userAgent: h.get("user-agent") };
}

/**
 * Alta online (#175): valida, crea cuenta + viviendas + pedido con el precio
 * del servidor y devuelve el siguiente paso. Nunca acepta importes del cliente.
 */
export async function submitEngagementAction(payload: unknown): Promise<FunnelResult> {
  if (!contratacionActiva())
    return { ok: false, error: "La contratación online todavía no está disponible." };

  const parsed = engagementSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      fieldErrors,
    };
  }
  const input = parsed.data;
  const meta = await clientMeta();
  const limited = await rateLimit(`tramites-alta:${meta.ip}`, 8, 60 * 60_000);
  if (!limited.ok)
    return { ok: false, error: "Demasiados intentos seguidos. Inténtalo más tarde o escríbenos." };

  try {
    // ¿Ya tiene carpeta y sesión? Añadimos el encargo a su cuenta.
    const ctx = await getOwnerContext();
    if (ctx) {
      const r = await createEngagement(
        input,
        { userId: ctx.session.userId, existingAccountId: ctx.account.id, emailVerified: true },
        meta,
      );
      if (!r.ok) return { ok: false, error: r.error };
      return r.orderId
        ? { ok: true, next: "pagar", orderId: r.orderId }
        : { ok: true, next: "solicitud" };
    }
    const session = await getOwnerSession();
    if (session)
      return {
        ok: false,
        error: "Confirma tu correo con el enlace que te enviamos y vuelve a entrar.",
      };

    const problem = passwordProblem(input.password);
    if (problem) return { ok: false, error: problem, fieldErrors: { password: problem } };

    const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const signup = await signUpOwner(
      input.owner.email,
      input.password,
      `${site}/mi-cuenta/acceso/confirmar?next=/mi-cuenta/tramites/pagos`,
    );
    if (!signup.ok) return { ok: false, error: signup.error };
    // Correo ya registrado: misma respuesta que un alta normal, sin crear nada.
    if (signup.existing) return { ok: true, next: "verificar" };

    const r = await createEngagement(
      input,
      { userId: signup.userId, existingAccountId: null, emailVerified: !signup.needsVerification },
      meta,
    );
    if (!r.ok) return { ok: false, error: r.error };

    if (signup.demoVerifyToken) {
      const url = `/mi-cuenta/acceso/confirmar?token=${signup.demoVerifyToken}&next=/mi-cuenta/tramites/pagos`;
      await emailVerifyAccount(input.owner.email, `${site}${url}`).catch(() => undefined);
      return { ok: true, next: "verificar", demoVerifyUrl: url };
    }
    if (signup.needsVerification) return { ok: true, next: "verificar" };
    return r.orderId
      ? { ok: true, next: "pagar", orderId: r.orderId }
      : { ok: true, next: "solicitud" };
  } catch (err) {
    reportError(err, { scope: "tramites/alta" });
    return {
      ok: false,
      error: "No hemos podido completar el alta. Inténtalo de nuevo o escríbenos por WhatsApp.",
    };
  }
}

// ------------------------------------------------------------- prealta ----

const prealtaSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre.").max(120),
  email: z.string().trim().toLowerCase().email("El correo no es válido.").max(160),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s]{9,16}$/, "Indica un teléfono válido."),
  municipality: z.string().trim().min(2, "Indica dónde está la vivienda.").max(80),
  properties: z.coerce.number().int().min(1).max(200),
  services: z.string().trim().max(400).optional().default(""),
  message: z.string().trim().max(1500).optional().default(""),
  consent: z.literal("on", { message: "Necesitamos tu permiso para contactarte." }),
  website: z.string().max(0).optional(),
});

export type PrealtaResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export interface TramitesLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  municipality: string;
  properties: number;
  services: string;
  message: string;
  createdAt: string;
  status: "nuevo" | "contactado" | "alta" | "descartado";
}

/** Prealta sin cobro mientras la contratación online no esté activada. */
export async function submitPrealtaAction(
  _prev: unknown,
  formData: FormData,
): Promise<PrealtaResult> {
  const raw = Object.fromEntries(formData);
  if (typeof raw.website === "string" && raw.website) return { ok: true };
  const parsed = prealtaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors };
  }
  const { ip } = await clientMeta();
  const limited = await rateLimit(`tramites-prealta:${ip}`, 5, 60 * 60_000);
  if (!limited.ok)
    return { ok: false, error: "Has enviado varias solicitudes seguidas. Inténtalo más tarde." };

  const d = parsed.data;
  const lead: TramitesLead = {
    id: `${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`,
    name: d.name,
    email: d.email,
    phone: d.phone,
    municipality: d.municipality,
    properties: d.properties,
    services: d.services,
    message: d.message,
    createdAt: new Date().toISOString(),
    status: "nuevo",
  };
  try {
    await getRepository().setContentOverride(`lead:tramites:${lead.id}`, lead);
    const rows: [string, string][] = [
      ["Nombre", lead.name],
      ["Teléfono", lead.phone],
      ["Email", lead.email],
      ["Municipio", lead.municipality],
      ["Viviendas", String(lead.properties)],
      ["Le interesa", lead.services || "—"],
    ];
    await sendEmail(
      company.email,
      `[Trámites] Prealta · ${lead.municipality}`,
      brandedEmail({
        heading: "Nueva prealta de trámites",
        intro: lead.message || "Sin mensaje.",
        rows,
        footer: "Llega desde /gestion-tramites-alquiler-turistico.",
      }),
      rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      { kind: "tramites" },
    ).catch(() => undefined);
  } catch (err) {
    reportError(err, { scope: "tramites/prealta" });
    return { ok: false, error: "No se pudo enviar. Llámanos o escríbenos por WhatsApp." };
  }
  return { ok: true };
}
