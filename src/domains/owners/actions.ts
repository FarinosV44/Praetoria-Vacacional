"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/observability/report";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { sendEmail, brandedEmail } from "@/domains/notifications/email";
import { sendPushToAdmins } from "@/domains/notifications/push";
import { ownerLeadFormSchema } from "./schema";
import { saveOwnerLead, setOwnerLeadStatus } from "./store";
import {
  OWNER_LICENCE,
  OWNER_LOCATIONS,
  OWNER_ZONES,
  labelFor,
  type OwnerLead,
  type OwnerLeadStatus,
} from "./types";

export type OwnerLeadResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Public "Propietarios" form → stored lead + email and push to the team. */
export async function submitOwnerLeadAction(
  _prev: unknown,
  formData: FormData,
): Promise<OwnerLeadResult> {
  const raw = Object.fromEntries(formData);

  // Bots fill the hidden field: pretend success, store nothing.
  if (typeof raw.website === "string" && raw.website.length > 0) return { ok: true };

  const parsed = ownerLeadFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit(`owner-lead:${ip}`, 5, 60 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: "Has enviado varias solicitudes seguidas. Inténtalo más tarde o llámanos." };
  }

  const d = parsed.data;
  const lead: OwnerLead = {
    id: `${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`,
    name: d.name,
    phone: d.phone,
    email: d.email.toLowerCase(),
    zone: d.zone,
    location: d.location,
    bedrooms: d.bedrooms,
    licence: d.licence,
    onPlatforms: d.onPlatforms,
    message: d.message,
    status: "nuevo",
    source: "/propietarios",
    createdAt: new Date().toISOString(),
  };

  try {
    await saveOwnerLead(lead);
  } catch (err) {
    reportError(err, { scope: "owners/save" });
    return { ok: false, error: "No hemos podido guardar tu solicitud. Llámanos o escríbenos por WhatsApp." };
  }

  // Notifications never block the owner's confirmation.
  const zone = labelFor(OWNER_ZONES, lead.zone);
  const rows: [string, string][] = [
    ["Nombre", lead.name],
    ["Teléfono", lead.phone],
    ["Correo", lead.email],
    ["Zona", zone],
    ["Ubicación", labelFor(OWNER_LOCATIONS, lead.location)],
    ["Dormitorios", lead.bedrooms === null ? "—" : String(lead.bedrooms)],
    ["Licencia turística", labelFor(OWNER_LICENCE, lead.licence)],
    ["Ya en Booking/Airbnb", lead.onPlatforms ? "Sí" : "No"],
    ["Mensaje", lead.message || "—"],
  ];
  const to = env.adminEmails[0] ?? env.EMAIL_REPLY_TO;
  await Promise.allSettled([
    to
      ? sendEmail(
          to,
          `Nuevo propietario interesado · ${zone} · ${lead.name}`,
          brandedEmail({
            heading: "Nuevo propietario interesado en la gestión",
            intro: `Solicitud recibida desde la página <strong>Propietarios</strong>.`,
            rows,
            footer: "Tienes todas las solicitudes en el panel: Administración → Propietarios.",
          }),
          rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
          { kind: "internal" },
        )
      : Promise.resolve(),
    sendPushToAdmins({
      title: "Nuevo propietario interesado",
      body: `${lead.name} · ${zone} · ${lead.phone}`,
      url: "/admin/propietarios",
      tag: `owner-${lead.id}`,
    }),
  ]);

  revalidatePath("/admin/propietarios");
  return { ok: true };
}

const STATUSES: OwnerLeadStatus[] = ["nuevo", "contactado", "propuesta", "cerrado", "descartado"];

/** Admin: move a lead along the pipeline. */
export async function setOwnerLeadStatusAction(formData: FormData): Promise<void> {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
  await assertCapability("content.write");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OwnerLeadStatus;
  if (!id || !STATUSES.includes(status)) return;
  await setOwnerLeadStatus(id, status);
  revalidatePath("/admin/propietarios");
}
