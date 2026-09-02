import { describe, expect, it } from "vitest";
import { signUnsubToken, verifyUnsubToken } from "./unsubscribe";

describe("unsubscribe token", () => {
  it("round-trips an email, case-insensitively", () => {
    const t = signUnsubToken("Guest@Example.com");
    expect(verifyUnsubToken(t)).toBe("guest@example.com");
  });
  it("rejects tampering", () => {
    const t = signUnsubToken("a@b.com");
    expect(verifyUnsubToken(t.slice(0, -1) + "x")).toBeNull();
    expect(verifyUnsubToken("nope")).toBeNull();
  });
});
