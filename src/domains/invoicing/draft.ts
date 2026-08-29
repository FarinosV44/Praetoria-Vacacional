import type { Reservation } from "@/domains/booking/types";
import type { Customer } from "@/domains/crm/types";
import { nightsLabel, formatRange } from "@/lib/format";
import type { CreateInvoiceInput, InvoiceBillTo, InvoiceSettings } from "./types";

/**
 * Build a ready-to-edit invoice draft from a reservation (issue #56 §3
 * "Emitir factura"). Pre-fills the billing party from the linked customer (or
 * the reservation's own guest fields), one line item for the stay, the correct
 * series and the property's tax configuration. The admin edits before issuing.
 */
export function draftInvoiceFromReservation(args: {
  reservation: Reservation;
  customer: Customer | null;
  propertyName: string;
  settings: InvoiceSettings;
  suggestedNumber: string;
  issueDate: string;
}): CreateInvoiceInput {
  const { reservation: r, customer: c, propertyName, settings } = args;

  const name =
    (c ? [c.firstName, c.lastName].filter(Boolean).join(" ") : r.guestName)?.trim() || "";

  const billTo: InvoiceBillTo = {
    name,
    taxId: c?.docNumber ?? r.guestDocNumber ?? null,
    address: c?.address ?? r.guestAddress ?? null,
    postalCode: c?.postalCode ?? r.guestPostalCode ?? null,
    city: c?.city ?? r.guestCity ?? null,
    province: c?.province ?? r.guestProvince ?? null,
    country: c?.country ?? r.guestCountry ?? null,
    email: c?.email ?? r.guestEmail ?? null,
  };

  return {
    propertyId: r.propertyId,
    reservationId: r.id,
    customerId: r.customerId,
    series: settings.series,
    number: args.suggestedNumber,
    issueDate: args.issueDate,
    billTo,
    taxExempt: settings.taxExempt,
    taxRate: settings.taxRate,
    taxNote: settings.taxExempt ? settings.taxNote : null,
    notes: null,
    items: [
      {
        description: `Estancia en ${propertyName} · ${nightsLabel(r.nights)} · ${formatRange(
          r.checkIn,
          r.checkOut,
        )}`,
        quantity: 1,
        unitCents: r.totalCents,
      },
    ],
  };
}
