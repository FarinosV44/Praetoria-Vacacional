import { describe, expect, it } from "vitest";
import { can } from "./roles";

describe("role capability matrix (issue #56 §10)", () => {
  it("admin can do everything including settings", () => {
    expect(can("admin", "settings.write")).toBe(true);
    expect(can("admin", "invoices.write")).toBe(true);
  });

  it("gestion operates but cannot change settings", () => {
    expect(can("gestion", "reservations.write")).toBe(true);
    expect(can("gestion", "invoices.write")).toBe(true);
    expect(can("gestion", "settings.write")).toBe(false);
  });

  it("lectura cannot write anything", () => {
    expect(can("lectura", "reservations.write")).toBe(false);
    expect(can("lectura", "customers.write")).toBe(false);
    expect(can("lectura", "settings.write")).toBe(false);
  });
});
