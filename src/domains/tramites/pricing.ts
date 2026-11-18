import {
  planByCode,
  serviceByCode,
  vatOf,
  type Catalog,
  type PlanCode,
} from "./catalog";
import type { OrderLine } from "./types";

/**
 * Tarificador autoritativo (#175). Solo se ejecuta en el servidor con el
 * catálogo vigente; el cliente nunca aporta importes.
 */

export interface PropertySelection {
  /** Id de la vivienda (o id temporal del formulario antes de guardarla). */
  propertyId: string | null;
  alias: string;
  /** Pide el alta en SES.HOSPEDAJES. */
  sesAlta: boolean;
}

export interface QuoteInput {
  planCode: PlanCode;
  properties: PropertySelection[];
  /** Reservas prepagadas (plan por uso). */
  reservationCredits: number;
  /** Pide estudio de reservas anteriores no comunicadas (sin cobro online). */
  historicalReview: boolean;
}

export interface Quote {
  ok: boolean;
  errors: string[];
  planCode: PlanCode;
  catalogVersion: string;
  vatRatePercent: number;
  lines: OrderLine[];
  netCents: number;
  vatCents: number;
  totalCents: number;
  /** Cuota mensual con IVA que empezaría a cobrarse (gestión continua). */
  monthlyTotalCents: number;
  /** Hay encargo especial que se presupuesta aparte. */
  needsManualQuote: boolean;
  /** Importe orientativo «desde», sin IVA, del encargo especial. */
  manualQuoteFromNetCents: number;
}

export const MAX_PROPERTIES = 20;
export const MAX_CREDITS = 200;

export function buildQuote(catalog: Catalog, input: QuoteInput): Quote {
  const errors: string[] = [];
  const plan = planByCode(catalog, input.planCode);
  const lines: OrderLine[] = [];

  if (!plan || !plan.visible) errors.push("El plan elegido no está disponible.");
  else if (!plan.purchasable) errors.push(`El plan «${plan.name}» todavía no se puede contratar.`);

  if (input.properties.length === 0) errors.push("Añade al menos una vivienda.");
  if (input.properties.length > MAX_PROPERTIES)
    errors.push(`Para más de ${MAX_PROPERTIES} viviendas te preparamos una propuesta a medida.`);

  const credits = Math.trunc(input.reservationCredits);
  if (!Number.isFinite(credits) || credits < 0 || credits > MAX_CREDITS)
    errors.push("El número de reservas no es válido.");

  const ses = serviceByCode(catalog, "ses_alta");
  const reserva = serviceByCode(catalog, "comunicacion_reserva");
  const revision = serviceByCode(catalog, "revision_historica");

  for (const p of input.properties) {
    if (p.sesAlta) {
      if (!ses?.enabled) errors.push("El alta en SES.HOSPEDAJES no está disponible ahora mismo.");
      else
        lines.push({
          propertyId: p.propertyId,
          serviceCode: "ses_alta",
          description: `${ses.name} · ${p.alias}`,
          quantity: 1,
          unitNetCents: ses.priceCents,
          netCents: ses.priceCents,
        });
    }
  }

  if (plan?.code === "por_uso" && credits > 0) {
    if (!reserva?.enabled) errors.push("La comunicación de reservas no está disponible ahora mismo.");
    else if (credits < catalog.minReservationCredits)
      errors.push(`El mínimo son ${catalog.minReservationCredits} reservas.`);
    else
      lines.push({
        propertyId: null,
        serviceCode: "saldo_reservas",
        description: `${reserva.name} · saldo de ${credits} ${credits === 1 ? "reserva" : "reservas"}`,
        quantity: credits,
        unitNetCents: plan.reservationCents,
        netCents: plan.reservationCents * credits,
      });
  }

  let monthlyNet = 0;
  if (plan?.code === "gestion_continua") {
    monthlyNet = plan.monthlyFeeCents * input.properties.length;
  }

  if (input.historicalReview && !revision?.enabled)
    errors.push("La revisión de reservas anteriores no está disponible ahora mismo.");

  const hasSomething = lines.length > 0 || input.historicalReview || monthlyNet > 0;
  if (!hasSomething) errors.push("Elige al menos un servicio.");

  const netCents = lines.reduce((s, l) => s + l.netCents, 0);
  // IVA sobre el total de la factura (una sola base), como en una factura real.
  const vatCents = vatOf(netCents, catalog.vatRatePercent);

  return {
    ok: errors.length === 0,
    errors,
    planCode: input.planCode,
    catalogVersion: catalog.version,
    vatRatePercent: catalog.vatRatePercent,
    lines,
    netCents,
    vatCents,
    totalCents: netCents + vatCents,
    monthlyTotalCents: monthlyNet + vatOf(monthlyNet, catalog.vatRatePercent),
    needsManualQuote: input.historicalReview && !!revision?.enabled,
    manualQuoteFromNetCents: input.historicalReview && revision?.enabled ? revision.priceCents : 0,
  };
}

/** Compra posterior de saldo de reservas desde el portal (plan por uso). */
export function buildCreditsQuote(catalog: Catalog, credits: number): Quote {
  return buildQuote(catalog, {
    planCode: "por_uso",
    properties: [{ propertyId: null, alias: "", sesAlta: false }],
    reservationCredits: credits,
    historicalReview: false,
  });
}

/**
 * Gestión continua (#175): reservas incluidas por vivienda y mes de
 * facturación, sin acumulación de cupos entre meses.
 */
export function monthlyUsage(
  catalog: Catalog,
  reservationsThisPeriod: number,
): { included: number; extra: number; extraNetCents: number } {
  const plan = planByCode(catalog, "gestion_continua");
  const cap = plan?.includedReservationsPerMonth ?? 0;
  const n = Math.max(0, Math.trunc(reservationsThisPeriod));
  const included = Math.min(n, cap);
  const extra = n - included;
  return { included, extra, extraNetCents: extra * (plan?.reservationCents ?? 0) };
}
