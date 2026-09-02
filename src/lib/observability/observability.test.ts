import { describe, expect, it } from "vitest";
import { buildRecord, formatRecord, scrubFields } from "./logger";
import { buildEnvelope, parseDsn } from "./sentry";

describe("scrubFields", () => {
  it("redacts sensitive keys and flattens Errors", () => {
    const out = scrubFields({
      guestEmail: "a@b.com",
      authorization: "Bearer x",
      reservationId: "r1",
      err: new Error("boom"),
    });
    expect(out.guestEmail).toBe("[redacted]");
    expect(out.authorization).toBe("[redacted]");
    expect(out.reservationId).toBe("r1");
    expect(out.err).toEqual({ name: "Error", message: "boom" });
  });
});

describe("buildRecord / formatRecord", () => {
  it("carries level, message and scrubbed fields", () => {
    const rec = buildRecord("warn", "slow query", { ms: 900, token: "abc" }, new Date("2026-09-02T00:00:00Z"));
    expect(rec.level).toBe("warn");
    expect(rec.fields).toEqual({ ms: 900, token: "[redacted]" });
    expect(rec.time).toBe("2026-09-02T00:00:00.000Z");
    expect(formatRecord(rec)).toContain("slow query");
  });
});

describe("parseDsn", () => {
  it("returns null without a DSN", () => {
    expect(parseDsn(undefined)).toBeNull();
    expect(parseDsn("")).toBeNull();
    expect(parseDsn("not-a-url")).toBeNull();
  });

  it("extracts the ingest URL, public key and project id", () => {
    const t = parseDsn("https://abc123@o42.ingest.sentry.io/4509999");
    expect(t?.publicKey).toBe("abc123");
    expect(t?.projectId).toBe("4509999");
    expect(t?.url).toBe(
      "https://o42.ingest.sentry.io/api/4509999/envelope/?sentry_key=abc123&sentry_version=7",
    );
  });
});

describe("buildEnvelope", () => {
  it("produces a 3-line envelope with an exception when a stack is given", () => {
    const body = buildEnvelope({
      level: "error",
      message: "kaboom",
      errorName: "TypeError",
      stack: "Error: kaboom\n    at foo (/app/x.js:10:5)",
      environment: "production",
      eventId: "11111111-1111-1111-1111-111111111111",
      now: new Date("2026-09-02T00:00:00Z"),
    });
    const lines = body.trimEnd().split("\n");
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]!).event_id).toBe("11111111111111111111111111111111");
    expect(JSON.parse(lines[1]!)).toEqual({ type: "event" });
    const event = JSON.parse(lines[2]!);
    expect(event.level).toBe("error");
    expect(event.exception.values[0].type).toBe("TypeError");
    expect(event.exception.values[0].stacktrace.frames.length).toBeGreaterThan(0);
  });
});
