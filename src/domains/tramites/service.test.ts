import { beforeEach, describe, expect, it, vi } from "vitest";

// Next solo existe dentro de una petición: simulamos lo mínimo que tocan los módulos.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set() {}, delete() {} }),
}));
vi.mock("next/navigation", () => ({
  redirect: (u: string) => {
    throw new Error(`redirect:${u}`);
  },
}));

import { resetMemoryTramites, memoryTramites } from "./repo/memory";
import {
  cancelReservation,
  createCreditsOrder,
  createEngagement,
  markOrderPaid,
  ownerDownload,
  readTravellerData,
  registerSubmission,
  reportReservation,
  saveTravellerData,
  storeDocument,
  transition,
} from "./service";
import type { OwnerContext } from "./context";
import type { EngagementInput } from "./schema";

const PDF = new TextEncoder().encode("%PDF-1.7 justificante");

function engagement(email: string, overrides: Partial<EngagementInput> = {}): EngagementInput {
  return {
    planCode: "por_uso",
    properties: [
      {
        alias: "Ático Cullera",
        street: "Calle del Mar 1",
        postalCode: "46400",
        municipality: "Cullera",
        province: "Valencia",
        hasTourismRegistry: "si",
        tourismRegistryNumber: "VT-12345-V",
        hasSesAlta: "no",
        platforms: ["booking"],
        wantsSesAlta: true,
      },
    ],
    reservationCredits: 2,
    historicalReview: false,
    historicalNotes: "",
    owner: {
      kind: "particular",
      legalName: "Ana Pruebas",
      taxId: "00000000T",
      contactName: "Ana",
      email,
      phone: "600111222",
      billingAddress: "Calle Uno 1, Valencia",
    },
    password: "",
    acceptTerms: true,
    acceptPrivacy: true,
    acceptMandate: true,
    marketingOptIn: false,
    ...overrides,
  };
}

async function newClient(userId: string, email: string) {
  const r = await createEngagement(
    engagement(email),
    { userId, existingAccountId: null, emailVerified: true },
    { ipHash: null, userAgent: null },
  );
  if (!r.ok) throw new Error(r.error);
  const memberships = await memoryTramites.listMembershipsByUser(userId);
  const account = (await memoryTramites.getAccount(memberships[0]!.accountId))!;
  const ctx: OwnerContext = {
    session: { userId, email, emailVerified: true },
    memberships,
    account,
  };
  return { ctx, orderId: r.orderId! };
}

const admin = { type: "admin" as const, id: "gestor@praetoria.test", label: "Gestor" };

beforeEach(() => resetMemoryTramites());

describe("contratación y pago", () => {
  it("el precio lo fija el servidor y el pedido guarda la versión aceptada", async () => {
    const { ctx, orderId } = await newClient("u-a", "a@test.es");
    const order = (await memoryTramites.getOrder(orderId))!;
    expect(order.totalCents).toBe(10890);
    expect(order.status).toBe("pendiente_pago");
    expect(order.acceptance.termsVersion).toMatch(/condiciones-tramites/);
    expect(order.lines.find((l) => l.serviceCode === "ses_alta")?.propertyId).toBe(
      (await memoryTramites.listProperties({ accountId: ctx.account.id }))[0]!.id,
    );
  });

  it("sin email verificado el pedido espera a la verificación", async () => {
    const r = await createEngagement(
      engagement("b@test.es"),
      { userId: "u-b", existingAccountId: null, emailVerified: false },
      { ipHash: null, userAgent: null },
    );
    expect(r.ok && r.needsVerification).toBe(true);
    const order = (await memoryTramites.listOrders())[0]!;
    expect(order.status).toBe("pendiente_verificacion");
  });

  it("el pago confirmado abre el expediente de alta, carga el saldo y es idempotente", async () => {
    const { ctx, orderId } = await newClient("u-a", "a@test.es");
    const first = await markOrderPaid(orderId, {
      paymentIntentId: "pi_1",
      checkoutSessionId: "cs_1",
      amountCents: 10890,
    });
    const second = await markOrderPaid(orderId, {
      paymentIntentId: "pi_1",
      checkoutSessionId: "cs_1",
      amountCents: 10890,
    });
    expect(first.ok).toBe(true);
    expect(second.already).toBe(true);
    expect((await memoryTramites.getAccount(ctx.account.id))!.reservationCredits).toBe(2);
    const filings = await memoryTramites.listFilings({ accountId: ctx.account.id });
    expect(filings).toHaveLength(1);
    expect(filings[0]!.serviceCode).toBe("ses_alta");
    expect(filings[0]!.status).toBe("pendiente_documentacion");
    expect(filings[0]!.requestedDocuments).toContain("autorizacion_representacion");
  });

  it("un importe distinto no confirma el pedido", async () => {
    const { orderId } = await newClient("u-a", "a@test.es");
    const r = await markOrderPaid(orderId, {
      paymentIntentId: "pi",
      checkoutSessionId: null,
      amountCents: 100,
    });
    expect(r.ok).toBe(false);
    expect((await memoryTramites.getOrder(orderId))!.status).toBe("pendiente_pago");
  });

  it("la revisión histórica crea una solicitud especial sin cobro", async () => {
    const r = await createEngagement(
      engagement("c@test.es", {
        reservationCredits: 0,
        historicalReview: true,
        historicalNotes: "Seis estancias de 2025",
        properties: [{ ...engagement("x").properties[0]!, wantsSesAlta: false }],
      }),
      { userId: "u-c", existingAccountId: null, emailVerified: true },
      { ipHash: null, userAgent: null },
    );
    expect(r.ok && r.orderId).toBeNull();
    const filings = await memoryTramites.listFilings();
    expect(filings[0]!.serviceCode).toBe("revision_historica");
    expect(filings[0]!.late).toBe(true);
  });
});

