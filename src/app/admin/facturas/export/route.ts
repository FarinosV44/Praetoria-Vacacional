import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import { getPropertyById, getPropertyBySlug } from "@/domains/properties/registry";
import { toCsv, csvResponse } from "@/lib/csv";
import type { InvoiceStatus } from "@/domains/invoicing/types";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new Response("No autorizado", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const repo = getRepository();

  const invoices = await repo.listInvoices({
    propertyId: getPropertyBySlug(sp.get("property") ?? "")?.id,
    status: sp.get("status") ? [sp.get("status") as InvoiceStatus] : undefined,
    q: sp.get("q") || undefined,
  });

  const body = toCsv(
    [
      "numero",
      "serie",
      "fecha",
      "alojamiento",
      "estado",
      "cliente",
      "nif",
      "email",
      "base_eur",
      "iva_eur",
      "total_eur",
      "exenta",
      "reserva_id",
      "emitida",
    ],
    invoices.map((inv) => [
      inv.number,
      inv.series,
      inv.issueDate,
      getPropertyById(inv.propertyId)?.name ?? inv.propertyId,
      inv.status,
      inv.billTo.name,
      inv.billTo.taxId,
      inv.billTo.email,
      (inv.subtotalCents / 100).toFixed(2),
      (inv.taxCents / 100).toFixed(2),
      (inv.totalCents / 100).toFixed(2),
      inv.taxExempt ? "si" : "no",
      inv.reservationId,
      inv.issuedAt ? inv.issuedAt.slice(0, 10) : "",
    ]),
  );
  return csvResponse("facturas.csv", body);
}
