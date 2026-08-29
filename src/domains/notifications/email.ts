import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { formatMoney, formatDateLong, nightsLabel, guestsLabel } from "@/lib/format";
import type { Reservation } from "@/domains/booking/types";
import { getPropertyById } from "@/domains/properties/registry";
import { getRepository } from "@/lib/repository";
import type { EmailLogEntry } from "@/lib/repository/types";
import { company, companyAddressOneLine } from "@/content/company";

let resend: Resend | null = null;
function client() {
  if (!env.emailConfigured) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY!);
  return resend;
}

interface SendResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

async function send(
  to: string,
  subject: string,
  html: string,
  text: string,
  meta: { kind: EmailLogEntry["kind"]; reservationId?: string | null },
): Promise<SendResult> {
  const c = client();
  const log = (status: EmailLogEntry["status"], providerId?: string | null, error?: string | null) =>
    getRepository()
      .logEmail({
        reservationId: meta.reservationId ?? null,
        kind: meta.kind,
        recipient: to,
        status,
        providerId: providerId ?? null,
        error: error ?? null,
      })
      .catch(() => undefined);

  if (!c) {
    console.info(`[email:not-configured] → ${to} · ${subject}\n${text}`);
    await log("skipped", null, "Resend no configurado");
    return { ok: true, skipped: true };
  }
  try {
    const { data, error } = await c.emails.send({
      from: env.EMAIL_FROM,
      to,
      replyTo: env.EMAIL_REPLY_TO,
      subject,
      html,
      text,
    });
    if (error) {
      await log("failed", null, error.message);
      return { ok: false, error: error.message };
    }
    await log("sent", data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    await log("failed", null, message);
    return { ok: false, error: message };
  }
}

/** Confirmation email (issue #12). Property-specific tone; retried by caller. */
export async function sendReservationConfirmation(reservation: Reservation): Promise<SendResult> {
  if (!reservation.guestEmail) return { ok: false, error: "no guest email" };
  const property = getPropertyById(reservation.propertyId);
  const name = property?.name ?? "tu alojamiento";
  const isSki = property?.experience === "ski";
  const greetingLine = isSki
    ? "Tu escapada a la nieve de Javalambre está confirmada."
    : "Tu escapada al mar de Valencia está confirmada.";

  const lines = [
    `Hola ${reservation.guestName ?? ""},`.trim(),
    "",
    greetingLine,
    "",
    `Localizador: ${reservation.code}`,
    `Alojamiento: ${name}`,
    `Entrada: ${formatDateLong(reservation.checkIn)}`,
    `Salida: ${formatDateLong(reservation.checkOut)}`,
    `${nightsLabel(reservation.nights)} · ${guestsLabel(reservation.guests)}`,
    `Importe pagado: ${formatMoney(reservation.totalCents)}`,
    "",
    `Cualquier cosa que necesites, responde a este correo${env.EMAIL_REPLY_TO ? "" : ""}.`,
  ];
  const text = lines.join("\n");
  const rows: [string, string][] = [
    ["Localizador", `<strong>${reservation.code}</strong>`],
    ["Alojamiento", name],
    ["Entrada", formatDateLong(reservation.checkIn)],
    ["Salida", formatDateLong(reservation.checkOut)],
    ["Huéspedes", guestsLabel(reservation.guests)],
    ["Importe pagado", `<strong>${formatMoney(reservation.totalCents)}</strong>`],
  ];
  const html = brandedEmail({
    heading: greetingLine,
    intro: `Hola ${reservation.guestName ?? ""}, tu reserva está confirmada.`,
    rows,
    footer: "Pago procesado de forma segura por Stripe.",
  });

  return send(
    reservation.guestEmail,
    `Reserva confirmada · ${name} · ${reservation.code}`,
    html,
    text,
    { kind: "confirmation", reservationId: reservation.id },
  );
}

export async function sendPaymentFailedNotice(reservation: Reservation): Promise<SendResult> {
  if (!reservation.guestEmail) return { ok: false, error: "no guest email" };
  const property = getPropertyById(reservation.propertyId);
  const name = property?.name ?? "tu alojamiento";
  const text = `Hola ${reservation.guestName ?? ""},

No hemos podido completar el pago de tu reserva en ${name} (${reservation.code}) para las fechas
${formatDateLong(reservation.checkIn)} – ${formatDateLong(reservation.checkOut)}.

No se ha realizado ningún cargo. Puedes volver a intentarlo desde la web; las fechas siguen
disponibles hasta que otra persona las reserve.`;
  const html = brandedEmail({
    heading: "No se pudo completar tu reserva",
    intro: `Hola ${reservation.guestName ?? ""}, no hemos podido completar el pago de tu reserva en ${name} (${reservation.code}).`,
    rows: [
      ["Fechas", `${formatDateLong(reservation.checkIn)} – ${formatDateLong(reservation.checkOut)}`],
    ],
    footer:
      "No se ha realizado ningún cargo. Puedes volver a intentarlo desde la web mientras las fechas sigan libres.",
  });
  return send(reservation.guestEmail, `No se pudo completar tu reserva · ${name}`, html, text, {
    kind: "payment_failed",
    reservationId: reservation.id,
  });
}

/** Internal notification to the operator when a reservation is confirmed (issue #42). */
export async function sendInternalReservationNotice(reservation: Reservation): Promise<SendResult> {
  const to = env.adminEmails[0] ?? env.EMAIL_REPLY_TO;
  if (!to) return { ok: false, skipped: true, error: "no internal recipient (set ADMIN_EMAILS)" };
  const property = getPropertyById(reservation.propertyId);
  const name = property?.name ?? reservation.propertyId;
  const text = [
    `Nueva reserva confirmada — ${name}`,
    `Localizador: ${reservation.code}`,
    `Fechas: ${formatDateLong(reservation.checkIn)} – ${formatDateLong(reservation.checkOut)} (${nightsLabel(reservation.nights)})`,
    `Huéspedes: ${guestsLabel(reservation.guests)}`,
    `Importe: ${formatMoney(reservation.totalCents)}`,
    `Contacto: ${reservation.guestName ?? "—"} · ${reservation.guestEmail ?? "—"} · ${reservation.guestPhone ?? "—"}`,
  ].join("\n");
  const html = brandedEmail({
    heading: `Nueva reserva — ${name}`,
    intro: `Localizador <strong>${reservation.code}</strong>`,
    rows: [
      ["Fechas", `${formatDateLong(reservation.checkIn)} – ${formatDateLong(reservation.checkOut)}`],
      ["Estancia", `${nightsLabel(reservation.nights)} · ${guestsLabel(reservation.guests)}`],
      ["Importe", formatMoney(reservation.totalCents)],
      ["Huésped", `${reservation.guestName ?? "—"} · ${reservation.guestEmail ?? "—"}`],
      ["Teléfono", reservation.guestPhone ?? "—"],
    ],
    footer: "Gestiónala en el panel de administración.",
  });
  return send(to, `Nueva reserva · ${name} · ${reservation.code}`, html, text, {
    kind: "internal",
    reservationId: reservation.id,
  });
}

function brandedEmail(o: {
  heading: string;
  intro: string;
  rows: [string, string][];
  footer: string;
}): string {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f6fb;padding:24px 0">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e9f0">
      <div style="background:#1f3a6b;padding:18px 24px;color:#fff;font-weight:600;letter-spacing:.02em">
        Praetoria Vacacional
      </div>
      <div style="padding:24px;color:#222">
        <h1 style="font-size:20px;margin:0 0 8px">${o.heading}</h1>
        <p style="margin:0 0 16px;color:#444">${o.intro}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          ${o.rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:7px 0;color:#666;border-bottom:1px solid #eef1f6">${k}</td><td style="padding:7px 0;text-align:right;border-bottom:1px solid #eef1f6">${v}</td></tr>`,
            )
            .join("")}
        </table>
        <p style="color:#888;font-size:13px;margin-top:16px">${o.footer}</p>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #eef1f6;color:#9aa1ac;font-size:11px;line-height:1.5">
        ${company.legalName} (${company.legalForm}) · NIF ${company.taxId}<br />
        ${companyAddressOneLine()}
      </div>
    </div>
  </div>`;
}
