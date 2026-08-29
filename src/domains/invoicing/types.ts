import type { IsoDate } from "@/lib/dates";

export type InvoiceStatus = "draft" | "issued" | "paid" | "void" | "rectified";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  issued: "Emitida",
  paid: "Cobrada",
  void: "Anulada",
  rectified: "Rectificada",
};

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitCents: number;
}

export interface InvoiceItem extends InvoiceItemInput {
  id: string;
  invoiceId: string;
  position: number;
  amountCents: number;
}

export interface InvoiceBillTo {
  name: string;
  taxId: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  email: string | null;
}

export interface Invoice {
  id: string;
  propertyId: string;
  reservationId: string | null;
  customerId: string | null;
  series: string;
  number: string;
  status: InvoiceStatus;
  issueDate: IsoDate;
  billTo: InvoiceBillTo;
  subtotalCents: number;
  taxRate: number; // percent
  taxCents: number;
  totalCents: number;
  taxExempt: boolean;
  taxNote: string | null;
  currency: "EUR";
  notes: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceSettings {
  propertyId: string;
  series: string;
  taxRate: number;
  taxExempt: boolean;
  taxNote: string;
}

export interface InvoiceFilter {
  propertyId?: string;
  series?: string;
  status?: InvoiceStatus[];
  customerId?: string;
  q?: string;
}

export interface CreateInvoiceInput {
  propertyId: string;
  reservationId?: string | null;
  customerId?: string | null;
  series: string;
  number: string;
  issueDate: IsoDate;
  billTo: InvoiceBillTo;
  taxExempt: boolean;
  taxRate: number;
  taxNote: string | null;
  notes?: string | null;
  items: InvoiceItemInput[];
}

export const DEFAULT_TAX_NOTE =
  "Operación exenta de IVA según el artículo 20.Uno.23º de la Ley 37/1992 (LIVA).";

/** Default series prefix for a property slug (overridable in invoice_settings). */
export function defaultSeriesFor(slug: string): string {
  if (slug === "javalambre") return "JAV";
  if (slug === "valencia") return "PALM";
  return slug.replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase() || "FAC";
}
