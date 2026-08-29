import Link from "next/link";
import { CustomerForm } from "../CustomerForm";
import { createCustomerAndRedirect } from "@/domains/crm/actions";

export const metadata = { title: "Nuevo cliente" };

export default function NuevoClientePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/clientes" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Clientes
        </Link>
        <h1 className="mt-1 font-display text-2xl">Nuevo cliente</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Puedes crear un cliente sin que exista todavía una reserva.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <CustomerForm action={createCustomerAndRedirect} submitLabel="Crear cliente" />
      </div>
    </div>
  );
}