describe("reservas, viajeros y saldo", () => {
  it("cada reserva consume saldo; sin saldo queda pendiente y se liquida al comprar", async () => {
    const { ctx, orderId } = await newClient("u-a", "a@test.es");
    await markOrderPaid(orderId, {
      paymentIntentId: "pi",
      checkoutSessionId: null,
      amountCents: 10890,
    });
    const prop = (await memoryTramites.listProperties({ accountId: ctx.account.id }))[0]!;
    const res = (n: number) =>
      reportReservation(ctx, {
        propertyId: prop.id,
        externalRef: `BK${n}`,
        channel: "booking",
        bookedAt: new Date().toISOString(),
        checkIn: "2027-01-10",
        checkOut: "2027-01-12",
        travellers: 2,
      });
    expect(
      (await res(1)).ok && (await memoryTramites.getAccount(ctx.account.id))!.reservationCredits,
    ).toBe(1);
    await res(2);
    const third = await res(3);
    expect(third.ok && third.billing).toBe("pendiente");
    expect((await memoryTramites.getAccount(ctx.account.id))!.reservationCredits).toBe(0);

    const credits = await createCreditsOrder(ctx, 3);
    expect(credits.ok).toBe(true);
    await markOrderPaid(credits.ok ? credits.orderId : "", {
      paymentIntentId: "pi2",
      checkoutSessionId: null,
      amountCents: 5445,
    });
    const reports = await memoryTramites.listReports({ accountId: ctx.account.id });
    expect(reports.every((r) => r.billing === "saldo")).toBe(true);
    expect((await memoryTramites.getAccount(ctx.account.id))!.reservationCredits).toBe(2);
  });

  it("los datos de viajeros se guardan cifrados y solo se leen con permiso", async () => {
    const { ctx, orderId } = await newClient("u-a", "a@test.es");
    await markOrderPaid(orderId, {
      paymentIntentId: "pi",
      checkoutSessionId: null,
      amountCents: 10890,
    });
    const prop = (await memoryTramites.listProperties({ accountId: ctx.account.id }))[0]!;
    const r = await reportReservation(ctx, {
      propertyId: prop.id,
      externalRef: "",
      channel: "airbnb",
      bookedAt: new Date().toISOString(),
      checkIn: "2027-02-01",
      checkOut: "2027-02-03",
      travellers: 1,
    });
    if (!r.ok) throw new Error();
    const saved = await saveTravellerData(ctx, r.reportId, {
      paymentType: "plataforma",
      travellers: [
        {
          firstName: "Luis",
          surname1: "Viajero",
          surname2: "",
          sex: "H",
          docType: "DNI",
          docNumber: "12345678Z",
          docSupport: "",
          nationality: "España",
          birthDate: "1980-01-01",
          address: "Calle Dos 2",
          city: "Madrid",
          country: "España",
          phone: "",
          email: "",
          kinship: "",
        },
      ],
    });
    expect(saved.ok).toBe(true);
    const raw = (await memoryTramites.getReport(r.reportId))!.travellerDataEnc!;
    expect(raw).not.toContain("12345678Z");
    expect(raw.startsWith("v1.")).toBe(true);
    const plain = await readTravellerData(r.reportId, admin);
    expect(plain?.travellers[0]!.docNumber).toBe("12345678Z");
    const auditLog = await memoryTramites.listAudit({ accountId: ctx.account.id });
    expect(auditLog.some((e) => e.action === "viajeros.ver")).toBe(true);
    expect(JSON.stringify(auditLog)).not.toContain("12345678Z");

    const cancelled = await cancelReservation(ctx, r.reportId, new Date().toISOString());
    expect(cancelled.ok).toBe(true);
  });
});

