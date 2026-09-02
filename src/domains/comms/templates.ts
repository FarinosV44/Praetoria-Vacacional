/**
 * Issue #69 — guest message content, per property (tone) and locale (ES/EN).
 *
 * Pure: no I/O, no `server-only`. `dispatch.ts` renders one of these and hands
 * it to `sendEmail`. Content-accuracy rule (L-008): nothing invented — no fake
 * door codes or amenities. Practical access details the owner has entered live
 * in `checkinNote` / `checkoutNote`; without them the message points the guest
 * at the real contact channels.
 */

import { brandedEmail } from "@/domains/notifications/email";
import { company } from "@/content/company";
import { getPropertyById } from "@/domains/properties/registry";
import { formatDateLong } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { CommKind } from "./types";

export interface MessageContext {
  code: string;
  propertyId: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  /** Free-text access / arrival note the owner set for this property (optional). */
  checkinNote?: string | null;
  checkoutNote?: string | null;
  /** Absolute URL of the property page, for the review ask. */
  propertyUrl?: string | null;
}

export interface RenderedMessage {
  subject: string;
  html: string;
  text: string;
}

/** ES if we have no signal or the guest is in Spain; EN otherwise. */
export function inferLocale(country: string | null | undefined): Locale {
  if (!country) return "es";
  const c = country.trim().toLowerCase();
  return ["es", "esp", "españa", "espana", "spain"].includes(c) ? "es" : "en";
}

function greeting(name: string | null, locale: Locale): string {
  const n = name?.split(" ")[0] ?? "";
  return locale === "es" ? `Hola ${n},`.trim() : `Hi ${n},`.trim();
}

const CONTACT_ES = `Estamos disponibles en ${company.email} y por WhatsApp en ${company.whatsapp}.`;
const CONTACT_EN = `Reach us at ${company.email} or on WhatsApp at ${company.whatsapp}.`;

export function renderMessage(
  kind: CommKind,
  ctx: MessageContext,
  locale: Locale,
): RenderedMessage {
  const property = getPropertyById(ctx.propertyId);
  const name = property?.name ?? (locale === "es" ? "tu alojamiento" : "your stay");
  const area = property ? `${property.location.area} · ${property.location.region}` : "";
  const isSki = property?.experience === "ski";
  const g = greeting(ctx.guestName, locale);
  const inDate = formatDateLong(ctx.checkIn);
  const outDate = formatDateLong(ctx.checkOut);
  const contact = locale === "es" ? CONTACT_ES : CONTACT_EN;

  const build = (heading: string, intro: string, body: string[], footer: string): RenderedMessage => ({
    subject: `${heading} · ${name} · ${ctx.code}`,
    text: [g, "", intro, "", ...body, "", contact].filter((l) => l !== undefined).join("\n"),
    html: brandedEmail({
      heading,
      intro: `${g} ${intro}`,
      rows: [
        [locale === "es" ? "Localizador" : "Reference", `<strong>${ctx.code}</strong>`],
        [locale === "es" ? "Entrada" : "Check-in", inDate],
        [locale === "es" ? "Salida" : "Check-out", outDate],
      ],
      footer: `${body.join(" ")} ${footer}`.trim(),
    }),
  });

  switch (kind) {
    case "pre_arrival":
      return locale === "es"
        ? build(
            "Tu escapada se acerca",
            isSki
              ? `en unos días te esperamos en ${name}, en ${area}.`
              : `en unos días te esperamos en ${name}, en ${area}.`,
            [
              `Tu entrada es el ${inDate}. Cuéntanos a qué hora prevés llegar respondiendo a este correo para organizar la entrega de llaves.`,
              isSki
                ? "Si vas a esquiar, revisa el parte de Javalambre y reserva forfait con antelación en fin de semana."
                : "Si quieres, te podemos recomendar restaurantes de arroz y planes por la zona.",
            ],
            "",
          )
        : build(
            "Your trip is coming up",
            `we look forward to hosting you at ${name}, in ${area}, in a few days.`,
            [
              `Your check-in is on ${inDate}. Reply to this email with your estimated arrival time so we can arrange the keys.`,
              isSki
                ? "If you plan to ski, check the Javalambre snow report and book your lift pass ahead on weekends."
                : "We're happy to recommend rice restaurants and things to do nearby.",
            ],
            "",
          );

    case "checkin_info":
      return locale === "es"
        ? build(
            "Instrucciones para tu entrada de hoy",
            `hoy es tu día de entrada en ${name}.`,
            [
              ctx.checkinNote?.trim()
                ? ctx.checkinNote.trim()
                : `La entrada es a partir de las 16:00. Escríbenos cuando estés en camino y te indicamos cómo recoger las llaves y dónde aparcar.`,
              `Dirección: ${property?.location.area ?? ""}, ${property?.location.city ?? ""}.`,
            ],
            "",
          )
        : build(
            "Check-in details for today",
            `today is your check-in day at ${name}.`,
            [
              ctx.checkinNote?.trim()
                ? ctx.checkinNote.trim()
                : `Check-in is from 16:00. Message us when you're on your way and we'll tell you how to collect the keys and where to park.`,
              `Address: ${property?.location.area ?? ""}, ${property?.location.city ?? ""}.`,
            ],
            "",
          );

    case "checkout_reminder":
      return locale === "es"
        ? build(
            "Recordatorio de salida",
            `tu salida de ${name} es mañana, ${outDate}.`,
            [
              ctx.checkoutNote?.trim()
                ? ctx.checkoutNote.trim()
                : "La salida es antes de las 11:00. Deja las llaves donde acordamos y avísanos cuando salgas.",
              "Gracias por cuidar el alojamiento durante tu estancia.",
            ],
            "",
          )
        : build(
            "Check-out reminder",
            `your check-out from ${name} is tomorrow, ${outDate}.`,
            [
              ctx.checkoutNote?.trim()
                ? ctx.checkoutNote.trim()
                : "Check-out is before 11:00. Please leave the keys where we agreed and let us know when you leave.",
              "Thank you for taking care of the place during your stay.",
            ],
            "",
          );

    case "review_request":
      return locale === "es"
        ? build(
            "Gracias por tu visita",
            `esperamos que hayas disfrutado de ${name}.`,
            [
              "Si tienes un momento, nos ayuda mucho que compartas tu opinión sobre la estancia.",
              ctx.propertyUrl ? `Puedes dejarla desde la ficha del alojamiento: ${ctx.propertyUrl}` : "",
              "Si algo no fue como esperabas, respóndenos y lo revisamos.",
            ].filter(Boolean),
            "",
          )
        : build(
            "Thank you for staying with us",
            `we hope you enjoyed ${name}.`,
            [
              "If you have a moment, a short review of your stay helps us a lot.",
              ctx.propertyUrl ? `You can leave one from the property page: ${ctx.propertyUrl}` : "",
              "If anything fell short, just reply and we'll look into it.",
            ].filter(Boolean),
            "",
          );
  }
}
