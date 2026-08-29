import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatDateLong } from "@/lib/format";
import { INVOICE_STATUS_LABEL } from "@/domains/invoicing/types";
import { numberingInsight, yearCodeOf } from "@/domains/invoicing/numbering";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { InvoiceForm } from "../InvoiceForm";
import {
  saveInvoiceDraftAction,
  issueInvoiceAction,
  setInvoiceStatusAction,
  deleteInvoiceDraftAction,
} from "@/domains/invoicing/actions";

export const metadata = { title: "Factura" };

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const invoice = await repo.getInvoice(id);
  if (!invoice) notFound();

  const property = getPropertyById(invoice.propertyId);
  const numbers = await repo.allInvoiceNumbers(invoice.propertyId);
  const insight = numberingInsight(
    invoice.series,
    yearCodeOf(invoice.issueDate),
    numbers.filter((n) => n !== invoice.number),
  );
  const isDraft = invoice.status === "draft";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/facturas" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Facturas
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-mono">{invoice.number}</h1>
          <span className="rounded-full bg-[var(--accent-50)] px-2 py-0.5 text-xs text-[var(--accent-700)]">
            {INVOICE_STATUS_LABEL[invoice.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {property?.name} · {formatDateLong(invoice.issueDate)} · {formatMoney(invoice.totalCents)}
          {invoice.reservationId && (
            <>
              {" · "}
              <Link
                className="text-[var(--accent-700)] hover:underline"
                href={`/admin/reservas/${invoice.reservationId}`}
              >
                ver reserva
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/facturas/${invoice.id}/documento`}
          target="_blank"
          className="h-10 rounded-lg border border-[var(--color-line)] px-4 text-sm leading-10"
        >
          Ver / descargar documento
        </Link>
        {isDraft && (
          <form action={issueInvoiceAction}>
            <input type="hidden" name="id" value={invoice.id} />
            <ConfirmSubmit
              message={`Emitir la factura ${invoice.number}. Tras emitirla no podrá modificarse (solo anularse). ¿Continuar?`}
            >
              Emitir factura
            </ConfirmSubmit>
          </form>
        )}
        {(invoice.status === "issued" || invoice.status === "paid") && (
          <>
            {invoice.status === "issued" && (
              <form action={setInvoiceStatusAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="status" value="paid" />
                <button className="h-10 rounded-lg border border-[var(--color-line)] px-4 text-sm">
                  Marcar cobrada
                </button>
              </form>
            )}
            <form action={setInvoiceStatusAction}>
              <input type="hidden" name="id" value={invoice.id} />
              <input type="hidden" name="status" value="void" />
              <ConfirmSubmit
                message={`Anular la factura ${invoice.number}. Queda registrada como anulada (no se elimina). ¿Continuar?`}
              >
                Anular
              </ConfirmSubmit>
            </form>
          </>
        )}
        {isDraft && (
          <form action={deleteInvoiceDraftAction}>
            <input type="hidden" name="id" value={invoice.id} />
            <ConfirmSubmit message={`Eliminar el borrador ${invoice.number}. ¿Continuar?`}>
              Eliminar borrador
            </ConfirmSubmit>
          </form>
        )}
      </div>

      {isDraft ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
          <InvoiceForm
            action={saveInvoiceDraftAction}
            invoice={invoice}
            property={property}
            suggestedNext={insight.suggestedNext}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm">
          <p className="text-[var(--color-ink-soft)]">
            Factura emitida — inmutable. Para corregir un error, anúlala y emite una nueva.
          </p>
          <table className="mt-3 w-full">
            <tbody className="divide-y divide-[var(--color-line)]">
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{formatMoney(it.unitCents)}</td>
                  <td className="py-2 text-right">{formatMoney(it.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 space-y-0.5 text-right">
            <p>Base: {formatMoney(invoice.subtotalCents)}</p>
            <p className="text-[var(--color-ink-soft)]">
              IVA {invoice.taxExempt ? "(exenta)" : `(${invoice.taxRate}%)`}:{" "}
              {formatMoney(invoice.taxCents)}
            </p>
            <p className="font-medium">Total: {formatMoney(invoice.totalCents)}</p>
          </div>
          {invoice.taxNote && (
            <p className="mt-3 text-xs text-[var(--color-ink-soft)]">{invoice.taxNote}</p>
          )}
        </div>
      )}
    </div>
  );
}
