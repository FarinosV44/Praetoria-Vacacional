import "server-only";
import { getRepository } from "@/lib/repository";
import type { SubjectBundle } from "./erasure";

/**
 * Issue #79 — assemble everything held about an email address (access /
 * portability), and apply an approved erasure plan.
 */

export async function collectSubjectData(rawEmail: string): Promise<SubjectBundle> {
  const email = rawEmail.trim().toLowerCase();
  const repo = getRepository();

  const [customers, reservations, invoices] = await Promise.all([
    repo.listCustomers({ q: email }).catch(() => []),
    repo.listReservations({ q: email }).catch(() => []),
    repo.listInvoices().catch(() => []),
  ]);

  const customer =
    customers.find((c) => c.email?.toLowerCase() === email && !c.mergedInto) ?? null;

  const mine = reservations.filter(
    (r) => r.guestEmail?.toLowerCase() === email || (customer && r.customerId === customer.id),
  );

  const reservationIds = new Set(mine.map((r) => r.id));
  const myInvoices = invoices.filter(
    (inv) =>
      (inv.reservationId && reservationIds.has(inv.reservationId)) ||
      (customer && inv.customerId === customer.id),
  );

  const messages = (
    await Promise.all(mine.map((r) => repo.listReservationMessages(r.id).catch(() => [])))
  ).flat();

  return {
    email,
    customer,
    reservations: mine,
    invoices: myInvoices,
    messages,
    couponRedemptionIds: [],
  };
}

export interface DataExport {
  generatedAt: string;
  subject: string;
  customer: unknown;
  reservations: unknown[];
  invoices: unknown[];
  communications: unknown[];
  notes: string;
}

export function buildDataExport(bundle: SubjectBundle): DataExport {
  return {
    generatedAt: new Date().toISOString(),
    subject: bundle.email,
    customer: bundle.customer,
    reservations: bundle.reservations.map((r) => ({
      code: r.code,
      status: r.status,
      property: r.propertyId,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      guests: r.guests,
      guestName: r.guestName,
      guestEmail: r.guestEmail,
      guestPhone: r.guestPhone,
      totalCents: r.totalCents,
      createdAt: r.createdAt,
    })),
    invoices: bundle.invoices.map((i) => ({
      number: i.number,
      status: i.status,
      issueDate: i.issueDate,
      billTo: i.billTo,
      totalCents: i.totalCents,
    })),
    communications: bundle.messages.map((m) => ({
      kind: m.kind,
      status: m.status,
      sendAt: m.sendAt,
      sentAt: m.sentAt,
    })),
    notes:
      "Exportación generada bajo el derecho de acceso/portabilidad (RGPD art. 15 y 20). " +
      "Los importes y facturas se conservan por obligación fiscal.",
  };
}

export async function applyErasurePlan(
  bundle: SubjectBundle,
  plan: { items: { type: string; id: string; action: string }[] },
): Promise<{ deleted: number; anonymized: number }> {
  const repo = getRepository();
  let deleted = 0;
  let anonymized = 0;

  // Reservations first (deletes cascade to messages), then the customer.
  for (const item of plan.items) {
    if (item.type === "reservation") {
      if (item.action === "delete") {
        await repo.deleteReservationHard(item.id);
        deleted += 1;
      } else if (item.action === "anonymize") {
        await repo.anonymizeReservationContact(item.id);
        anonymized += 1;
      }
    }
  }
  for (const item of plan.items) {
    if (item.type === "customer" && bundle.customer) {
      if (item.action === "anonymize") {
        await repo.anonymizeCustomerContact(item.id);
        anonymized += 1;
      } else if (item.action === "delete") {
        await repo.anonymizeCustomerContact(item.id); // keep the row for referential safety
        anonymized += 1;
      }
    }
  }
  return { deleted, anonymized };
}
