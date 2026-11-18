import { company, companyAddressOneLine } from "@/content/company";

/**
 * Textos legales del servicio de trámites (#178). Cada documento lleva una
 * versión: el cliente acepta una versión concreta y se guarda con fecha y hora.
 * Si cambia el contenido, se sube la versión (los encargos anteriores conservan
 * la que aceptaron).
 *
 * Estado: borrador para revisión del responsable legal antes de activar la
 * contratación en producción (ver docs/PROGRESS.md, checklist de lanzamiento).
 */

export const TRAMITES_LEGAL_VERSIONS = {
  terms: "condiciones-tramites-2026-11-v1",
  privacy: "privacidad-tramites-2026-11-v1",
  mandate: "autorizacion-representacion-2026-11-v1",
} as const;

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

const who = `${company.legalName} (NIF ${company.taxId}), con domicilio en ${companyAddressOneLine()}`;

export const tramitesTerms: LegalSection[] = [
  {
    heading: "1. Quién presta el servicio",
    paragraphs: [
      `El servicio lo presta ${who}, que opera con el nombre comercial ${company.tradeName}. Puedes escribirnos a ${company.email} o llamarnos al ${company.phone}.`,
    ],
  },
  {
    heading: "2. Qué contratas",
    paragraphs: [
      "Un servicio de gestión administrativa para tu vivienda de uso turístico. Tú sigues gestionando tus anuncios, reservas, huéspedes, limpieza y llaves. Nosotros nos encargamos de los trámites que contratas para cada vivienda.",
      "Servicios disponibles: alta de la vivienda en SES.HOSPEDAJES; comunicación ante el Ministerio del Interior de las reservas, sus anulaciones y la entrada de los viajeros conforme al Real Decreto 933/2021; y, como encargo especial que estudiamos antes de aceptar, la revisión de reservas anteriores que no se comunicaron.",
      "No incluye la gestión de la vivienda, la atención a huéspedes, la obtención de licencias o registros autonómicos o municipales, la fiscalidad ni la defensa en procedimientos sancionadores, salvo que se contraten aparte por escrito.",
    ],
  },
  {
    heading: "3. Precio y forma de pago",
    paragraphs: [
      "Los precios se muestran sin IVA y con IVA antes de pagar, por vivienda y por servicio. El importe que aceptas queda guardado en tu encargo con la versión de tarifa vigente ese día.",
      "En el plan por uso compras un saldo de reservas: cada reserva que nos comunicas consume una. Si te quedas sin saldo te avisamos para que compres más; no hacemos cargos automáticos sin tu aceptación.",
      "Los aranceles, tasas o gastos oficiales que pudiera exigir un organismo no están incluidos y siempre se presupuestan aparte, con su importe confirmado, antes de que autorices el gasto.",
      "El pago se hace con tarjeta a través de Stripe. No guardamos los datos de tu tarjeta. Recibirás la factura en tu carpeta y por correo.",
    ],
  },
  {
    heading: "4. Cuándo empezamos",
    paragraphs: [
      "Empezamos a trabajar cuando se cumplen tres cosas: has aceptado estas condiciones y la autorización de representación, el pago está confirmado y nos has facilitado la documentación mínima de cada trámite. Hasta entonces no podemos presentar nada en tu nombre.",
      "Atendemos en horario de oficina, de lunes a viernes. No ofrecemos un servicio de 24 horas ni envíos automáticos: cada comunicación la prepara y la presenta una persona de nuestro equipo.",
    ],
  },
  {
    heading: "5. Lo que te corresponde a ti",
    paragraphs: [
      "La obligación de comunicar los datos ante el Ministerio del Interior es del titular de la actividad. Contratarnos no la traslada ni te exime de ella: para que podamos cumplir los plazos tienes que avisarnos de cada reserva, anulación y entrada en cuanto se produzca, con datos exactos y completos.",
      "El Real Decreto 933/2021 fija un plazo de 24 horas desde cada hecho. Si nos informas tarde o sin los datos necesarios, haremos lo posible, pero no respondemos de los retrasos que no dependan de nosotros.",
      "Eres responsable de haber recogido los datos de los viajeros de forma lícita y de informarles del tratamiento, como exige la normativa.",
    ],
  },
  {
    heading: "6. Lo que nos corresponde a nosotros",
    paragraphs: [
      "Presentar los trámites encargados con diligencia profesional, dentro del plazo cuando nos des la información a tiempo, guardar el justificante de cada presentación en tu carpeta y avisarte si falta algo o si el organismo pide una corrección.",
      "Las comunicaciones de reservas pasadas que no se hicieron en su momento no eliminan el incumplimiento anterior ni garantizan que no haya consecuencias. En esos casos te explicamos la situación y las opciones antes de actuar.",
    ],
  },
  {
    heading: "7. Duración, cancelación y desistimiento",
    paragraphs: [
      "El plan por uso no tiene permanencia ni cuota. El saldo de reservas no caduca mientras tu cuenta esté activa.",
      "Si eres consumidor, tienes 14 días naturales para desistir desde la contratación. Si nos pides empezar antes y el servicio queda completamente prestado dentro de ese plazo, pierdes el derecho de desistimiento respecto de lo ya prestado; si está a medias, te devolvemos la parte no prestada.",
      "Puedes pedir la baja cuando quieras desde tu carpeta o escribiéndonos. Te devolvemos el saldo de reservas no consumido.",
    ],
  },
  {
    heading: "8. Responsabilidad",
    paragraphs: [
      "Respondemos de los daños que causemos por no hacer bien nuestro trabajo. No respondemos de sanciones derivadas de hechos anteriores a la contratación, de datos inexactos que nos hayas facilitado ni de retrasos por avisarnos fuera de plazo.",
    ],
  },
  {
    heading: "9. Ley aplicable",
    paragraphs: [
      "Se aplica la ley española. Si eres consumidor, puedes acudir a los juzgados de tu domicilio.",
    ],
  },
];

