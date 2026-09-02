import { describe, expect, it } from "vitest";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpired,
  inviteTokenMatches,
  resolveAdminAccess,
  sessionAcceptable,
  type AdminUser,
} from "./users";

const base: AdminUser = {
  id: "u1",
  email: "op@praetoria.es",
  fullName: "Op",
  role: "gestion",
  active: true,
  sessionsValidFrom: "2026-09-01T00:00:00Z",
  mfaRequired: false,
  invitedBy: null,
  inviteTokenHash: null,
  inviteExpiresAt: null,
  lastSeenAt: null,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

describe("resolveAdminAccess", () => {
  it("denies an unknown user", () => {
    expect(resolveAdminAccess(null)).toEqual({ ok: false, role: null, reason: "unknown" });
  });
  it("denies a pending invite", () => {
    expect(resolveAdminAccess({ ...base, inviteTokenHash: "abc" }).reason).toBe("invite_pending");
  });
  it("denies a deactivated user", () => {
    expect(resolveAdminAccess({ ...base, active: false }).reason).toBe("disabled");
  });
  it("allows an active user and returns its role", () => {
    expect(resolveAdminAccess(base)).toEqual({ ok: true, role: "gestion", reason: "ok" });
  });
});

describe("sessionAcceptable", () => {
  const validFrom = "2026-09-02T12:00:00Z";
  it("rejects a session minted before the revoke watermark", () => {
    expect(sessionAcceptable(Date.parse("2026-09-02T11:00:00Z"), validFrom)).toBe(false);
  });
  it("accepts a session minted after the watermark", () => {
    expect(sessionAcceptable(Date.parse("2026-09-02T12:30:00Z"), validFrom)).toBe(true);
  });
  it("accepts everything when the watermark is unparseable", () => {
    expect(sessionAcceptable(0, "not-a-date")).toBe(true);
  });
});

describe("invite tokens", () => {
  it("round-trips a generated token and rejects a wrong one", () => {
    const { raw, hash } = generateInviteToken();
    expect(hashInviteToken(raw)).toBe(hash);
    expect(inviteTokenMatches(raw, hash)).toBe(true);
    expect(inviteTokenMatches("wrong", hash)).toBe(false);
    expect(inviteTokenMatches(raw, null)).toBe(false);
  });
  it("detects expiry", () => {
    expect(inviteExpired({ inviteExpiresAt: "2026-09-01T00:00:00Z" }, Date.parse("2026-09-02T00:00:00Z"))).toBe(true);
    expect(inviteExpired({ inviteExpiresAt: null })).toBe(false);
  });
});
