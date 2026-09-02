import { describe, expect, it } from "vitest";
import { auditRetention, reservationRetention, scheduledMessageRetention } from "./retention";
import { planErasure, type SubjectBundle } from "./erasure";

const now = new Date("2026-09-02T00:00:00Z");

describe("reservationRetention", () => {
  it("deletes an abandoned hold past the window", () => {
    expect(
      reservationRetention(
        { status: "expired", source: "direct", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z", checkOut: "2026-09-10", holdExpiresAt: "2026-08-01T00:30:00Z" },
        now,
      ).action,
    ).toBe("delete");
  });

  it("keeps a fresh hold", () => {
    expect(
      reservationRetention(
        { status: "pending", source: "direct", createdAt: "2026-09-01T12:00:00Z", updatedAt: "2026-09-01T12:00:00Z", checkOut: "2026-10-10", holdExpiresAt: "2026-09-01T12:30:00Z" },
        now,
      ).action,
    ).toBe("keep");
  });

  it("anonymises an old cancelled reservation", () => {
    expect(
      reservationRetention(
        { status: "cancelled", source: "direct", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-05T00:00:00Z", checkOut: "2025-02-01", holdExpiresAt: null },
        now,
      ).action,
    ).toBe("anonymize");
  });

  it("anonymises contact on a stay finished 7 years ago", () => {
    expect(
      reservationRetention(
        { status: "confirmed", source: "direct", createdAt: "2019-01-01T00:00:00Z", updatedAt: "2019-01-01T00:00:00Z", checkOut: "2019-06-01", holdExpiresAt: null },
        now,
      ).action,
    ).toBe("anonymize");
  });

  it("keeps a recent confirmed stay", () => {
    expect(
      reservationRetention(
        { status: "confirmed", source: "direct", createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z", checkOut: "2026-07-10", holdExpiresAt: null },
        now,
      ).action,
    ).toBe("keep");
  });
});

describe("scheduledMessageRetention / auditRetention", () => {
  it("deletes an old sent message", () => {
    expect(scheduledMessageRetention({ status: "sent", updatedAt: "2026-01-01T00:00:00Z" }, now).action).toBe("delete");
  });
  it("keeps a planned message", () => {
    expect(scheduledMessageRetention({ status: "planned", updatedAt: "2020-01-01T00:00:00Z" }, now).action).toBe("keep");
  });
  it("trims an old audit row", () => {
    expect(auditRetention({ createdAt: "2020-01-01T00:00:00Z" }, now).action).toBe("delete");
  });
});

describe("planErasure", () => {
  const empty: SubjectBundle = {
    email: "g@example.com",
    customer: null,
    reservations: [],
    invoices: [],
    messages: [],
    couponRedemptionIds: [],
  };

  it("fully erases when there are no legal holds", () => {
    const plan = planErasure(
      {
        ...empty,
        reservations: [
          { id: "r1", code: "PV-1", status: "cancelled", source: "direct", checkOut: "2024-01-10", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-02T00:00:00Z" } as never,
        ],
      },
      now,
    );
    expect(plan.canFullyErase).toBe(true);
    expect(plan.items.find((i) => i.type === "reservation")?.action).toBe("delete");
  });

  it("blocks on an active future reservation", () => {
    const plan = planErasure(
      {
        ...empty,
        reservations: [
          { id: "r2", code: "PV-2", status: "confirmed", source: "direct", checkOut: "2026-12-20", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-01T00:00:00Z" } as never,
        ],
      },
      now,
    );
    expect(plan.canFullyErase).toBe(false);
    expect(plan.blockedReasons[0]).toMatch(/activa o es futura/);
  });

  it("keeps an invoice inside the fiscal window and anonymises its reservation", () => {
    const plan = planErasure(
      {
        ...empty,
        reservations: [
          { id: "r3", code: "PV-3", status: "confirmed", source: "direct", checkOut: "2025-02-01", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" } as never,
        ],
        invoices: [{ id: "i1", number: "JAV-25001", reservationId: "r3", issueDate: "2025-02-02" } as never],
      },
      now,
    );
    expect(plan.items.find((i) => i.type === "invoice")?.action).toBe("keep");
    expect(plan.items.find((i) => i.type === "reservation")?.action).toBe("anonymize");
    expect(plan.canFullyErase).toBe(false);
  });
});
