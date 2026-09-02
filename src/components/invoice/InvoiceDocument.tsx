import { getPropertyById, experienceMeta } from "@/domains/properties/registry";
import { formatDateLong } from "@/lib/format";
import { company, companyAddressOneLine, companyRegistryLine } from "@/content/company";
import { INVOICE_STATUS_LABEL, type InvoiceWithItems } from "@/domains/invoicing/types";

/**
 * The branded invoice document body — shared by the admin viewer
 * (`/admin/facturas/[id]/documento`) and the passwordless guest portal
 * (`/mi-reserva/[token]/factura/[id]`, issue #68). Pure presentation.
 */

const money = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
const qty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const ACCENT: Record<string, string> = { ski: "#0b6bb3", sea: "#c47f1a" };

export function InvoiceDocument({ invoice }: { invoice: InvoiceWithItems }) {
  const property = getPropertyById(invoice.propertyId);
  const experience = property?.experience ?? "sea";
  const accent = ACCENT[experience] ?? "#1f3a6b";
  const brandLabel =
    property?.name ?? (experience === "ski" ? "Javalambre Mountain SuperSki" : "Valencia Frente al Mar");
  const voided = invoice.status === "void" || invoice.status === "rectified";

  return (
    <div
      className="doc-wrap"
      style={{
        maxWidth: 760,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 4,
        boxShadow: "0 1px 6px rgba(0,0,0,.12)",
        padding: 40,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#1a1a1a",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderTop: `4px solid ${accent}`,
          paddingTop: 16,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: accent }}>{brandLabel}</p>
          <p style={{ margin: "2px 0 0", color: "#666" }}>
            {experienceMeta[experience]?.label} · Reserva directa
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: ".04em" }}>FACTURA</p>
          <p style={{ margin: "2px 0 0", fontFamily: "ui-monospace, monospace", fontSize: 15 }}>
            {invoice.number}
          </p>
          <p style={{ margin: "2px 0 0", color: "#666" }}>Fecha: {formatDateLong(invoice.issueDate)}</p>
          {voided && (
            <p style={{ margin: "4px 0 0", color: "#b91c1c", fontWeight: 700 }}>
              {INVOICE_STATUS_LABEL[invoice.status].toUpperCase()}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 32, marginTop: 28 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#888" }}>Emisor</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{company.legalName}</p>
          <p style={{ margin: 0 }}>NIF {company.taxId}</p>
          <p style={{ margin: 0 }}>{companyAddressOneLine()}</p>
          <p style={{ margin: 0 }}>{company.email}</p>
          <p style={{ margin: 0 }}>{company.phone}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#888" }}>Cliente</p>
          <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{invoice.billTo.name || "—"}</p>
          {invoice.billTo.taxId && <p style={{ margin: 0 }}>{invoice.billTo.taxId}</p>}
          {invoice.billTo.address && <p style={{ margin: 0 }}>{invoice.billTo.address}</p>}
          {(invoice.billTo.postalCode || invoice.billTo.city) && (
            <p style={{ margin: 0 }}>
              {[invoice.billTo.postalCode, invoice.billTo.city].filter(Boolean).join(" ")}
            </p>
          )}
          {(invoice.billTo.province || invoice.billTo.country) && (
            <p style={{ margin: 0 }}>
              {[invoice.billTo.province, invoice.billTo.country].filter(Boolean).join(", ")}
            </p>
          )}
          {invoice.billTo.email && <p style={{ margin: 0 }}>{invoice.billTo.email}</p>}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 28 }}>
        <thead>
          <tr style={{ background: "#f4f6fb", textAlign: "left" }}>
            <th style={{ padding: "8px 10px", fontSize: 11, textTransform: "uppercase", color: "#666" }}>
              Descripción
            </th>
            <th style={{ padding: "8px 10px", fontSize: 11, textTransform: "uppercase", color: "#666", textAlign: "right" }}>
              Cantidad
            </th>
            <th style={{ padding: "8px 10px", fontSize: 11, textTransform: "uppercase", color: "#666", textAlign: "right" }}>
              Precio unitario
            </th>
            <th style={{ padding: "8px 10px", fontSize: 11, textTransform: "uppercase", color: "#666", textAlign: "right" }}>
              Coste
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eef1f6" }}>
              <td style={{ padding: "10px" }}>{it.description}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{qty(it.quantity)}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{money(it.unitCents)}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{money(it.amountCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <table style={{ borderCollapse: "collapse", minWidth: 260 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 10px", color: "#666" }}>Base imponible</td>
              <td style={{ padding: "4px 10px", textAlign: "right" }}>{money(invoice.subtotalCents)}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 10px", color: "#666" }}>
                IVA {invoice.taxExempt ? "(exenta)" : `(${invoice.taxRate}%)`}
              </td>
              <td style={{ padding: "4px 10px", textAlign: "right" }}>{money(invoice.taxCents)}</td>
            </tr>
            <tr style={{ borderTop: "2px solid #1a1a1a" }}>
              <td style={{ padding: "6px 10px", fontWeight: 700 }}>Total</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700 }}>
                {money(invoice.totalCents)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {invoice.taxNote && <p style={{ marginTop: 24, fontSize: 12, color: "#444" }}>{invoice.taxNote}</p>}
      {invoice.notes && (
        <p style={{ marginTop: 8, fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>{invoice.notes}</p>
      )}

      <p style={{ marginTop: 40, paddingTop: 12, borderTop: "1px solid #eef1f6", fontSize: 11, color: "#999" }}>
        {company.legalName} ({company.legalForm}) · NIF {company.taxId}. {companyRegistryLine()}
      </p>
    </div>
  );
}
