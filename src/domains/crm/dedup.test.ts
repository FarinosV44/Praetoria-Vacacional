import { describe, expect, it } from "vitest";
import {
  findDuplicates,
  matchReasons,
  mergedFields,
  normalizeDoc,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "./dedup";
import type { Customer } from "./types";

const base: Customer = {
  id: "a",
  firstName: "Ana",
  lastName: "López",
  email: "ana@example.com",
  phone: "+34 649 18 12 90",
  whatsapp: null,
  docType: "dni",
  docNumber: "12345678Z",
  address: null,
  postalCode: null,
  city: null,
  province: null,
  country: null,
  language: null,
  channelOrigin: "direct",
  marketingConsent: false,
  marketingConsentAt: null,
  marketingConsentSource: null,
  notes: null,
  mergedInto: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const dup = (over: Partial<Customer>): Customer => ({ ...base, id: "b", ...over });

describe("normalizers", () => {
  it("email lowercases and trims", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });
  it("phone keeps the last 9 digits", () => {
    expect(normalizePhone("+34 649 18 12 90")).toBe("649181290");
    expect(normalizePhone("649181290")).toBe("649181290");
    expect(normalizePhone("0034649181290")).toBe("649181290");
  });
  it("doc strips separators and uppercases", () => {
    expect(normalizeDoc(" 12.345.678-z ")).toBe("12345678Z");
  });
  it("name strips accents and collapses spaces", () => {
    expect(normalizeName("  Ána   LÓPEZ ")).toBe("ana lopez");
  });
});

describe("matchReasons", () => {
  it("same email is a strong match", () => {
    const r = matchReasons(base, dup({ phone: null, docNumber: null }));
    expect(r.reasons).toContain("mismo email");
    expect(r.score).toBeGreaterThanOrEqual(3);
  });
  it("same document is a strong match even with different email", () => {
    const r = matchReasons(base, dup({ email: "other@example.com", phone: null }));
    expect(r.reasons).toContain("mismo documento");
  });
  it("phone formatted differently still matches", () => {
    const r = matchReasons(base, dup({ email: null, docNumber: null, phone: "649181290" }));
    expect(r.reasons).toContain("mismo teléfono");
  });
  it("name alone does not match without a contact point", () => {
    const r = matchReasons(base, dup({ email: null, phone: null, docNumber: null }));
    expect(r.reasons).toHaveLength(0);
  });
  it("name + shared contact adds the combined reason", () => {
    const r = matchReasons(base, dup({ docNumber: null }));
    expect(r.reasons).toContain("mismo nombre y contacto");
  });
});

describe("findDuplicates", () => {
  it("excludes self and already-merged records, sorts by score", () => {
    const all: Customer[] = [
      base,
      dup({ id: "b", email: "ana@example.com", phone: null, docNumber: null }),
      dup({ id: "c", docNumber: "12345678Z", email: null, phone: null }),
      dup({ id: "d", mergedInto: "x", email: "ana@example.com" }),
      dup({ id: "e", email: "nope@example.com", phone: "600000000", docNumber: null }),
    ];
    const found = findDuplicates(base, all);
    expect(found.map((f) => f.customer.id)).toEqual(["b", "c"]);
  });
});

describe("mergedFields", () => {
  it("primary wins where present, duplicate fills gaps, consent is OR-ed", () => {
    const primary = dup({
      id: "a",
      email: null,
      city: "Valencia",
      notes: "VIP",
      marketingConsent: false,
    });
    const duplicate = dup({
      id: "b",
      email: "found@example.com",
      city: "Teruel",
      notes: "reserva 2024",
      marketingConsent: true,
      marketingConsentAt: "2025-05-01T00:00:00Z",
      marketingConsentSource: "checkout",
    });
    const m = mergedFields(primary, duplicate);
    expect(m.email).toBe("found@example.com");
    expect(m.city).toBe("Valencia");
    expect(m.notes).toBe("VIP\n---\nreserva 2024");
    expect(m.marketingConsent).toBe(true);
    expect(m.marketingConsentAt).toBe("2025-05-01T00:00:00Z");
  });
});
