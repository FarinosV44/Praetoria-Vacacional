import { describe, expect, it } from "vitest";
import { assessFeedHealth, feedNeedsAttention } from "./feed-health";

const now = new Date("2026-08-31T12:00:00Z");

describe("assessFeedHealth (issue #84)", () => {
  it("never: no run recorded", () => {
    const r = assessFeedHealth({ lastRunAt: null, lastStatus: null, lastError: null }, { now });
    expect(r.health).toBe("never");
    expect(feedNeedsAttention(r.health)).toBe(false);
  });

  it("healthy: recent ok run", () => {
    const r = assessFeedHealth(
      { lastRunAt: "2026-08-31T06:00:00Z", lastStatus: "ok", lastError: null },
      { now },
    );
    expect(r.health).toBe("healthy");
    expect(Math.round(r.ageHours ?? -1)).toBe(6);
  });

  it("failing: last status is error", () => {
    const r = assessFeedHealth(
      { lastRunAt: "2026-08-31T06:00:00Z", lastStatus: "error", lastError: "HTTP 403" },
      { now },
    );
    expect(r.health).toBe("failing");
    expect(r.reason).toContain("403");
    expect(feedNeedsAttention(r.health)).toBe(true);
  });

  it("failing: an error message even with an ok-looking status", () => {
    const r = assessFeedHealth(
      { lastRunAt: "2026-08-31T11:00:00Z", lastStatus: "ok", lastError: "parse warning" },
      { now },
    );
    expect(r.health).toBe("failing");
  });

  it("stale: last ok run older than the threshold", () => {
    const r = assessFeedHealth(
      { lastRunAt: "2026-08-29T00:00:00Z", lastStatus: "ok", lastError: null },
      { now },
    );
    expect(r.health).toBe("stale");
    expect(feedNeedsAttention(r.health)).toBe(true);
  });

  it("respects a custom staleAfterHours", () => {
    const facts = { lastRunAt: "2026-08-31T06:00:00Z", lastStatus: "ok", lastError: null };
    expect(assessFeedHealth(facts, { now, staleAfterHours: 4 }).health).toBe("stale");
    expect(assessFeedHealth(facts, { now, staleAfterHours: 8 }).health).toBe("healthy");
  });
});
