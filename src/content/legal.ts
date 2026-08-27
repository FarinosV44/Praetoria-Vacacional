/**
 * Centralised legal + booking-conditions content (issue #20).
 *
 * IMPORTANT: no company registration data, licence numbers or binding legal
 * clauses are invented. Fields the owner must supply are marked `[[PENDIENTE: …]]`
 * and rendered visibly so they cannot ship unnoticed. Fill `operator` and the
 * pending blocks, then this content is production-ready.
 */

export const operator = {
  legalName: "[[PENDIENTE: razón social del titular]]",
  tradeName: "Praetoria Vacacional",
  taxId: "[[PENDIENTE: NIF/CIF]]",
  address: "[[PENDIENTE: domicilio fiscal]]",
  email: "[[PENDIENTE: email de contacto legal]]",
  phone: "[[PENDIENTE: teléfono de contacto]]",
  touristRegistry: "[[PENDIENTE: números de registro turístico por alojamiento]]",
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
        heading: "Titular",
        body: [
          `Titular: ${operator.legalName} (nombre comercial ${operator.tradeName}).`,
          `NIF/CIF: ${operator.taxId}. Domicilio: ${operator.address}.`,
          `Contacto: ${operator.email} · ${operator.phone}.`,
          `Registro turístico de los alojamientos: ${operator.touristRegistry}.`,
        ],
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
        body: [`${operator.legalName}. Contacto: ${operator.email}.`],
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
          "El precio mostrado antes del pago es el precio total de la estancia, con la limpieza incluida y sin comisiones de intermediarios.",
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
