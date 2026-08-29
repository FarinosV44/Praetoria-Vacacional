import { describe, expect, it } from "vitest";
import { memoryRepository as repo } from "@/lib/repository/memory";
import { getAllProperties } from "@/domains/properties/registry";
import { draftInvoiceFromReservation } from "./draft";
import { numberingInsight, yearCodeOf } from "./numbering";
import { InvoiceLockedError, InvoiceNumberTakenError } from "@/lib/repository/types";

/**
 * Issue #56 "definición de terminado": the chain
 *   reserva → cliente → factura → (documento) → historial
 * must work end to end against the repository. This drives the memory backend
 * (DEMO mode); the supabase backend mirrors the same interface.
 */

const property = getAllProperties()[0]!;

describe("reserva → cliente → factura → historial", () => {
  it("registers a manual reservation, auto-links a customer, invoices it, and locks the invoice", async () => {
    const reservation = await repo.createManualReservation({
      propertyId: property.id,
      source: "booking",
      status: "external",
      checkIn: "2026-11-02",
      checkOut: "2026-11-06",
      guests: 3,
      totalCents: 48000,
      guestName: "Marta Ruiz",
      guestEmail: "marta.ruiz@example.com",
      guestDocNumber: "50000000T",
      externalLocator: "BK-99887766",
      paymentState: "paid",
    });
    expect(reservation.customerId).toBeTruthy();

    const customer = await repo.getCustomer(reservation.customerId!);
    expect(customer?.email).toBe("marta.ruiz@example.com");

    // a second reservation with the same email links the SAME customer (dedup)
    const again = await repo.createManualReservation({
      propertyId: property.id,
      source: "direct",
      status: "confirmed",
      checkIn: "2027-01-10",
      checkOut: "2027-01-12",
      guests: 2,
      totalCents: 20000,
      guestName: "Marta Ruiz",
      guestEmail: "marta.ruiz@example.com",
    });
    expect(again.customerId).toBe(reservation.customerId);

    const profile = await repo.customerProfile(reservation.customerId!);
    expect(profile?.reservationCount).toBe(2);
    expect(profile?.confirmedCount).toBe(1); // only the 'confirmed' one

    // draft an invoice from the first reservation
    const settings = await repo.invoiceSettings(property.id);
    const numbers = await repo.allInvoiceNumbers(property.id);
    const insight = numberingInsight(settings.series, yearCodeOf("2026-11-10"), numbers);
    const draftInput = draftInvoiceFromReservation({
      reservation,
      customer: customer ?? null,
      propertyName: property.name,
      settings,
      suggestedNumber: insight.suggestedNext,
      issueDate: "2026-11-10",
    });
    const draft = await repo.createInvoice(draftInput);
    expect(draft.status).toBe("draft");
    expect(draft.totalCents).toBe(48000);
    expect(draft.taxExempt).toBe(true);
    expect(draft.taxCents).toBe(0);

    // duplicate number rejected
    await expect(repo.createInvoice({ ...draftInput })).rejects.toBeInstanceOf(
      InvoiceNumberTakenError,
    );

    // issue → immutable
    const issued = await repo.issueInvoice(draft.id);
    expect(issued.status).toBe("issued");
    await expect(
      repo.updateInvoiceDraft(draft.id, { ...draftInput, notes: "cambio" }),
    ).rejects.toBeInstanceOf(InvoiceLockedError);
    await expect(repo.deleteInvoiceDraft(draft.id)).rejects.toBeInstanceOf(InvoiceLockedError);

    // status can still advance
    const paid = await repo.setInvoiceStatus(draft.id, "paid");
    expect(paid.status).toBe("paid");

    // it shows in the customer + reservation history
    const forReservation = await repo.invoicesForReservation(reservation.id);
    expect(forReservation.map((i) => i.id)).toContain(draft.id);
    const byCustomer = await repo.listInvoices({ customerId: reservation.customerId! });
    expect(byCustomer.map((i) => i.id)).toContain(draft.id);
  });
});
