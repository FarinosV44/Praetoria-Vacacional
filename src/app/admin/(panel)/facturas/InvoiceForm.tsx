"use client";

import { useActionState, useState } from "react";
import type { InvoiceWithItems } from "@/domains/invoicing/types";
import type { PropertyContent } from "@/domains/properties/types";

type Result = { ok: true; id?: string } | { ok: false; error: string } | null;

interface Row {
  description: string;
  quantity: string;
  unitEuros: string;
}

const money = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export function InvoiceForm({
  action,
  invoice,
  property,
  suggestedNext,
}: {
  action: (prev: unknown, fd: FormData) => Promise<Exclude<Result, null>>;
  invoice: InvoiceWithItems;
  property: PropertyContent | undefined;
  suggestedNext: string;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  const [rows, setRows] = useState<Row[]>(
    invoice.items.length
      ? invoice.items.map((it) => ({
          description: it.description,
          quantity: String(it.quantity),
          unitEuros: (it.unitCents / 100).toFixed(2),
        }))
      : [{ description: "", quantity: "1", unitEuros: "0.00" }],
  );
  const [taxExempt, setTaxExempt] = useState(invoice.taxExempt);
  const [taxRate, setTaxRate] = useState(String(invoice.taxRate ?? 0));

  const subtotal = rows.reduce(
    (s, r) => s + Math.round((Number(r.quantity) || 0) * (Number(r.unitEuros) || 0) * 100),
    0,
  );
  const tax = taxExempt ? 0 : Math.round((subtotal * (Number(taxRate) || 0)) / 100);
  const total = subtotal + tax;

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const input =
    "h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm";
  const label = "mb-1 block text-xs text-[var(--color-ink-soft)]";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={invoice.id} />
      <input type="hidden" name="propertyId" value={invoice.propertyId} />
      {invoice.reservationId && (
        <input type="hidden" name="reservationId" value={invoice.reservationId} />
      )}
      {invoice.customerId && <input type="hidden" name="customerId" value={invoice.customerId} />}

      <div className="grid gap-3 sm:grid-cols-4">
        <label>
          <span className={label}>Serie</span>
          <input name="series" defaultValue={invoice.series} className={input} />
        </label>
        <label>
          <span className={label}>
            Número{" "}
            {suggestedNext && suggestedNext !== invoice.number && (
              <span className="text-[var(--accent-700)]">(sugerido {suggestedNext})</span>
            )}
          </span>
          <input name="number" defaultValue={invoice.number} className={`${input} font-mono`} />
        </label>
        <label>
          <span className={label}>Fecha de factura</span>
          <input
            type="date"
            name="issueDate"
            defaultValue={invoice.issueDate}
            className={input}
          />
        </label>
        <div>
          <span className={label}>Alojamiento</span>
          <p className="flex h-9 items-center text-sm">{property?.name ?? invoice.propertyId}</p>
        </div>
      </div>

      <fieldset className="rounded-xl border border-[var(--color-line)] p-3">
        <legend className="px-1 text-xs text-[var(--color-ink-soft)]">Cliente / destinatario</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-2">
            <span className={label}>Nombre / razón social</span>
            <input name="billName" defaultValue={invoice.billTo.name} className={input} />
          </label>
          <label>
            <span className={label}>DNI / NIF / CIF</span>
            <input name="billTaxId" defaultValue={invoice.billTo.taxId ?? ""} className={input} />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Dirección</span>
            <input name="billAddress" defaultValue={invoice.billTo.address ?? ""} className={input} />
          </label>
          <label>
            <span className={label}>CP</span>
            <input name="billPostal" defaultValue={invoice.billTo.postalCode ?? ""} className={input} />
          </label>
          <label>
            <span className={label}>Localidad</span>
            <input name="billCity" defaultValue={invoice.billTo.city ?? ""} className={input} />
          </label>
          <label>
            <span className={label}>Provincia</span>
            <input name="billProvince" defaultValue={invoice.billTo.province ?? ""} className={input} />
          </label>
          <label>
            <span className={label}>País</span>
            <input name="billCountry" defaultValue={invoice.billTo.country ?? ""} className={input} />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Email</span>
            <input name="billEmail" defaultValue={invoice.billTo.email ?? ""} className={input} />
          </label>
        </div>
      </fieldset>

      <div>
        <p className="mb-2 text-xs text-[var(--color-ink-soft)]">Líneas</p>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input
                name="itemDescription"
                value={r.description}
                onChange={(e) => setRow(i, { description: e.target.value })}
                placeholder="Descripción"
                className={`${input} col-span-6`}
              />
              <input
                name="itemQuantity"
                value={r.quantity}
                onChange={(e) => setRow(i, { quantity: e.target.value })}
                inputMode="decimal"
                placeholder="Cant."
                className={`${input} col-span-2`}
              />
              <input
                name="itemUnitEuros"
                value={r.unitEuros}
                onChange={(e) => setRow(i, { unitEuros: e.target.value })}
                inputMode="decimal"
                placeholder="€/ud."
                className={`${input} col-span-2`}
              />
              <div className="col-span-1 flex h-9 items-center justify-end text-sm">
                {money(Math.round((Number(r.quantity) || 0) * (Number(r.unitEuros) || 0) * 100))}
              </div>
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                className="col-span-1 text-sm text-red-600"
                aria-label="Eliminar línea"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRows((rs) => [...rs, { description: "", quantity: "1", unitEuros: "0.00" }])
          }
          className="mt-2 text-sm text-[var(--accent-700)] hover:underline"
        >
          + Añadir línea
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="taxExempt"
            value="true"
            checked={taxExempt}
            onChange={(e) => setTaxExempt(e.target.checked)}
          />
          Operación exenta de IVA
        </label>
        <label>
          <span className={label}>Tipo de IVA (%)</span>
          <input
            name="taxRate"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            inputMode="decimal"
            disabled={taxExempt}
            className={input}
          />
        </label>
      </div>
      <label className="block">
        <span className={label}>Texto fiscal</span>
        <input
          name="taxNote"
          defaultValue={invoice.taxNote ?? ""}
          className={input}
          placeholder="Operación exenta de IVA según el artículo 20.Uno.23º de la Ley 37/1992 (LIVA)."
        />
      </label>
      <label className="block">
        <span className={label}>Notas (opcional)</span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={invoice.notes ?? ""}
          className="w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        />
      </label>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm">
        <div className="flex justify-between">
          <span>Base</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--color-ink-soft)]">
          <span>IVA {taxExempt ? "(exenta)" : `(${taxRate || 0}%)`}</span>
          <span>{money(tax)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-[var(--color-line)] pt-1 font-medium">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-green-700">Borrador guardado.</p>}
      <button
        className="h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
        disabled={pending}
      >
        {pending ? "Guardando…" : "Guardar borrador"}
      </button>
    </form>
  );
}
