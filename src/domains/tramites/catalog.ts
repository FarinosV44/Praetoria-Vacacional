import { z } from "zod";

/**
 * Issue #175 — catálogo de servicios y planes de «Gestión de trámites».
 *
 * Fuente única de precios. El navegador nunca envía importes: solo códigos y
 * cantidades; el servidor calcula el precio con la versión vigente del catálogo
 * y la guarda en el pedido (historial de tarifa acordada por encargo).
 *
 * Los importes son honorarios SIN IVA en céntimos. El IVA se calcula aparte con
 * `vatRatePercent` (configurable; 21 % para servicios profesionales de una S.L.,
 * a revisar con el asesor fiscal) y siempre se muestra el total antes de pagar.
 *
 * NRUA y depósito anual: el Tribunal Supremo anuló en mayo de 2026 el
 * procedimiento del Registro Único y la obligación de información periódica
 * (STS 620/2026; arts. 9 y 10 del RD 1312/2024). Quedan en el catálogo
 * DESACTIVADOS para poder reactivarlos si una norma nueva los recupera
 * (decisión D-050). Un servicio desactivado no se muestra ni se puede pedir.
 */

export const SERVICE_CODES = [
  "ses_alta",
  "comunicacion_reserva",
  "revision_historica",
  "nrua_solicitud",
  "deposito_anual",
] as const;
export type ServiceCode = (typeof SERVICE_CODES)[number];

export const PLAN_CODES = ["por_uso", "gestion_continua"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

/** Cómo se cobra cada servicio. */
export type ServiceUnit =
  /** Una vez por vivienda (alta SES). */
  | "per_property"
  /** Por cada reserva gestionada (se compra como saldo de reservas). */
  | "per_reservation"
  /** Por vivienda y ejercicio. */
  | "per_property_year"
  /** Encargo especial: precio orientativo, presupuesto manual, sin cobro online. */
  | "quote";

const serviceSchema = z.object({
  code: z.enum(SERVICE_CODES),
  name: z.string().min(2).max(80),
  short: z.string().max(200),
  unit: z.enum(["per_property", "per_reservation", "per_property_year", "quote"]),
  /** Honorarios sin IVA, céntimos. Para `quote`, importe orientativo «desde». */
  priceCents: z.number().int().nonnegative(),
  enabled: z.boolean(),
  /** Aclaración visible junto al precio (gastos excluidos, límites…). */
  note: z.string().max(300).optional(),
});
export type CatalogService = z.infer<typeof serviceSchema>;

const planSchema = z.object({
  code: z.enum(PLAN_CODES),
  name: z.string().min(2).max(60),
  short: z.string().max(240),
  /** Cuota mensual por vivienda sin IVA (0 en «por uso»). */
  monthlyFeeCents: z.number().int().nonnegative(),
  /** Reservas incluidas por vivienda y mes de facturación (sin acumulación). */
  includedReservationsPerMonth: z.number().int().nonnegative(),
  /** Precio sin IVA de cada reserva en este plan (por uso: 15 €; extra continua: 12 €). */
  reservationCents: z.number().int().nonnegative(),
  /** Visible en la web. */
  visible: z.boolean(),
  /** Se puede contratar y cobrar. La suscripción no se activa sin aprobación comercial. */
  purchasable: z.boolean(),
});
export type CatalogPlan = z.infer<typeof planSchema>;

export const catalogSchema = z.object({
  version: z.string().min(1).max(40),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.literal("EUR"),
  vatRatePercent: z.number().min(0).max(30),
  services: z.array(serviceSchema).min(1),
  plans: z.array(planSchema).min(1),
  /** Mínimo de reservas al comprar saldo en «por uso». */
  minReservationCredits: z.number().int().min(1).max(50),
});
export type Catalog = z.infer<typeof catalogSchema>;

export const DEFAULT_CATALOG: Catalog = {
  version: "2026-11-v1",
  effectiveFrom: "2026-11-18",
  currency: "EUR",
  vatRatePercent: 21,
  minReservationCredits: 1,
  services: [
    {
      code: "ses_alta",
      name: "Alta en SES.HOSPEDAJES",
      short:
        "Damos de alta tu vivienda en la plataforma del Ministerio del Interior y la dejamos lista para comunicar reservas y entradas.",
      unit: "per_property",
      priceCents: 6000,
      enabled: true,
      note: "Una sola vez por vivienda. Solo si todavía no está dada de alta.",
    },
    {
      code: "comunicacion_reserva",
      name: "Comunicación de reservas",
      short:
        "Comunicamos cada reserva, su cancelación si la hay y la entrada de los viajeros con los datos que nos facilitas.",
      unit: "per_reservation",
      priceCents: 1500,
      enabled: true,
      note: "Por reserva. Incluye las comunicaciones de esa reserva: formalización, anulación y entrada.",
    },
    {
      code: "revision_historica",
      name: "Revisión de reservas anteriores",
      short:
        "Revisamos reservas pasadas que no se comunicaron y te explicamos las opciones. Es un encargo especial que estudiamos antes de aceptarlo.",
      unit: "quote",
      priceCents: 7500,
      enabled: true,
      note: "Importe orientativo para hasta seis estancias. Te enviamos presupuesto antes de empezar.",
    },
    {
      code: "nrua_solicitud",
      name: "Solicitud del NRUA",
      short: "Procedimiento del Registro Único de Arrendamientos.",
      unit: "per_property",
      priceCents: 7500,
      enabled: false,
      note: "Desactivado: procedimiento anulado por el Tribunal Supremo (STS 620/2026).",
    },
    {
      code: "deposito_anual",
      name: "Depósito anual ante Registradores",
      short: "Modelo informativo anual de arrendamientos de corta duración.",
      unit: "per_property_year",
      priceCents: 9000,
      enabled: false,
      note: "Desactivado: obligación anulada por el Tribunal Supremo (STS 620/2026).",
    },
  ],
  plans: [
    {
      code: "por_uso",
      name: "Por uso",
      short: "Sin cuota mensual. Pagas el alta si la necesitas y cada reserva que gestionamos.",
      monthlyFeeCents: 0,
      includedReservationsPerMonth: 0,
      reservationCents: 1500,
      visible: true,
      purchasable: true,
    },
    {
      code: "gestion_continua",
      name: "Gestión continua",
      short:
        "Cuota mensual por vivienda con dos reservas incluidas al mes. Las reservas que superen ese número se cobran aparte.",
      monthlyFeeCents: 2900,
      includedReservationsPerMonth: 2,
      reservationCents: 1200,
      // Propuesta comercial por validar (#173): se enseña como «próximamente» y
      // no se puede contratar hasta que el responsable la apruebe.
      visible: true,
      purchasable: false,
    },
  ],
};

export function serviceByCode(catalog: Catalog, code: ServiceCode): CatalogService | undefined {
  return catalog.services.find((s) => s.code === code);
}

export function planByCode(catalog: Catalog, code: PlanCode): CatalogPlan | undefined {
  return catalog.plans.find((p) => p.code === code);
}

/** Servicios que se pueden contratar hoy. */
export function enabledServices(catalog: Catalog): CatalogService[] {
  return catalog.services.filter((s) => s.enabled);
}

/** Importe con IVA de un importe sin IVA, redondeado al céntimo. */
export function withVat(netCents: number, vatRatePercent: number): number {
  return netCents + vatOf(netCents, vatRatePercent);
}

export function vatOf(netCents: number, vatRatePercent: number): number {
  return Math.round((netCents * vatRatePercent) / 100);
}
