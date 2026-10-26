import { describe, expect, it } from "vitest";
import { reservationPushMessage } from "./push-message";

describe("reservationPushMessage", () => {
  const base = {
    id: "11111111-1111-4111-8111-111111111111",
    code: "PV-ABC123",
    checkIn: "2027-01-15",
    checkOut: "2027-01-17",
    nights: 2,
    guests: 4,
    totalCents: 50000,
    guestName: "María López",
  };

  it("names the property and summarises dates, guests and total", () => {
    const m = reservationPushMessage(base, "Javalambre Mountain SuperSki");
    expect(m.title).toBe("Nueva reserva · Javalambre Mountain SuperSki");
    expect(m.body).toContain("2 noches");
    expect(m.body).toContain("4 huéspedes");
    expect(m.body).toMatch(/500\s?€/);
    expect(m.body).toContain("María López");
  });

  it("opens the reservation in the admin and dedupes by code", () => {
    const m = reservationPushMessage(base, "X");
    expect(m.url).toBe(`/admin/reservas/${base.id}`);
    expect(m.tag).toBe("reserva-PV-ABC123");
  });

  it("omits the guest when there is no name", () => {
    const m = reservationPushMessage({ ...base, guestName: null }, "X");
    expect(m.body.endsWith("€")).toBe(true);
  });
});
