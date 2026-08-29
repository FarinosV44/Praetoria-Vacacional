"use client";

import { useActionState } from "react";
import type { PropertyContent } from "@/domains/properties/types";
import type { Reservation } from "@/domains/booking/types";
import type { Customer } from "@/domains/crm/types";
import { displayName } from "@/domains/crm/types";

type Result = { ok: true; id?: string } | { ok: false; error: string } | null;

const SOURCES = [
  ["direct", "Web directa Praetoria"],
  ["booking", "Booking.com"],
  ["airbnb", "Airbnb"],
  ["manual", "Entrada manual"],
  ["other", "Otro canal"],
] as const;

const PAYMENT_STATES = [
  ["pending", "Pendiente"],
  ["partial", "Parcial"],
  ["paid", "Pagado"],
  ["refunded", "Reembolsado"],
] as const;

const DOC_TYPES = [
  ["", "—"],
  ["dni", "DNI"],
  ["nie", "NIE"],
  ["passport", "Pasaporte"],
  ["cif", "CIF"],
  ["other", "Otro"],
] as const;

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="text-xs">
      <span className="mb-1 block text-[var(--color-ink-soft)]">{label}</span>
      <input
        type={type}
        name={name}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
      />
    </label>
  );
}

export function ReservationForm({
  mode,
  action,
  properties,
  customers,
  reservation,
}: {
  mode: "create" | "edit";
  action: (prev: unknown, fd: FormData) => Promise<Exclude<Result, null>>;
  properties: readonly PropertyContent[];
  customers: Customer[];
  reservation?: Reservation;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );
  const r = reservation;

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      {r && <input type="hidden" name="id" value={r.id} />}

      {mode === "create" ? (
        <label className="text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">Alojamiento *</span>
          <select
            name="propertySlug"
            required
            className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
          >
            {properties.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">Alojamiento</span>
          <p className="flex h-9 items-center">
            {properties.find((p) => p.id === r?.propertyId)?.name ?? "—"}
          </p>
        </div>
      )}

      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Canal *</span>
        <select
          name="source"
          defaultValue={r?.source ?? "direct"}
          required
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          {SOURCES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <Field label="Detalle del canal" name="channelDetail" defaultValue={r?.channelDetail} />

      {mode === "create" && (
        <>
          <Field label="Entrada *" name="checkIn" type="date" required />
          <Field label="Salida *" name="checkOut" type="date" required />
          <Field label="Huéspedes *" name="guests" type="number" required defaultValue={2} />
          <Field label="Importe (€) *" name="totalEuros" type="number" step="0.01" required />
          <label className="flex items-end gap-2 text-xs">
            <input type="checkbox" name="occupy" value="true" />
            <span>
              Bloquear disponibilidad (déjalo sin marcar en reservas de Booking/Airbnb cuyo bloqueo
              iCal ya existe)
            </span>
          </label>
        </>
      )}

      <label className="text-xs sm:col-span-3">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Cliente vinculado</span>
        <select
          name="customerId"
          defaultValue={r?.customerId ?? ""}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          <option value="">
            {mode === "create"
              ? "— (se creará/vinculará automáticamente por los datos del huésped)"
              : "— sin vincular"}
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {displayName(c)}
              {c.email ? ` · ${c.email}` : ""}
            </option>
          ))}
        </select>
      </label>

      <Field label="Nombre y apellidos" name="guestName" defaultValue={r?.guestName} />
      <Field label="Email" name="guestEmail" type="email" defaultValue={r?.guestEmail} />
      <Field label="Teléfono" name="guestPhone" defaultValue={r?.guestPhone} />
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Tipo de documento</span>
        <select
          name="guestDocType"
          defaultValue={r?.guestDocType ?? ""}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          {DOC_TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <Field label="Nº documento" name="guestDocNumber" defaultValue={r?.guestDocNumber} />
      <Field label="Dirección fiscal" name="guestAddress" defaultValue={r?.guestAddress} />
      <Field label="Código postal" name="guestPostalCode" defaultValue={r?.guestPostalCode} />
      <Field label="Localidad" name="guestCity" defaultValue={r?.guestCity} />
      <Field label="Provincia" name="guestProvince" defaultValue={r?.guestProvince} />
      <Field label="País" name="guestCountry" defaultValue={r?.guestCountry} />

      <Field
        label="Localizador externo (Booking/Airbnb)"
        name="externalLocator"
        defaultValue={r?.externalLocator}
      />
      <Field label="Nº de factura (PRAETORIA)" name="invoiceNumber" defaultValue={r?.invoiceNumber} />
      <Field label="Método de pago" name="paymentMethod" defaultValue={r?.paymentMethod} />
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Estado de pago</span>
        <select
          name="paymentState"
          defaultValue={r?.paymentState ?? "pending"}
          className="h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm"
        >
          {PAYMENT_STATES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs sm:col-span-3">
        <span className="mb-1 block text-[var(--color-ink-soft)]">Observaciones internas</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={r?.notes ?? ""}
          className="w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        />
      </label>

      <div className="sm:col-span-3">
        {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
        {state && state.ok && <p className="text-sm text-green-700">Guardado.</p>}
        <button
          className="mt-1 h-10 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium text-white"
          disabled={pending}
        >
          {pending ? "Guardando…" : mode === "create" ? "Registrar reserva" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
