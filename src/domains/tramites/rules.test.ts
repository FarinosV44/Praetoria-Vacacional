import { describe, expect, it } from "vitest";
import { canTransition, allowedTransitions } from "./workflow";
import { deadlineFor, deadlineState, madridLocalToIso, madridMidnight, nextPending, reportedLate } from "./deadlines";
import { checkUpload, sanitizeFilename, sniffMime } from "./upload";
import type { ReservationReport } from "./types";

describe("flujo del expediente", () => {
  it("camino normal hasta finalizado", () => {
    expect(canTransition("solicitado", "pendiente_documentacion").ok).toBe(true);
    expect(canTransition("pendiente_documentacion", "en_revision").ok).toBe(true);
    expect(canTransition("en_revision", "listo_para_presentar").ok).toBe(true);
    expect(
      canTransition("listo_para_presentar", "presentado", { submittedAt: "2026-11-18T10:00:00Z", submissionChannel: "ses_hospedajes_web" }).ok,
    ).toBe(true);
    expect(canTransition("presentado", "finalizado", { hasOfficialProof: true }).ok).toBe(true);
  });

  it("no se marca presentado sin fecha y canal reales", () => {
    const r = canTransition("listo_para_presentar", "presentado");
    expect(r.ok).toBe(false);
  });

  it("no se finaliza sin justificante oficial", () => {
    expect(canTransition("presentado", "finalizado", { hasOfficialProof: false }).ok).toBe(false);
  });

  it("no se salta pasos ni se reabre un expediente cerrado", () => {
    expect(canTransition("solicitado", "presentado").ok).toBe(false);
    expect(allowedTransitions("finalizado")).toEqual([]);
    expect(allowedTransitions("cancelado")).toEqual([]);
  });
});

const base: ReservationReport = {
  id: "r",
  accountId: "a",
  propertyId: "p",
  externalRef: null,
  channel: "booking",
  bookedAt: "2026-11-10T09:00:00.000Z",
  checkIn: "2026-11-20",
  checkOut: "2026-11-22",
  travellers: 2,
  cancelledAt: null,
  reportedAt: "2026-11-10T10:00:00.000Z",
  travellerDataEnc: null,
  travellerDataAt: null,
  communicatedReservaAt: null,
  communicatedAnulacionAt: null,
  communicatedEntradaAt: null,
  billing: "saldo",
  createdAt: "2026-11-10T10:00:00.000Z",
};

describe("plazos RD 933/2021 (24 h desde cada hecho)", () => {
  it("medianoche de Madrid en invierno (+1) y verano (+2)", () => {
    expect(madridMidnight("2026-11-20").toISOString()).toBe("2026-11-19T23:00:00.000Z");
    expect(madridMidnight("2026-07-15").toISOString()).toBe("2026-07-14T22:00:00.000Z");
  });

  it("hora local de Madrid del formulario → UTC", () => {
    expect(madridLocalToIso("2026-11-18T10:30")).toBe("2026-11-18T09:30:00.000Z");
    expect(madridLocalToIso("2026-07-01T10:30")).toBe("2026-07-01T08:30:00.000Z");
    expect(madridLocalToIso("2026-11-18T10:30:00.000Z")).toBe("2026-11-18T10:30:00.000Z");
  });

  it("reserva: 24 h desde que se formaliza", () => {
    expect(deadlineFor(base, "reserva")?.toISOString()).toBe("2026-11-11T09:00:00.000Z");
  });

  it("entrada: 24 h desde el comienzo del día de llegada (referencia prudente)", () => {
    expect(deadlineFor(base, "entrada")?.toISOString()).toBe("2026-11-20T23:00:00.000Z");
  });

  it("anulación solo cuando existe", () => {
    expect(deadlineFor(base, "anulacion")).toBeNull();
    expect(deadlineFor({ ...base, cancelledAt: "2026-11-15T12:00:00.000Z" }, "anulacion")?.toISOString()).toBe(
      "2026-11-16T12:00:00.000Z",
    );
  });

  it("estados: a tiempo, vence pronto, vencido, hecho", () => {
    expect(deadlineState(base, "reserva", new Date("2026-11-10T12:00:00Z")).state).toBe("a_tiempo");
    expect(deadlineState(base, "reserva", new Date("2026-11-11T05:00:00Z")).state).toBe("vence_pronto");
    expect(deadlineState(base, "reserva", new Date("2026-11-12T00:00:00Z")).state).toBe("vencido");
    expect(deadlineState({ ...base, communicatedReservaAt: "2026-11-10T11:00:00Z" }, "reserva").state).toBe("hecho");
  });

  it("reserva anulada antes de la llegada: no hay parte de entrada", () => {
    const r = { ...base, cancelledAt: "2026-11-15T12:00:00.000Z" };
    expect(deadlineState(r, "entrada").state).toBe("no_aplica");
  });

  it("comunicada fuera de plazo queda marcada para revisión humana", () => {
    expect(reportedLate(base)).toBe(false);
    expect(reportedLate({ ...base, reportedAt: "2026-11-12T10:00:00.000Z" })).toBe(true);
  });

  it("siguiente comunicación pendiente", () => {
    const n = nextPending({ ...base, communicatedReservaAt: "2026-11-10T11:00:00Z" }, new Date("2026-11-19T12:00:00Z"));
    expect(n?.event).toBe("entrada");
  });
});

const PDF = new TextEncoder().encode("%PDF-1.7\n...");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

describe("subida de documentos", () => {
  it("detecta el tipo por el contenido", () => {
    expect(sniffMime(PDF)).toBe("application/pdf");
    expect(sniffMime(PNG)).toBe("image/png");
    expect(sniffMime(JPG)).toBe("image/jpeg");
    expect(sniffMime(new TextEncoder().encode("<html>"))).toBeNull();
  });

  it("acepta PDF/PNG/JPG coherentes", () => {
    expect(checkUpload("escritura.pdf", PDF).ok).toBe(true);
    expect(checkUpload("foto.JPG", JPG).ok).toBe(true);
  });

  it("rechaza ejecutables disfrazados, extensiones falsas, vacíos y grandes", () => {
    expect(checkUpload("malo.pdf", new TextEncoder().encode("MZ\x90\x00")).ok).toBe(false);
    expect(checkUpload("foto.png", PDF).ok).toBe(false);
    expect(checkUpload("script.svg", PDF).ok).toBe(false);
    expect(checkUpload("vacio.pdf", new Uint8Array()).ok).toBe(false);
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    big.set(PDF);
    expect(checkUpload("grande.pdf", big).ok).toBe(false);
  });

  it("sanea el nombre visible", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename('a<b>"c.pdf')).toBe("abc.pdf");
    expect(sanitizeFilename("C:\\Users\\x\\dni.pdf")).toBe("dni.pdf");
  });
});
