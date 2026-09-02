"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { publicEnv, env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getRepository } from "@/lib/repository";
import { sendEmail, brandedEmail } from "@/domains/notifications/email";
import { reportError } from "@/lib/observability/report";
import { signPortalToken } from "./token";
import { findReservationForPortal, portalDataForToken } from "./service";

type Result = { ok: boolean; error?: string; message?: string };

const requestSchema = z.object({
  code: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(200),
});

export async function requestPortalLinkAction(_prev: unknown, formData: FormData): Promise<Result> {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  // Never reveal whether the pair matched.
  const generic = {
    ok: true,
    message:
      "Si los datos coinciden con una reserva, te hemos enviado un enlace para gestionarla. Revisa tu correo (y la carpeta de spam).",
  };
  if (!parsed.success) return generic;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit(`portal-link:${ip}`, 5, 10 * 60_000);
  if (!limited.ok) return generic;

  try {
    const reservation = await findReservationForPortal(parsed.data.code, parsed.data.email);
    if (reservation?.guestEmail) {
      const link = `${publicEnv.siteUrl.replace(/\/$/, "")}/mi-reserva/${signPortalToken(reservation.id)}`;
      const html = brandedEmail({
        heading: "Gestiona tu reserva",
        intro: `Aquí tienes el acceso a tu reserva ${reservation.code}.`,
        rows: [
          ["Localizador", reservation.code],
          ["Entrada", reservation.checkIn],
          ["Salida", reservation.checkOut],
        ],
        footer: `Abre este enlace para ver los detalles, indicar tu hora de llegada, hacer peticiones y descargar la factura:\n${link}\n\nEl enlace caduca en 7 días; puedes pedir otro cuando quieras.`,
      });
      await sendEmail(
        reservation.guestEmail,
        `Tu reserva ${reservation.code} · acceso`,
        html,
        `Gestiona tu reserva ${reservation.code}: ${link}`,
        { kind: "internal", reservationId: reservation.id },
      );
    }
  } catch (err) {
    reportError(err, { scope: "portal/request-link" });
  }
  return generic;
}

const arrivalSchema = z.object({
  token: z.string().min(10),
  arrivalTime: z.string().trim().max(20).optional(),
  message: z.string().trim().max(1500).optional(),
});

export async function submitPortalRequestAction(_prev: unknown, formData: FormData): Promise<Result> {
  const parsed = arrivalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Datos no válidos" };

  const data = await portalDataForToken(parsed.data.token);
  if (!data) return { ok: false, error: "El enlace no es válido o ha caducado." };

  const parts: string[] = [];
  if (parsed.data.arrivalTime) parts.push(`Hora de llegada prevista: ${parsed.data.arrivalTime}`);
  if (parsed.data.message) parts.push(`Petición del huésped: ${parsed.data.message}`);
  if (!parts.length) return { ok: false, error: "Escribe una hora de llegada o una petición." };

  const stamp = `[portal ${new Date().toISOString().slice(0, 16).replace("T", " ")}] ${parts.join(" · ")}`;
  const repo = getRepository();
  const current = data.reservation.notes ?? "";
  await repo
    .updateReservation(data.reservation.id, { notes: current ? `${current}\n${stamp}` : stamp })
    .catch((err) => reportError(err, { scope: "portal/submit" }));

  // Nudge the owner.
  const to = env.adminEmails[0];
  if (to) {
    await sendEmail(
      to,
      `Petición de huésped · ${data.reservation.code}`,
      brandedEmail({
        heading: "Nueva petición desde el portal del huésped",
        intro: `Reserva ${data.reservation.code} · ${data.propertyName}`,
        rows: parts.map((p) => ["", p] as [string, string]),
        footer: "Gestiónala en el panel de administración.",
      }),
      parts.join("\n"),
      { kind: "internal", reservationId: data.reservation.id },
    ).catch(() => undefined);
  }

  revalidatePath(`/mi-reserva/${parsed.data.token}`);
  return { ok: true, message: "Recibido. Nos pondremos en contacto si hace falta." };
}

export async function payBalanceAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const data = await portalDataForToken(token);
  if (!data || data.outstandingCents <= 0) redirect(`/mi-reserva/${token}`);

  if (!env.stripeConfigured || !data!.reservation.guestEmail) {
    redirect(`/mi-reserva/${token}?pago=no-disponible`);
  }

  const { createCheckoutSession } = await import("@/domains/payments/stripe");
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  let url: string | null = null;
  try {
    const session = await createCheckoutSession({
      reservationId: data!.reservation.id,
      propertyId: data!.reservation.propertyId,
      propertySlug: data!.propertySlug ?? "",
      propertyName: data!.propertyName,
      amountCents: data!.outstandingCents,
      currency: "EUR",
      guestEmail: data!.reservation.guestEmail!,
      checkIn: data!.reservation.checkIn,
      checkOut: data!.reservation.checkOut,
      successUrl: `${base}/mi-reserva/${token}?pago=ok`,
      cancelUrl: `${base}/mi-reserva/${token}?pago=cancelado`,
    });
    url = session.url;
  } catch (err) {
    reportError(err, { scope: "portal/pay" });
  }
  redirect(url ?? `/mi-reserva/${token}?pago=error`);
}
