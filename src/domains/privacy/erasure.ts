/**
 * Issue #79 — pure erasure planning for a data-subject request.
 *
 * Some data legally cannot be deleted on request: an active/future booking, and
 * any invoice still inside the Spanish fiscal retention window (its `billTo`
 * name/NIF must be kept). Those records are anonymised where possible and the
 * reason is surfaced to the operator and, ultimately, the subject.
 */

import type { Reservation } from "@/domains/booking/types";
import type { Customer } from "@/domains/crm/types";
import type { Invoice } from "@/domains/invoicing/types";
import type { ScheduledMessage } from "@/domains/comms/types";
import { FISCAL_RETENTION_YEARS, type ErasureItem, type ErasurePlan } from "./types";

export interface SubjectBundle {
  email: string;
  customer: Customer | null;
  reservations: Reservation[];
  invoices: Invoice[];
  messages: ScheduledMessage[];
  couponRedemptionIds: string[];
}

function stayActive(r: Reservation, now: Date): boolean {
  if (r.status !== "pending" && r.status !== "confirmed") return false;
  return Date.parse(`${r.checkOut}T00:00:00Z`) >= now.getTime() - 86_400_000;
}

function invoiceInRetention(inv: Invoice, now: Date): boolean {
  const ref = Date.parse(`${inv.issueDate}T00:00:00Z`);
  return (now.getTime() - ref) / 365 / 86_400_000 < FISCAL_RETENTION_YEARS;
}

export function planErasure(bundle: SubjectBundle, now: Date = new Date()): ErasurePlan {
  const items: ErasureItem[] = [];
  const blocked: string[] = [];

  const invoicesByReservation = new Map<string, Invoice[]>();
  for (const inv of bundle.invoices) {
    if (inv.reservationId) {
      const list = invoicesByReservation.get(inv.reservationId) ?? [];
      list.push(inv);
      invoicesByReservation.set(inv.reservationId, list);
    }
  }

  for (const inv of bundle.invoices) {
    if (invoiceInRetention(inv, now)) {
      items.push({
        type: "invoice",
        id: inv.id,
        label: `Factura ${inv.number}`,
        action: "keep",
        reason: `conservación fiscal obligatoria (${FISCAL_RETENTION_YEARS} años · art. 30 CdC / art. 66 LGT)`,
      });
      blocked.push(`Factura ${inv.number} debe conservarse hasta cumplir el plazo fiscal.`);
    } else {
      items.push({
        type: "invoice",
        id: inv.id,
        label: `Factura ${inv.number}`,
        action: "anonymize",
        reason: "fuera del plazo fiscal; se conservan importes, se anonimiza el destinatario",
      });
    }
  }

  for (const r of bundle.reservations) {
    if (stayActive(r, now)) {
      items.push({
        type: "reservation",
        id: r.id,
        label: `Reserva ${r.code}`,
        action: "keep",
        reason: "reserva activa o futura; necesaria para prestar el servicio",
      });
      blocked.push(`Reserva ${r.code} está activa o es futura.`);
      continue;
    }
    const linkedInvoices = invoicesByReservation.get(r.id) ?? [];
    const invoiceLocked = linkedInvoices.some((inv) => invoiceInRetention(inv, now));
    if (invoiceLocked) {
      items.push({
        type: "reservation",
        id: r.id,
        label: `Reserva ${r.code}`,
        action: "anonymize",
        reason: "vinculada a una factura en plazo fiscal; se anonimiza el contacto, se conserva el registro contable",
      });
      blocked.push(`Reserva ${r.code} está vinculada a una factura en plazo fiscal.`);
    } else {
      items.push({
        type: "reservation",
        id: r.id,
        label: `Reserva ${r.code}`,
        action: "delete",
        reason: "sin obligación legal de conservación",
      });
    }
  }

  for (const m of bundle.messages) {
    items.push({
      type: "scheduled_message",
      id: m.id,
      label: `Mensaje ${m.kind}`,
      action: "delete",
      reason: "comunicación transaccional; sin obligación de conservación",
    });
  }

  for (const id of bundle.couponRedemptionIds) {
    items.push({
      type: "coupon_redemption",
      id,
      label: "Uso de código promocional",
      action: "anonymize",
      reason: "se conserva el recuento de usos, se elimina el email asociado",
    });
  }

  if (bundle.customer) {
    const anyKept = items.some((i) => i.action !== "delete");
    items.push({
      type: "customer",
      id: bundle.customer.id,
      label: "Ficha de cliente",
      action: anyKept ? "anonymize" : "delete",
      reason: anyKept
        ? "hay registros que deben conservarse; se anonimiza la ficha"
        : "sin registros que conservar",
    });
  }

  return {
    email: bundle.email,
    items,
    blockedReasons: [...new Set(blocked)],
    canFullyErase: blocked.length === 0,
  };
}
