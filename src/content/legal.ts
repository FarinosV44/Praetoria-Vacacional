/**
 * Centralised legal + booking-conditions content (issue #20, issue #56 Part A).
 *
 * The company identification (razón social, NIF, domicilio social, datos
 * registrales, contacto) lives in `src/content/company.ts` and is imported
 * here — never duplicated. Binding legal clauses and the tourist-registry
 * licence numbers are owner-supplied facts and are not invented.
 */

import {
  company,
  companyAddressOneLine,
  companyLegalParagraph,
} from "@/content/company";

const r = company.mercantileRegistry;

/**
 * Back-compat contact/identification view over `company`. Existing consumers
 * (contact page, error page, SEO inventory) read `operator.*`.
 */
export const operator = {
  legalName: company.legalName,
  tradeName: company.tradeName,
  taxId: company.taxId,
  address: companyAddressOneLine(),
  email: company.email,
  phone: company.phone,
  whatsapp: company.whatsapp,
  touristRegistry:
    "Javalambre Mountain SuperSki (Camarena de la Sierra, Teruel): VUTE-23-0450 / VUTE-23-045. " +
    "Valencia Frente al Mar (Mareny de Barraquetes, Sueca): VT-56539-V2 / VT-56539-V.",
};

export interface LegalDoc {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
}

const lastUpdated = "2026-08-27";

export const legalDocs: Record<string, LegalDoc> = {
  "aviso-legal": {
    slug: "aviso-legal",
    title: "Aviso legal",
    updated: lastUpdated,
    intro:
      "Información general sobre el titular de este sitio web y las condiciones de uso, conforme a la normativa española y europea aplicable.",
    sections: [
      {
        heading: "Titular del sitio web",
        body: [
          companyLegalParagraph(),
          `Forma jurídica: ${company.legalForm}. Nombre comercial: «${company.tradeName}».`,
        ],
      },
      {
        heading: "Datos registrales",
        body: [
          `Registro Mercantil: ${r.office}.`,
          `Sección ${r.section}, hoja ${r.sheet}, inscripción ${r.entry}. IRUS ${r.irus}.`,
          `Año de inscripción: ${r.registrationYear}. Fecha de comienzo de operaciones: ${company.operationsStartDateLabel}.`,
          `Administrador único: ${company.soleDirector}.`,
        ],
      },
      {
        heading: "Registro turístico de los alojamientos",
        body: [operator.touristRegistry],
      },
      {
        heading: "Objeto",
        body: [
          "Este sitio web ofrece información y reserva directa de los alojamientos vacacionales gestionados por el titular.",
        ],
      },
      {
        heading: "Propiedad intelectual",
        body: [
          "Los textos, imágenes y elementos gráficos son propiedad del titular o se utilizan con autorización. No está permitida su reproducción sin consentimiento.",
        ],
      },
    ],
  },
  privacidad: {
    slug: "privacidad",
    title: "Política de privacidad",
    updated: lastUpdated,
    intro:
      "Cómo tratamos los datos personales que nos facilitas al reservar o contactar, conforme al RGPD y la LOPDGDD.",
    sections: [
      {
        heading: "Responsable del tratamiento",
        body: [
          `${company.legalName} (NIF ${company.taxId}), con domicilio social en ${companyAddressOneLine()}.`,
          `Contacto: ${company.email} · ${company.phone}.`,
        ],
      },
      {
        heading: "Finalidad",
        body: [
          "Gestionar tu reserva y la comunicación relacionada con la estancia (confirmación, información previa y posterior).",
          "Cumplir obligaciones legales, incluida la comunicación de datos de viajeros a las autoridades cuando la normativa lo exija.",
        ],
      },
      {
        heading: "Legitimación y conservación",
        body: [
          "La base es la ejecución del contrato de alojamiento y el cumplimiento de obligaciones legales.",
          "Conservamos los datos durante los plazos exigidos por la legislación fiscal y turística.",
        ],
      },
      {
        heading: "Destinatarios",
        body: [
          "Proveedor de pago (Stripe) para procesar el cobro. Proveedor de envío de correo para las confirmaciones. No se ceden datos a terceros con fines comerciales.",
        ],
      },
      {
        heading: "Derechos",
        body: [
          `Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${operator.email}.`,
        ],
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Política de cookies",
    updated: lastUpdated,
    intro: "Qué cookies utiliza este sitio y cómo puedes gestionarlas.",
    sections: [
      {
        heading: "Cookies técnicas",
        body: ["Necesarias para el funcionamiento del sitio y del proceso de reserva. No requieren consentimiento."],
      },
      {
        heading: "Cookies analíticas",
        body: [
          "Si se activa la analítica (Google Analytics 4), se utilizan cookies de medición únicamente con tu consentimiento y con la IP anonimizada. Puedes retirar el consentimiento en cualquier momento.",
        ],
      },
    ],
  },
  "condiciones-reserva": {
    slug: "condiciones-reserva",
    title: "Condiciones de reserva",
    updated: lastUpdated,
    intro:
      "Condiciones aplicables a las reservas directas realizadas a través de esta web. La política de cancelación concreta se indica en la página de cada alojamiento y en el checkout antes del pago.",
    sections: [
      {
        heading: "Precio y pago",
        body: [
          "El precio mostrado antes del pago es el precio total de la estancia, con todos los cargos aplicables desglosados y sin comisiones de intermediarios.",
          "El pago se realiza con tarjeta a través de Stripe. La reserva solo queda confirmada cuando el pago se ha completado correctamente.",
        ],
      },
      {
        heading: "Confirmación",
        body: [
          "Tras el pago recibirás un correo con el localizador de la reserva y los datos de la estancia. Las fechas quedan bloqueadas automáticamente.",
        ],
      },
      {
        heading: "Cancelación",
        body: [
          "Cada alojamiento tiene su propia política de cancelación, que se muestra en su página y en el checkout. Las devoluciones, cuando procedan, se realizan por el mismo medio de pago.",
        ],
      },
      {
        heading: "Normas de la estancia",
        body: [
          "El número de huéspedes no puede superar la capacidad indicada. Las condiciones específicas de cada alojamiento (horarios de entrada y salida, fianza si la hubiera, mascotas) se comunicarán antes de la llegada.",
        ],
      },
    ],
  },
};

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return legalDocs[slug];
}
export function legalSlugs(): string[] {
  return Object.keys(legalDocs);
}
