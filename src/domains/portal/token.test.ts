import { describe, expect, it } from "vitest";
import { signPortalToken, verifyPortalToken } from "./token";

describe("portal token", () => {
  it("round-trips a reservation id", () => {
    const t = signPortalToken("res-123");
    expect(verifyPortalToken(t)).toBe("res-123");
  });

  it("rejects a tampered token", () => {
    const t = signPortalToken("res-123");
    expect(verifyPortalToken(t.slice(0, -2) + "xy")).toBeNull();
    expect(verifyPortalToken("garbage")).toBeNull();
    expect(verifyPortalToken("a.b.c")).toBeNull();
  });

  it("rejects an expired token", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    const t = signPortalToken("res-123", past);
    expect(verifyPortalToken(t)).toBeNull();
  });

  it("does not confuse two ids", () => {
    const t = signPortalToken("res-A");
    expect(verifyPortalToken(t)).not.toBe("res-B");
  });
});
