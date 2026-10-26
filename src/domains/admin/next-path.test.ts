import { describe, expect, it } from "vitest";
import { safeAdminNext } from "./next-path";

describe("safeAdminNext", () => {
  it("keeps admin paths, including the phone app start screen", () => {
    expect(safeAdminNext("/admin/movil")).toBe("/admin/movil");
    expect(safeAdminNext("/admin/movil/precios?alojamiento=valencia")).toBe("/admin/movil/precios?alojamiento=valencia");
  });
  it("falls back to the dashboard for anything else", () => {
    for (const bad of [null, "", "/", "https://evil.example/admin", "//evil.example", "/reservar/x", "/admin/login", "/admin\\@evil"]) {
      expect(safeAdminNext(bad)).toBe("/admin");
    }
  });
});
