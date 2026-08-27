import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { formatMoney, formatDateLong, nightsLabel, guestsLabel } from "@/lib/format";
import type { Reservation } from "@/domains/booking/types";
import { getPropertyById } from "@/domains/properties/registry";

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

async function send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const c = client();
  if (!c) {
    console.info(`[email:DEMO] → ${to} · ${subject}\n${text}`);
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
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
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
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#222">
      <h1 style="font-size:20px">${greetingLine}</h1>
      <p>Hola ${reservation.guestName ?? ""}, tu reserva está confirmada.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:6px 0;color:#666">Localizador</td><td style="text-align:right"><strong>${reservation.code}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Alojamiento</td><td style="text-align:right">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Entrada</td><td style="text-align:right">${formatDateLong(reservation.checkIn)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Salida</td><td style="text-align:right">${formatDateLong(reservation.checkOut)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Huéspedes</td><td style="text-align:right">${guestsLabel(reservation.guests)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Importe pagado</td><td style="text-align:right"><strong>${formatMoney(reservation.totalCents)}</strong></td></tr>
      </table>
      <p style="color:#666;font-size:13px">Pago procesado de forma segura por Stripe.</p>
    </div>`;

  return send(reservation.guestEmail, `Reserva confirmada · ${name} · ${reservation.code}`, html, text);
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
  return send(
    reservation.guestEmail,
    `No se pudo completar tu reserva · ${name}`,
    `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${text}</pre>`,
    text,
  );
}
