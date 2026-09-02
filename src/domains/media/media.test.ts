import { describe, expect, it } from "vitest";
import { extensionFor, focalToObjectPosition, isAllowedUpload } from "./types";

describe("isAllowedUpload", () => {
  it("accepts common images under the size cap", () => {
    expect(isAllowedUpload("image/jpeg", 1024).ok).toBe(true);
    expect(isAllowedUpload("image/webp", 5_000_000).ok).toBe(true);
  });
  it("rejects other types and oversize files", () => {
    expect(isAllowedUpload("application/zip", 10).ok).toBe(false);
    expect(isAllowedUpload("image/png", 20 * 1024 * 1024).ok).toBe(false);
  });
});

describe("focalToObjectPosition", () => {
  it("maps 0–1 fractions to a clamped percentage pair", () => {
    expect(focalToObjectPosition(0.5, 0.5)).toBe("50% 50%");
    expect(focalToObjectPosition(0, 1)).toBe("0% 100%");
    expect(focalToObjectPosition(-1, 2)).toBe("0% 100%");
  });
});

describe("extensionFor", () => {
  it("maps mimes to file extensions", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("application/pdf")).toBe("pdf");
    expect(extensionFor("weird/thing")).toBe("bin");
  });
});
