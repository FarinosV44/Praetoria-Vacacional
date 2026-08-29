import { describe, expect, it } from "vitest";
import {
  company,
  companyAddressOneLine,
  companyLegalParagraph,
  companyRegistryLine,
  companyShortIdentification,
} from "./company";
import { legalDocs, operator } from "./legal";

const NO_PLACEHOLDER = /\[\[PENDIENTE/;

describe("company (PRAETORIA, S.L.) — issue #56 Part A", () => {
  it("carries the real corporate identifiers", () => {
    expect(company.legalName).toBe("PRAETORIA, S.L.");
    expect(company.taxId).toBe("B21810452");
    expect(company.mercantileRegistry.irus).toBe("1000449168073");
    expect(company.soleDirector).toBe("Juan José Farinós Ibáñez");
  });

  it("has no pending placeholders anywhere in the company data", () => {
    expect(JSON.stringify(company)).not.toMatch(NO_PLACEHOLDER);
  });

  it("builds the address and registry lines from the single source", () => {
    expect(companyAddressOneLine()).toBe(
      "Calle Pintor Francisco Ribalta, 4A, 46540 El Puig de Santa Maria, Valencia, España",
    );
    expect(companyRegistryLine()).toContain("Registro Mercantil de Valencia");
    expect(companyRegistryLine()).toContain("V-225491");
    expect(companyShortIdentification()).toBe("PRAETORIA, S.L. · NIF B21810452");
  });

  it("the legal paragraph contains every mandatory datum", () => {
    const p = companyLegalParagraph();
    for (const needle of [
      "PRAETORIA, S.L.",
      "B21810452",
      "Registro Mercantil de Valencia",
      "V-225491",
      "1000449168073",
      "info@praetoriaabogados.com",
      "+34 649181290",
    ]) {
      expect(p).toContain(needle);
    }
  });
});

describe("legal.ts derives identification from company.ts", () => {
  it("operator is the real company, not a placeholder", () => {
    expect(operator.legalName).toBe("PRAETORIA, S.L.");
    expect(operator.taxId).toBe("B21810452");
    expect(JSON.stringify(operator)).not.toMatch(NO_PLACEHOLDER);
  });

  it("the aviso legal renders the full registry data and no placeholders", () => {
    const aviso = JSON.stringify(legalDocs["aviso-legal"]);
    expect(aviso).not.toMatch(NO_PLACEHOLDER);
    expect(aviso).toContain("IRUS 1000449168073");
    expect(aviso).toContain("Juan José Farinós Ibáñez");
    expect(aviso).toContain("3 de abril de 2025");
  });

  it("privacy policy names the data controller with NIF and address", () => {
    const priv = JSON.stringify(legalDocs["privacidad"]);
    expect(priv).toContain("B21810452");
    expect(priv).toContain("El Puig de Santa Maria");
  });

  it("keeps aviso legal / privacidad / cookies / condiciones as separate docs", () => {
    expect(Object.keys(legalDocs).sort()).toEqual(
      ["aviso-legal", "condiciones-reserva", "cookies", "privacidad"].sort(),
    );
  });
});
