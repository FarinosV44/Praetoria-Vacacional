import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { portalDataForToken } from "@/domains/portal/service";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Factura", robots: { index: false, follow: false } };

export default async function PortalInvoicePage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const data = await portalDataForToken(token);
  if (!data) notFound();

  const invoice = await getRepository().getInvoice(id);
  // The invoice must belong to this guest's reservation and be issued.
  if (
    !invoice ||
    invoice.reservationId !== data.reservation.id ||
    invoice.status === "draft"
  ) {
    notFound();
  }

  return (
    <div style={{ background: "#eef1f6", minHeight: "100dvh", padding: "24px 12px" }}>
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          body { background: #fff !important; }
          .doc-wrap { box-shadow: none !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print" style={{ maxWidth: 760, margin: "0 auto 12px", display: "flex", gap: 8 }}>
        <PrintButton />
        <a
          href={`/mi-reserva/${token}`}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #ccd2df",
            color: "#1f2937",
            textDecoration: "none",
          }}
        >
          ← Volver
        </a>
      </div>
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
