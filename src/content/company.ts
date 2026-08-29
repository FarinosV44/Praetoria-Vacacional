/**
 * PRAETORIA, S.L. — single source of truth for the operating company's
 * corporate and contact data (issue #56, Part A).
 *
 * Every surface that identifies who runs this site and its bookings reads from
 * HERE: the legal notice, the footer, the contact page, the Organization
 * JSON-LD, transactional emails and the invoices issued from the intranet.
 * Never copy these values into another file — import `company` and the helpers
 * below instead.
 */

export const company = {
  /** Razón social. */
  legalName: "PRAETORIA, S.L.",
  /** Forma jurídica. */
  legalForm: "Sociedad Limitada",
  /** Nombre comercial con el que opera la web de reservas. */
  tradeName: "Praetoria Vacacional",
  /** NIF/CIF. */
  taxId: "B21810452",

  registeredOffice: {
    street: "Calle Pintor Francisco Ribalta, 4A",
    postalCode: "46540",
    city: "El Puig de Santa Maria",
    province: "Valencia",
    country: "España",
    /** ISO 3166-1 alpha-2, para datos estructurados. */
    countryCode: "ES",
  },

  email: "info@praetoriaabogados.com",
  phone: "+34 649181290",
  whatsapp: "+34 649181290",

  mercantileRegistry: {
    office: "Registro Mercantil de Valencia",
    section: "8",
    sheet: "V-225491",
    entry: "1.ª",
    irus: "1000449168073",
    registrationYear: "2025",
  },

  /** Fecha de comienzo de operaciones (ISO + etiqueta para mostrar). */
  operationsStartDate: "2025-04-03",
  operationsStartDateLabel: "3 de abril de 2025",

  soleDirector: "Juan José Farinós Ibáñez",
} as const;

/** «Calle …, 46540 El Puig de Santa Maria, Valencia, España» */
export function companyAddressOneLine(): string {
  const o = company.registeredOffice;
  return `${o.street}, ${o.postalCode} ${o.city}, ${o.province}, ${o.country}`;
}

/** Frase registral reutilizable en aviso legal, facturas y pies de página. */
export function companyRegistryLine(): string {
  const r = company.mercantileRegistry;
  return (
    `Inscrita en el ${r.office}, sección ${r.section}, hoja ${r.sheet}, ` +
    `inscripción ${r.entry}, con IRUS ${r.irus}.`
  );
}

/**
 * Párrafo legal completo (base del issue, adaptado). Usado en el aviso legal y
 * disponible para textos legales de las facturas.
 */
export function companyLegalParagraph(): string {
  const r = company.mercantileRegistry;
  return (
    `El presente sitio web es titularidad de ${company.legalName}, sociedad con ` +
    `NIF ${company.taxId} y domicilio social en ${companyAddressOneLine()}. ` +
    `La sociedad se encuentra inscrita en el ${r.office}, sección ${r.section}, ` +
    `hoja ${r.sheet}, inscripción ${r.entry}, con IRUS ${r.irus}. ` +
    `Correo electrónico: ${company.email}. Teléfono y WhatsApp: ${company.phone}.`
  );
}

/** Identificación corta para pies (footer del sitio y de los emails). */
export function companyShortIdentification(): string {
  return `${company.legalName} · NIF ${company.taxId}`;
}