describe("aislamiento entre clientes (A no ve a B)", () => {
  it("B no puede comunicar reservas, subir ni descargar en la cuenta de A", async () => {
    const a = await newClient("u-a", "a@test.es");
    const b = await newClient("u-b", "b@test.es");
    const propA = (await memoryTramites.listProperties({ accountId: a.ctx.account.id }))[0]!;

    const r = await reportReservation(b.ctx, {
      propertyId: propA.id,
      externalRef: "",
      channel: "booking",
      bookedAt: new Date().toISOString(),
      checkIn: "2027-01-10",
      checkOut: "2027-01-11",
      travellers: 1,
    });
    expect(r.ok).toBe(false);

    const up = await storeDocument({
      accountId: a.ctx.account.id,
      propertyId: propA.id,
      filingId: null,
      kind: "otro",
      name: "dni.pdf",
      bytes: PDF,
      actor: { type: "owner", id: "u-a", label: "Cliente" },
    });
    expect(up.ok).toBe(true);
    const docId = up.ok ? up.doc.id : "";
    expect(await ownerDownload(b.ctx, docId)).toBeNull();
    expect((await ownerDownload(a.ctx, docId))?.bytes.length).toBe(PDF.length);

    // B intenta colgar un documento en una vivienda de A pasando su propia cuenta.
    const sneaky = await storeDocument({
      accountId: b.ctx.account.id,
      propertyId: propA.id,
      filingId: null,
      kind: "otro",
      name: "x.pdf",
      bytes: PDF,
      actor: { type: "owner", id: "u-b", label: "Cliente" },
    });
    expect(sneaky.ok).toBe(false);
  });
});

describe("gestión del expediente (panel)", () => {
  it("presentación manual, justificante y cierre con historial", async () => {
    const { ctx, orderId } = await newClient("u-a", "a@test.es");
    await markOrderPaid(orderId, {
      paymentIntentId: "pi",
      checkoutSessionId: null,
      amountCents: 10890,
    });
    const f = (await memoryTramites.listFilings({ accountId: ctx.account.id }))[0]!;

    expect((await transition(f.id, "finalizado", admin)).ok).toBe(false);
    expect((await transition(f.id, "en_revision", admin)).ok).toBe(true);
    expect((await transition(f.id, "listo_para_presentar", admin)).ok).toBe(true);
    expect((await transition(f.id, "presentado", admin)).ok).toBe(false);

    const sub = await registerSubmission(
      f.id,
      { submittedAt: new Date().toISOString(), channel: "ses_hospedajes_web", ref: "SES-0001" },
      admin,
    );
    expect(sub.ok).toBe(true);
    expect((await memoryTramites.getFiling(f.id))!.status).toBe("presentado");

    expect(
      (
        await registerSubmission(
          f.id,
          { submittedAt: "2999-01-01T00:00:00Z", channel: "ses_hospedajes_web", ref: "" },
          admin,
        )
      ).ok,
    ).toBe(false);

    const proof = await storeDocument({
      accountId: ctx.account.id,
      propertyId: null,
      filingId: f.id,
      kind: "otro",
      name: "justificante.pdf",
      bytes: PDF,
      actor: admin,
      officialProof: true,
    });
    expect(proof.ok && proof.doc.kind).toBe("justificante_oficial");
    expect((await transition(f.id, "finalizado", admin)).ok).toBe(true);
    expect((await transition(f.id, "en_revision", admin)).ok).toBe(false);

    const events = await memoryTramites.listEvents(f.id);
    expect(events.map((e) => e.kind)).toEqual(
      expect.arrayContaining(["creado", "solicitud", "estado", "presentacion", "documento"]),
    );
  });
  it("una reserva no se cierra hasta presentar reserva y entrada", async () => {
    const { ctx, orderId } = await newClient("u-r", "r@test.es");
    await markOrderPaid(orderId, {
      paymentIntentId: "pi",
      checkoutSessionId: null,
      amountCents: 10890,
    });
    const prop = (await memoryTramites.listProperties({ accountId: ctx.account.id }))[0]!;
    const rep = await reportReservation(ctx, {
      propertyId: prop.id,
      externalRef: "BK-R",
      channel: "booking",
      bookedAt: new Date().toISOString(),
      checkIn: "2027-02-10",
      checkOut: "2027-02-12",
      travellers: 2,
    });
    expect(rep.ok).toBe(true);
    const f = (await memoryTramites.listFilings({ accountId: ctx.account.id })).find(
      (x) => x.reservationReportId,
    )!;
    const at = new Date().toISOString();
    expect(
      (
        await registerSubmission(
          f.id,
          { submittedAt: at, channel: "ses_hospedajes_web", ref: "R1", reportEvent: "reserva" },
          admin,
        )
      ).ok,
    ).toBe(true);
    expect((await memoryTramites.getFiling(f.id))!.status).toBe("presentado");
    await storeDocument({
      accountId: ctx.account.id,
      propertyId: null,
      filingId: f.id,
      kind: "otro",
      name: "acuse.pdf",
      bytes: PDF,
      actor: admin,
      officialProof: true,
    });
    const early = await transition(f.id, "finalizado", admin);
    expect(early.ok).toBe(false);
    expect(!early.ok && early.error).toMatch(/entrada/);
    expect(
      (
        await registerSubmission(
          f.id,
          { submittedAt: at, channel: "ses_hospedajes_web", ref: "E1", reportEvent: "entrada" },
          admin,
        )
      ).ok,
    ).toBe(true);
    expect((await transition(f.id, "finalizado", admin)).ok).toBe(true);
  });
});
