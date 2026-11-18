import { describe, expect, it } from "vitest";
import { DEFAULT_CATALOG, catalogSchema, enabledServices, withVat, type Catalog } from "./catalog";
import { buildCreditsQuote, buildQuote, monthlyUsage } from "./pricing";

const prop = (alias: string, sesAlta = false) => ({ propertyId: `#${alias}`, alias, sesAlta });

describe("catálogo", () => {
  it("el catálogo por defecto es válido y versionado", () => {
    expect(catalogSchema.safeParse(DEFAULT_CATALOG).success).toBe(true);
    expect(DEFAULT_CATALOG.version).toMatch(/^2026-11/);
  });

  it("NRUA y depósito anual están desactivados (STS 620/2026)", () => {
    const codes = enabledServices(DEFAULT_CATALOG).map((s) => s.code);
    expect(codes).toEqual(["ses_alta", "comunicacion_reserva", "revision_historica"]);
  });

  it("precios base del encargo", () => {
    const by = Object.fromEntries(DEFAULT_CATALOG.services.map((s) => [s.code, s.priceCents]));
    expect(by.ses_alta).toBe(6000);
    expect(by.comunicacion_reserva).toBe(1500);
    expect(by.revision_historica).toBe(7500);
  });

  it("IVA redondeado al céntimo", () => {
    expect(withVat(6000, 21)).toBe(7260);
    expect(withVat(1500, 21)).toBe(1815);
    expect(withVat(1, 21)).toBe(1);
  });
});

describe("presupuesto (por uso)", () => {
  it("una vivienda con alta y 2 reservas", () => {
    const q = buildQuote(DEFAULT_CATALOG, {
      planCode: "por_uso",
      properties: [prop("Ático", true)],
      reservationCredits: 2,
      historicalReview: false,
    });
    expect(q.ok).toBe(true);
    expect(q.netCents).toBe(6000 + 2 * 1500);
    expect(q.vatCents).toBe(Math.round(9000 * 0.21));
    expect(q.totalCents).toBe(10890);
    expect(q.lines.map((l) => l.serviceCode)).toEqual(["ses_alta", "saldo_reservas"]);
    expect(q.lines[0]!.propertyId).toBe("#Ático");
  });

  it("varias viviendas: un alta por cada una que la pide", () => {
    const q = buildQuote(DEFAULT_CATALOG, {
      planCode: "por_uso",
      properties: [prop("A", true), prop("B", false), prop("C", true)],
      reservationCredits: 0,
      historicalReview: false,
    });
    expect(q.ok).toBe(true);
    expect(q.lines.filter((l) => l.serviceCode === "ses_alta")).toHaveLength(2);
    expect(q.netCents).toBe(12000);
  });

  it("sin servicios no hay presupuesto", () => {
    const q = buildQuote(DEFAULT_CATALOG, {
      planCode: "por_uso",
      properties: [prop("A")],
      reservationCredits: 0,
      historicalReview: false,
    });
    expect(q.ok).toBe(false);
  });

  it("la revisión histórica no se cobra online: presupuesto manual", () => {
    const q = buildQuote(DEFAULT_CATALOG, {
      planCode: "por_uso",
      properties: [prop("A")],
      reservationCredits: 0,
      historicalReview: true,
    });
    expect(q.ok).toBe(true);
    expect(q.totalCents).toBe(0);
    expect(q.needsManualQuote).toBe(true);
    expect(q.manualQuoteFromNetCents).toBe(7500);
  });

  it("rechaza cantidades fuera de rango y viviendas de más", () => {
    expect(
      buildQuote(DEFAULT_CATALOG, {
        planCode: "por_uso",
        properties: [prop("A")],
        reservationCredits: -1,
        historicalReview: false,
      }).ok,
    ).toBe(false);
    expect(
      buildQuote(DEFAULT_CATALOG, {
        planCode: "por_uso",
        properties: [prop("A")],
        reservationCredits: 201,
        historicalReview: false,
      }).ok,
    ).toBe(false);
    const many = Array.from({ length: 21 }, (_, i) => prop(`P${i}`, true));
    expect(
      buildQuote(DEFAULT_CATALOG, {
        planCode: "por_uso",
        properties: many,
        reservationCredits: 0,
        historicalReview: false,
      }).ok,
    ).toBe(false);
  });

  it("un servicio desactivado no se puede pedir aunque lo intenten", () => {
    const off: Catalog = {
      ...DEFAULT_CATALOG,
      services: DEFAULT_CATALOG.services.map((s) =>
        s.code === "ses_alta" ? { ...s, enabled: false } : s,
      ),
    };
    const q = buildQuote(off, {
      planCode: "por_uso",
      properties: [prop("A", true)],
      reservationCredits: 0,
      historicalReview: false,
    });
    expect(q.ok).toBe(false);
  });

  it("compra de saldo desde el portal", () => {
    const q = buildCreditsQuote(DEFAULT_CATALOG, 5);
    expect(q.ok).toBe(true);
    expect(q.netCents).toBe(7500);
    expect(q.totalCents).toBe(9075);
  });
});

describe("gestión continua (propuesta por validar)", () => {
  it("no se puede contratar mientras no esté aprobada", () => {
    const q = buildQuote(DEFAULT_CATALOG, {
      planCode: "gestion_continua",
      properties: [prop("A")],
      reservationCredits: 0,
      historicalReview: false,
    });
    expect(q.ok).toBe(false);
    expect(q.errors.join(" ")).toMatch(/todavía no se puede contratar/);
  });

  it("cuando se aprueba: cuota por vivienda, alta aparte", () => {
    const approved: Catalog = {
      ...DEFAULT_CATALOG,
      plans: DEFAULT_CATALOG.plans.map((p) =>
        p.code === "gestion_continua" ? { ...p, purchasable: true } : p,
      ),
    };
    const q = buildQuote(approved, {
      planCode: "gestion_continua",
      properties: [prop("A", true), prop("B")],
      reservationCredits: 0,
      historicalReview: false,
    });
    expect(q.ok).toBe(true);
    expect(q.netCents).toBe(6000);
    expect(q.monthlyTotalCents).toBe(withVat(2 * 2900, 21));
  });

  it("dos reservas incluidas al mes, sin acumulación; extras a 12 €", () => {
    expect(monthlyUsage(DEFAULT_CATALOG, 0)).toEqual({ included: 0, extra: 0, extraNetCents: 0 });
    expect(monthlyUsage(DEFAULT_CATALOG, 2)).toEqual({ included: 2, extra: 0, extraNetCents: 0 });
    expect(monthlyUsage(DEFAULT_CATALOG, 5)).toEqual({
      included: 2,
      extra: 3,
      extraNetCents: 3600,
    });
  });
});
