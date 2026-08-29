import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getAllProperties } from "@/domains/properties/registry";
import { saveInvoiceSettingsAction } from "@/domains/invoicing/actions";
import { InvoiceSettingsForm } from "./InvoiceSettingsForm";

export const metadata = { title: "Ajustes de facturación" };

export default async function InvoiceSettingsPage() {
  const repo = getRepository();
  const properties = getAllProperties();
  const settings = await Promise.all(properties.map((p) => repo.invoiceSettings(p.id)));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/facturas" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Facturas
        </Link>
        <h1 className="mt-1 font-display text-2xl">Ajustes de facturación</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Serie y fiscalidad por alojamiento. La fiscalidad es configurable: hoy ambas operan como
          exentas de IVA (art. 20.Uno.23º LIVA); si en el futuro cambia, ajústalo aquí.
        </p>
      </div>
      {properties.map((p, i) => (
        <div key={p.id} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
          <InvoiceSettingsForm
            action={saveInvoiceSettingsAction}
            propertySlug={p.slug}
            propertyName={p.name}
            settings={settings[i]!}
          />
        </div>
      ))}
    </div>
  );
}