export const tramitesMandate: LegalSection[] = [
  {
    heading: "Autorización de representación",
    paragraphs: [
      `Como titular de la actividad de alquiler de las viviendas que doy de alta en mi carpeta, autorizo a ${who} para que, en mi nombre y representación, realice estas actuaciones ante el Ministerio del Interior a través de SES.HOSPEDAJES: solicitar el alta de mis viviendas como establecimientos; comunicar las reservas, sus anulaciones y la entrada de viajeros; consultar y descargar los justificantes de esas comunicaciones; y atender los requerimientos de corrección relacionados con ellas.`,
      "La autorización se limita a esas actuaciones y a las viviendas que figuren en mi carpeta. Puedo revocarla en cualquier momento desde mi carpeta o por escrito; la revocación no afecta a lo ya presentado.",
      "No entrego a Praetoria mis contraseñas ni mis certificados personales. Si un organismo exige un documento de representación con un formato concreto, lo firmaré aparte.",
    ],
  },
];

export const tramitesPrivacy: LegalSection[] = [
  {
    heading: "Tus datos como cliente",
    paragraphs: [
      `Responsable: ${who}. Tratamos tus datos de contacto, facturación y de tus viviendas para prestarte el servicio, cobrarlo y cumplir nuestras obligaciones fiscales. La base es el contrato y, para la facturación, la obligación legal.`,
      "Conservamos estos datos mientras dure la relación y, después, durante los plazos que exige la ley (facturas, seis años; reclamaciones, el plazo de prescripción que corresponda).",
      "Solo te enviaremos novedades comerciales si lo has aceptado expresamente; puedes retirar ese permiso cuando quieras.",
    ],
  },
  {
    heading: "Los datos de tus viajeros",
    paragraphs: [
      "Respecto de los datos de las personas que se alojan en tu vivienda, tú eres el responsable del tratamiento y nosotros actuamos como encargados, solo para presentar las comunicaciones que nos encargas. Aceptar estas condiciones supone firmar el contrato de encargo del tratamiento del artículo 28 del Reglamento General de Protección de Datos.",
      "Nos comprometemos a: tratar esos datos solo siguiendo tus instrucciones y para esta finalidad; guardarlos cifrados y separados de cualquier uso comercial; limitar el acceso a las personas del equipo que los necesitan; no usarlos nunca para publicidad ni analítica; avisarte sin demora de cualquier brecha de seguridad; y ayudarte a atender los derechos de los interesados.",
      "Subencargados: Supabase (base de datos y archivos, Unión Europea), Stripe (cobros), Resend (correos sin datos de viajeros) y Hostinger (alojamiento web). Te avisaremos antes de añadir otros.",
      "Al terminar el servicio te entregamos o borramos esos datos, salvo que una ley nos obligue a conservarlos. Los justificantes oficiales quedan en tu carpeta para que puedas descargarlos.",
    ],
  },
  {
    heading: "Tus derechos",
    paragraphs: [
      `Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${company.email}. Si no estás de acuerdo con nuestra respuesta, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`,
    ],
  },
];
