"use client";

import { useActionState } from "react";
import type { Customer } from "@/domains/crm/types";

type Result = { ok: true; id?: string } | { ok: false; error: string } | null;

const CHANNELS = [
  ["", "—"],
  ["direct", "Web directa"],
  ["booking", "Booking.com"],
  ["airbnb", "Airbnb"],
  ["manual", "Manual"],
  ["other", "Otro"],
] as const;

const DOC_TYPES = [
  ["", "—"],
  ["dni", "DNI"],
  ["nie", "NIE"],
  ["passport", "Pasaporte"],
  ["cif", "CIF"],
  ["other", "Otro"],
] as const;

export function CustomerForm({
  action,
  customer,
  submitLabel,
}: {
  action: (prev: unknown, fd: FormData) => Promise<Exclude<Result, null>>;
  customer?: Customer;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  const F = ({
    label,
    name,
    type = "text",
    defaultValue,
  }: {
    label: string;
    name: string;
    type?: string;
    defaultValue?: string | null;
  }) => (
    <label className="text-xs">
      <span className="mb-1 block text-[var(--color-ink-soft)]">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
      />
    </label>
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <F label="Nombre" name="firstName" defaultValue={customer?.firstName} />
      <F label="Apellidos" name="lastName" defaultValue={customer?.lastName} />
      <F label="Email" name="email" type="email" defaultValue={customer?.email} />
      <F label="Teléfono" name="phone" defaultValue={customer?.phone} />
      <F label="WhatsApp" name="whatsapp" defaultValue={customer?.whatsapp} />
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Tipo de documento</span>
        <select
          name="docType"
          defaultValue={customer?.docType ?? ""}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          {DOC_TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <F label="Nº de documento" name="docNumber" defaultValue={customer?.docNumber} />
      <F label="Idioma (es, en…)" name="language" defaultValue={customer?.language} />
      <F label="Dirección" name="address" defaultValue={customer?.address} />
      <F label="Código postal" name="postalCode" defaultValue={customer?.postalCode} />
      <F label="Localidad" name="city" defaultValue={customer?.city} />
      <F label="Provincia" name="province" defaultValue={customer?.province} />
      <F label="País" name="country" defaultValue={customer?.country} />
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Canal de origen</span>
        <select
          name="channelOrigin"
          defaultValue={customer?.channelOrigin ?? ""}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          {CHANNELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs sm:col-span-3">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Notas internas</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={customer?.notes ?? ""}
          className="w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-xs sm:col-span-3">
        <input
          type="checkbox"
          name="marketingConsent"
          value="true"
          defaultChecked={customer?.marketingConsent ?? false}
        />
        <span>
          Consentimiento de marketing
          {customer?.marketingConsentAt
            ? ` (desde ${new Date(customer.marketingConsentAt).toLocaleDateString("es-ES")}, origen ${customer.marketingConsentSource ?? "—"})`
            : ""}
        </span>
      </label>

      <div className="sm:col-span-3">
        {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
        {state && state.ok && <p className="text-sm text-green-700">Guardado.</p>}
        <button
          className="mt-1 h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
          disabled={pending}
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
