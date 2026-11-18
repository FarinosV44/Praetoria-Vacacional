import "server-only";
import { env } from "@/lib/env";
import { company } from "@/content/company";
import { brandedEmail, sendEmail } from "@/domains/notifications/email";
import { formatMoney } from "@/lib/format";
import type { ServiceOrder } from "./types";

/**
 * Correos del servicio de trámites (#177): avisan y enlazan a «Mi carpeta».
 * NUNCA incluyen datos de viajeros, números de documento ni el contenido de los
 * archivos: solo la referencia del expediente y el enlace seguro (que exige
 * iniciar sesión).
 */

const site = () => env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const folder = (path = "") => `${site()}/mi-cuenta/tramites${path}`;

function send(
  to: string,
  subject: string,
  heading: string,
  intro: string,
  rows: [string, string][],
  footer: string,
) {
  const html = brandedEmail({ heading, intro, rows, footer });
  const text = [heading, "", intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", footer].join(
    "\n",
  );
  return sendEmail(to, subject, html, text, { kind: "tramites" });
}

const FOOTER = `Este aviso no contiene datos personales de tus viajeros ni documentos. Entra en tu carpeta para ver el detalle. ${company.tradeName} · ${company.phone}`;

export function emailVerifyAccount(to: string, link: string) {
  return send(
    to,
    "Confirma tu correo para activar tu carpeta",
    "Confirma tu correo",
    "Pulsa el enlace para confirmar tu correo. Después podrás revisar tu encargo y pagarlo.",
    [["Confirmar", link]],
    "Si no has sido tú, ignora este mensaje.",
  );
}

export function emailOrderPaid(to: string, order: ServiceOrder) {
  return send(
    to,
    `Encargo ${order.reference} confirmado`,
    "Hemos recibido tu pago",
    "Tu encargo está confirmado. Ahora revisamos la documentación de cada vivienda; si falta algo te lo pediremos en tu carpeta.",
    [
      ["Referencia", order.reference],
      ["Importe", formatMoney(order.totalCents)],
      ["Tu carpeta", folder()],
    ],
    FOOTER,
  );
}

export function emailInternalNewOrder(order: ServiceOrder, kind: "pagado" | "solicitud_especial") {
  return send(
    company.email,
    `[Trámites] ${kind === "pagado" ? "Nuevo encargo pagado" : "Nueva solicitud especial"} ${order.reference}`,
    kind === "pagado" ? "Nuevo encargo pagado" : "Nueva solicitud de revisión",
    "Tienes un expediente nuevo en «Servicios a propietarios».",
    [
      ["Referencia", order.reference],
      ["Importe", formatMoney(order.totalCents)],
      ["Panel", `${site()}/admin/tramites`],
    ],
    "Aviso interno.",
  );
}

export function emailDocumentsRequested(to: string, filingRef: string, filingId: string) {
  return send(
    to,
    `Necesitamos documentación · ${filingRef}`,
    "Nos falta documentación",
    "Para seguir con tu trámite necesitamos que subas algunos documentos en tu carpeta. Allí verás exactamente qué falta.",
    [
      ["Expediente", filingRef],
      ["Subir documentos", folder(`/expedientes/${filingId}`)],
    ],
    FOOTER,
  );
}

export function emailFilingUpdate(
  to: string,
  filingRef: string,
  filingId: string,
  statusLabel: string,
) {
  return send(
    to,
    `Tu trámite ${filingRef}: ${statusLabel.toLowerCase()}`,
    `Trámite ${statusLabel.toLowerCase()}`,
    "Hay novedades en uno de tus trámites. El justificante, cuando lo haya, está en tu carpeta.",
    [
      ["Expediente", filingRef],
      ["Estado", statusLabel],
      ["Ver en tu carpeta", folder(`/expedientes/${filingId}`)],
    ],
    FOOTER,
  );
}

export function emailNewMessage(to: string) {
  return send(
    to,
    "Tienes un mensaje nuevo en tu carpeta",
    "Mensaje nuevo",
    "El equipo te ha escrito en tu carpeta.",
    [["Leer el mensaje", folder("/mensajes")]],
    FOOTER,
  );
}

export function emailInternalOwnerActivity(subject: string, accountId: string) {
  return send(
    company.email,
    `[Trámites] ${subject}`,
    subject,
    "Hay actividad de un cliente en «Servicios a propietarios».",
    [["Ficha del cliente", `${site()}/admin/tramites/clientes/${accountId}`]],
    "Aviso interno.",
  );
}
