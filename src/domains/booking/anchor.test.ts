import { describe, expect, it } from "vitest";
import { bookingSectionId, bookingSectionHref } from "./anchor";

describe("booking section anchor (issue #55)", () => {
  it("is stable and per-property", () => {
    expect(bookingSectionId("javalambre")).toBe("reserva-javalambre");
    expect(bookingSectionId("valencia")).toBe("reserva-valencia");
  });

  it("href is the id as a fragment", () => {
    expect(bookingSectionHref("javalambre")).toBe("#reserva-javalambre");
    expect(bookingSectionHref("valencia")).toBe("#reserva-valencia");
  });

  it("never collides with the shared `contenido` landmark id", () => {
    for (const slug of ["javalambre", "valencia"]) {
      expect(bookingSectionId(slug)).not.toBe("contenido");
      expect(bookingSectionHref(slug)).not.toBe("#contenido");
    }
  });
});
