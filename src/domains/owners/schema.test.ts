import { describe, expect, it } from "vitest";
import { ownerLeadFormSchema } from "./schema";

const valid = {
  name: "María García",
  phone: "+34 600 123 456",
  email: "maria@example.com",
  zone: "llastra-palmeres",
  location: "primera-linea",
  bedrooms: "3",
  licence: "no-se",
  onPlatforms: "on",
  message: "Apartamento en primera línea, libre en verano.",
  consent: "on",
  website: "",
};

describe("ownerLeadFormSchema", () => {
  it("accepts a complete lead and normalises types", () => {
    const r = ownerLeadFormSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.bedrooms).toBe(3);
    expect(r.data.onPlatforms).toBe(true);
  });

  it("treats optional fields as empty", () => {
    const rest: Record<string, string> = { ...valid };
    delete rest.bedrooms;
    delete rest.onPlatforms;
    delete rest.message;
    const r = ownerLeadFormSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.bedrooms).toBeNull();
    expect(r.data.onPlatforms).toBe(false);
    expect(r.data.message).toBe("");
  });

  it("requires privacy consent", () => {
    const rest: Record<string, string> = { ...valid };
    delete rest.consent;
    const r = ownerLeadFormSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path[0] === "consent")).toBe(true);
  });

  it("rejects unknown zones, bad emails and bad phones", () => {
    expect(ownerLeadFormSchema.safeParse({ ...valid, zone: "marbella" }).success).toBe(false);
    expect(ownerLeadFormSchema.safeParse({ ...valid, email: "no-es-correo" }).success).toBe(false);
    expect(ownerLeadFormSchema.safeParse({ ...valid, phone: "llámame" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(ownerLeadFormSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
  });

  it("rejects an absurd number of bedrooms", () => {
    expect(ownerLeadFormSchema.safeParse({ ...valid, bedrooms: "99" }).success).toBe(false);
  });
});
