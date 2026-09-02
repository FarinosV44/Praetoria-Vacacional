import { describe, expect, it } from "vitest";
import { buildParte, isMinor, registryStatus, validateTraveller } from "./parte";
import type { Traveller } from "./types";

const full: Partial<Traveller> = {
  fullName: "Ana García López",
  docType: "DNI",
  docNumber: "12345678Z",
  nationality: "ESP",
  birthDate: "1990-05-01",
  paymentMethod: "TARJ",
  addressCountry: "ESP",
  municipality: "Valencia",
  province: "Valencia",
};

describe("validateTraveller", () => {
  it("passes a complete Spanish resident", () => {
    expect(validateTraveller(full)).toEqual([]);
  });
  it("flags a bad DNI", () => {
    expect(validateTraveller({ ...full, docNumber: "ABC" }).some((i) => i.field === "docNumber")).toBe(true);
  });
  it("requires payment method (RD 933/2021)", () => {
    expect(validateTraveller({ ...full, paymentMethod: "" }).some((i) => i.field === "paymentMethod")).toBe(true);
  });
  it("requires municipality/province only for Spanish residents", () => {
    expect(validateTraveller({ ...full, municipality: "", province: "" }).length).toBe(2);
    expect(
      validateTraveller({ ...full, addressCountry: "FRA", municipality: "", province: "" }),
    ).toEqual([]);
  });
  it("accepts a valid NIE", () => {
    expect(validateTraveller({ ...full, docType: "NIE", docNumber: "X1234567L" })).toEqual([]);
  });
});

describe("isMinor", () => {
  it("computes age at the stay date", () => {
    expect(isMinor("2010-01-01", "2026-09-02")).toBe(true);
    expect(isMinor("2008-09-03", "2026-09-02")).toBe(true);
    expect(isMinor("2008-09-01", "2026-09-02")).toBe(false);
    expect(isMinor(null, "2026-09-02")).toBe(false);
  });
});

describe("buildParte / registryStatus", () => {
  const t = (o: Partial<Traveller>): Traveller =>
    ({
      id: "x",
      reservationId: "r",
      fullName: "Ana García López",
      firstSurname: "García",
      secondSurname: "López",
      docType: "DNI",
      docNumber: "12345678Z",
      docSupport: null,
      nationality: "ESP",
      birthDate: "1990-05-01",
      gender: "M",
      phone: null,
      email: null,
      addressCountry: "ESP",
      addressLine: null,
      municipality: "Valencia",
      province: "Valencia",
      postalCode: null,
      kinship: null,
      isLead: true,
      paymentMethod: "TARJ",
      signedAt: null,
      sentAt: null,
      sentRef: null,
      createdAt: "",
      updatedAt: "",
      ...o,
    }) as Traveller;

  it("maps traveller fields into the parte structure", () => {
    const parte = buildParte(
      { code: "A", name: "PRAETORIA", nif: "B1", address: "c/", municipality: "m", province: "p", postalCode: "1", phone: "9", email: "e" },
      { reference: "PV-1", checkIn: "2026-10-10", checkOut: "2026-10-14", guests: 2, internetAccess: true },
      [t({})],
    );
    expect(parte.travellers[0]!.numeroDocumento).toBe("12345678Z");
    expect(parte.travellers[0]!.direccion.municipio).toBe("Valencia");
  });

  it("reports completeness against expected guests", () => {
    expect(registryStatus([t({})], 2, "2026-10-10")).toMatchObject({ complete: false, missing: 1, valid: 1 });
    expect(registryStatus([t({}), t({ docNumber: "bad" })], 2, "2026-10-10")).toMatchObject({ invalid: 1 });
    expect(registryStatus([t({}), t({})], 2, "2026-10-10").complete).toBe(true);
  });
});
