"use client";

import { useActionState } from "react";
import { addTravellerAction } from "@/domains/registry/actions";

const input = "h-10 w-full rounded-lg border border-[var(--color-line)] px-3";

export function TravellerForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(addTravellerAction, null);

  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="token" value={token} />
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Nombre y apellidos</span>
        <input name="fullName" required className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Primer apellido</span>
        <input name="firstSurname" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Segundo apellido</span>
        <input name="secondSurname" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Tipo de documento</span>
        <select name="docType" defaultValue="DNI" className={input}>
          <option value="DNI">DNI</option>
          <option value="NIE">NIE / TIE</option>
          <option value="PAS">Pasaporte</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Número de documento</span>
        <input name="docNumber" required className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Nº de soporte (DNI/NIE)</span>
        <input name="docSupport" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Nacionalidad (ISO, p. ej. ESP)</span>
        <input name="nationality" defaultValue="ESP" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Fecha de nacimiento</span>
        <input type="date" name="birthDate" required className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Sexo</span>
        <select name="gender" className={input} defaultValue="">
          <option value="">—</option>
          <option value="H">Hombre</option>
          <option value="M">Mujer</option>
          <option value="O">Otro</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">País de residencia (ISO)</span>
        <input name="addressCountry" defaultValue="ESP" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Municipio (si reside en España)</span>
        <input name="municipality" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Provincia (si reside en España)</span>
        <input name="province" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Parentesco (si es menor)</span>
        <input name="kinship" className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Forma de pago de la reserva</span>
        <select name="paymentMethod" defaultValue="TARJ" className={input}>
          <option value="TARJ">Tarjeta</option>
          <option value="EFECT">Efectivo</option>
          <option value="TRANS">Transferencia</option>
          <option value="PLATF">Plataforma (Booking/Airbnb)</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <button className="pv-btn pv-btn--primary" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Añadir viajero"}
        </button>
        {state && !state.ok && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="ml-3 text-sm text-green-700">Añadido.</span>}
      </div>
    </form>
  );
}
