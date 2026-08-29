import { describe, expect, it } from "vitest";
import { memoryRepository as repo } from "@/lib/repository/memory";
import { getAllProperties } from "@/domains/properties/registry";
import { draftInvoiceFromReservation } from "./draft";
import { numberingInsight, yearCodeOf } from "./numbering";
import { buildMonthGrid } from "@/domains/calendar/month";
import { matchSegment } from "@/domains/marketing/segments";
import { getRateConfig } from "@/content/rates";

/**
 * Issue #56 "Definición de terminado": the whole chain must work end to end
 *   reserva → cliente → factura → PDF (data) → calendario → historial → segmento
 * and everything must persist. Drives the memory backend (DEMO); the supabase
 * backend implements the identical interface.
 */

const property = getAllProperties()[0]!;

describe("reserva → cliente → factura → calendario → historial → segmento", () => {
  it("runs the full chain and persists every step", async () => {
    const checkIn = "2027-03-02";
    const checkOut = "2027-03-06";

    // 1. reserva (manual, Booking channel, held informationally)
    const reservation = await repo.createManualReservation({
      propertyId: property.id,
      source: "booking",
      status: "external",
      checkIn,
      checkOut,
      guests: 4,
      totalCents: 62000,
      guestName: "Clara Núñez",
      guestEmail: "clara.nunez@example.com",
      guestDocNumber: "44556677P",
      guestCountry: "España",
      externalLocator: "BK-CHAIN-1",
      paymentState: "paid",
    });

    // 2. cliente — auto-created + linked from the guest data
    expect(reservation.customerId).toBeTruthy();
    const customer = await repo.getCustomer(reservation.customerId!);
    expect(customer?.email).toBe("clara.nunez@example.com");

    // consent so the segment can include them
    await repo.updateCustomer(customer!.id, { marketingConsent: true, language: "es" });

    // 3. factura — drafted from the reservation, issued, immutable
    const settings = await repo.invoiceSettings(property.id);
    const numbers = await repo.allInvoiceNumbers(property.id);
    const insight = numberingInsight(settings.series, yearCodeOf("2027-03-10"), numbers);
    const draft = await repo.createInvoice(
      draftInvoiceFromReservation({
        reservation,
        customer: customer ?? null,
        propertyName: property.name,
        settings,
        suggestedNumber: insight.suggestedNext,
        issueDate: "2027-03-10",
      }),
    );
    const issued = await repo.issueInvoice(draft.id);
    expect(issued.status).toBe("issued");

    // 4. PDF (data) — the document renders purely from the frozen invoice
    const forDoc = await repo.getInvoice(draft.id);
    expect(forDoc?.billTo.name).toBe("Clara Núñez");
    expect(forDoc?.billTo.taxId).toBe("44556677P");
    expect(forDoc?.items.length).toBeGreaterThan(0);
    expect(forDoc?.totalCents).toBe(62000);
    expect(forDoc?.taxNote).toContain("20.Uno.23º");

    // 5. calendario — the month grid shows the reservation on its nights
    const config = getRateConfig(property.slug)!;
    const [blocks, dayRates, monthReservations] = await Promise.all([
      repo.listBlocks(property.id),
      repo.listDailyRates(property.id, "2027-03-01", "2027-04-15"),
      repo.listReservations({ propertyId: property.id, from: "2027-03-01", to: "2027-04-01" }),
    ]);
    const grid = buildMonthGrid({
      year: 2027,
      month: 3,
      config,
      reservations: monthReservations,
      blocks,
      dayRates,
      today: "2027-01-01",
    });
    const cell = grid.weeks.flat().find((c) => c.date === "2027-03-03")!;
    expect(cell.reservation?.source).toBe("booking");

    // 6. historial — invoice shows in the customer + reservation history
    expect((await repo.invoicesForReservation(reservation.id)).map((i) => i.id)).toContain(draft.id);
    const profile = await repo.customerProfile(customer!.id);
    // 'external' reservations don't count as confirmed spend, but the record is there
    expect(profile?.reservationCount).toBeGreaterThanOrEqual(1);

    // 7. segmento marketing — the customer is picked up by a matching segment
    const profiles = await repo.listCustomerProfiles();
    const mine = profiles.find((p) => p.id === customer!.id)!;
    expect(matchSegment({ consentOnly: true, channels: ["booking"], origin: "national" }, mine)).toBe(
      true,
    );
    expect(matchSegment({ origin: "foreign" }, mine)).toBe(false);

    const segment = await repo.createSegment({
      name: "Booking nacionales con consentimiento",
      criteria: { consentOnly: true, channels: ["booking"], origin: "national" },
    });
    const members = await repo.segmentMembers(segment.criteria);
    expect(members.map((m) => m.id)).toContain(customer!.id);

    // persistence: a fresh read returns the same issued invoice number
    expect((await repo.getInvoiceByNumber(issued.number))?.status).toBe("issued");
  });
});
