"use client";

import { useActionState, useState } from "react";
import { ActionForm, Submit } from "./forms";
import {
  addPropertyAction,
  ownerMessageAction,
  reportReservationAction,
  saveTravellersAction,
  updatePropertyAction,
  uploadDocumentAction,
  type PortalResult,
} from "@/domains/tramites/actions/portal";
import type { DocumentKind, ManagedProperty } from "@/domains/tramites/types";

const KINDS: { v: DocumentKind; l: string }[] = [
  { v: "autorizacion_representacion", l: "Autorización de representación firmada" },
  { v: "dni_titular", l: "Documento de identidad del titular" },
  { v: "registro_turistico", l: "Justificante del registro turístico" },
  { v: "escritura_o_nota_simple", l: "Escritura o nota simple" },
  { v: "contrato_o_reserva", l: "Contrato o justificante de reserva" },
  { v: "otro", l: "Otro documento" },
];

export function UploadForm({
  properties,
  propertyId,
  filingId,
  suggested,
}: {
  properties?: Pick<ManagedProperty, "id" | "alias">[];
  propertyId?: string;
  filingId?: string;
  suggested?: DocumentKind[];
}) {
  const list = suggested?.length
    ? KINDS.filter((k) => suggested.includes(k.v)).concat(
        KINDS.filter((k) => !suggested.includes(k.v)),
      )
    : KINDS;
  return (
    <ActionForm
      action={uploadDocumentAction}
      submitLabel="Subir documento"
      encType="multipart/form-data"
      resetOnSuccess
    >
      {filingId && <input type="hidden" name="filingId" value={filingId} />}
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
      <label className="block">
        <span className="pv-label">¿Qué documento es?</span>
        <select name="kind" className="pv-select" defaultValue={list[0]?.v}>
          {list.map((k) => (
            <option key={k.v} value={k.v}>
              {k.l}
            </option>
          ))}
        </select>
      </label>
      {!propertyId && properties && properties.length > 0 && (
        <label className="block">
          <span className="pv-label">Vivienda (opcional)</span>
          <select name="propertyId" className="pv-select" defaultValue="">
            <option value="">General, no es de una vivienda</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.alias}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block">
        <span className="pv-label">Archivo</span>
        <input
          type="file"
          name="file"
          accept="application/pdf,image/png,image/jpeg"
          required
          className="block w-full text-sm"
        />
        <span className="pv-hint block">
          PDF, JPG o PNG, hasta 10 MB. Se guarda en un espacio privado al que solo accedes tú y
          nuestro equipo.
        </span>
      </label>
    </ActionForm>
  );
}

export function MessageForm() {
  return (
    <ActionForm action={ownerMessageAction} submitLabel="Enviar mensaje" resetOnSuccess>
      <label className="block">
        <span className="pv-label">Tu mensaje</span>
        <textarea name="body" required maxLength={4000} className="pv-textarea !h-32" />
        <span className="pv-hint block">
          No escribas aquí datos de tus viajeros ni números de documento.
        </span>
      </label>
    </ActionForm>
  );
}

export function PropertyEditForm({ p }: { p: ManagedProperty }) {
  return (
    <ActionForm action={updatePropertyAction} submitLabel="Guardar cambios">
      <input type="hidden" name="propertyId" value={p.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="pv-label">Número de registro turístico</span>
          <input
            className="pv-input"
            name="tourismRegistryNumber"
            defaultValue={p.tourismRegistryNumber ?? ""}
            maxLength={60}
          />
        </label>
        <label className="block">
          <span className="pv-label">Referencia catastral (opcional)</span>
          <input
            className="pv-input"
            name="cadastralRef"
            defaultValue={p.cadastralRef ?? ""}
            maxLength={30}
          />
        </label>
        <label className="block">
          <span className="pv-label">Código de establecimiento SES</span>
          <input
            className="pv-input"
            name="sesEstablishmentCode"
            defaultValue={p.sesEstablishmentCode ?? ""}
            maxLength={40}
          />
        </label>
        <label className="block">
          <span className="pv-label">Plazas máximas</span>
          <input
            className="pv-input"
            name="maxGuests"
            type="number"
            min={0}
            max={60}
            defaultValue={p.maxGuests ?? ""}
          />
        </label>
      </div>
    </ActionForm>
  );
}

export function AddPropertyForm({ sesPrice }: { sesPrice: string | null }) {
  return (
    <ActionForm action={addPropertyAction} submitLabel="Añadir vivienda">
      <label className="block">
        <span className="pv-label">Nombre corto</span>
        <input className="pv-input" name="alias" required maxLength={80} />
      </label>
      <label className="block">
        <span className="pv-label">Dirección</span>
        <input className="pv-input" name="street" required />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="pv-label">Código postal</span>
          <input
            className="pv-input"
            name="postalCode"
            inputMode="numeric"
            maxLength={5}
            required
          />
        </label>
        <label className="block">
          <span className="pv-label">Municipio</span>
          <input className="pv-input" name="municipality" required />
        </label>
        <label className="block">
          <span className="pv-label">Provincia</span>
          <input className="pv-input" name="province" required />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="pv-label">¿Registro turístico?</span>
          <select name="hasTourismRegistry" className="pv-select" defaultValue="si">
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no_se">No lo sé</option>
          </select>
        </label>
        <label className="block">
          <span className="pv-label">¿Alta en SES.HOSPEDAJES?</span>
          <select name="hasSesAlta" className="pv-select" defaultValue="no_se">
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no_se">No lo sé</option>
          </select>
        </label>
      </div>
      <input type="hidden" name="platforms" value="" />
      {sesPrice && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="wantsSesAlta" className="mt-1" />
          <span>
            Quiero que hagáis el alta en SES.HOSPEDAJES ({sesPrice} + IVA). Te llevaremos al pago.
          </span>
        </label>
      )}
    </ActionForm>
  );
}

export function ReservationForm({
  properties,
}: {
  properties: Pick<ManagedProperty, "id" | "alias">[];
}) {
  return (
    <ActionForm action={reportReservationAction} submitLabel="Comunicar la reserva">
      <label className="block">
        <span className="pv-label">Vivienda</span>
        <select name="propertyId" className="pv-select" required>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.alias}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="pv-label">Plataforma</span>
          <select name="channel" className="pv-select" defaultValue="booking">
            <option value="booking">Booking</option>
            <option value="airbnb">Airbnb</option>
            <option value="vrbo">Vrbo</option>
            <option value="directa">Reserva directa</option>
            <option value="otra">Otra</option>
          </select>
        </label>
        <label className="block">
          <span className="pv-label">Localizador (opcional)</span>
          <input className="pv-input" name="externalRef" maxLength={60} />
        </label>
      </div>
      <label className="block">
        <span className="pv-label">¿Cuándo se hizo la reserva?</span>
        <input className="pv-input" type="datetime-local" name="bookedAt" required />
        <span className="pv-hint block">
          El plazo de 24 horas para comunicarla empieza en ese momento.
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="pv-label">Entrada</span>
          <input className="pv-input" type="date" name="checkIn" required />
        </label>
        <label className="block">
          <span className="pv-label">Salida</span>
          <input className="pv-input" type="date" name="checkOut" required />
        </label>
        <label className="block">
          <span className="pv-label">Viajeros</span>
          <input
            className="pv-input"
            type="number"
            name="travellers"
            min={1}
            max={60}
            defaultValue={2}
            required
          />
        </label>
      </div>
    </ActionForm>
  );
}

type Traveller = {
  firstName: string;
  surname1: string;
  surname2: string;
  sex: "H" | "M" | "O";
  docType: "DNI" | "NIE" | "PAS" | "OTRO" | "NINGUNO";
  docNumber: string;
  docSupport: string;
  nationality: string;
  birthDate: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  kinship: string;
};
const blank = (): Traveller => ({
  firstName: "",
  surname1: "",
  surname2: "",
  sex: "M",
  docType: "DNI",
  docNumber: "",
  docSupport: "",
  nationality: "España",
  birthDate: "",
  address: "",
  city: "",
  country: "España",
  phone: "",
  email: "",
  kinship: "",
});

/**
 * Datos de viajeros (RD 933/2021). Se envían en un único campo JSON y el
 * servidor los valida y cifra antes de guardarlos. No se piden escaneos.
 */
export function TravellersForm({ reportId, count }: { reportId: string; count: number }) {
  const [list, setList] = useState<Traveller[]>(() =>
    Array.from({ length: Math.max(1, count) }, blank),
  );
  const [paymentType, setPaymentType] = useState("plataforma");
  const [state, action] = useActionState<PortalResult | null, FormData>(saveTravellersAction, null);
  const set = (i: number, patch: Partial<Traveller>) =>
    setList((l) => l.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  if (state?.ok)
    return (
      <p className="pv-note pv-note--info" role="status">
        {state.message}
      </p>
    );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="reportId" value={reportId} />
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({ travellers: list, paymentType })}
      />
      {list.map((t, i) => (
        <fieldset
          key={i}
          className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4"
        >
          <legend className="px-1 font-semibold">Viajero {i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <In label="Nombre" v={t.firstName} on={(v) => set(i, { firstName: v })} />
            <In label="Primer apellido" v={t.surname1} on={(v) => set(i, { surname1: v })} />
            <In label="Segundo apellido" v={t.surname2} on={(v) => set(i, { surname2: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="pv-label">Sexo</span>
              <select
                className="pv-select"
                value={t.sex}
                onChange={(e) => set(i, { sex: e.target.value as Traveller["sex"] })}
              >
                <option value="M">Mujer</option>
                <option value="H">Hombre</option>
                <option value="O">Otro</option>
              </select>
            </label>
            <label className="block">
              <span className="pv-label">Documento</span>
              <select
                className="pv-select"
                value={t.docType}
                onChange={(e) => set(i, { docType: e.target.value as Traveller["docType"] })}
              >
                <option value="DNI">DNI</option>
                <option value="NIE">NIE / TIE</option>
                <option value="PAS">Pasaporte</option>
                <option value="OTRO">Otro</option>
                <option value="NINGUNO">Sin documento (menor)</option>
              </select>
            </label>
            {t.docType !== "NINGUNO" && (
              <In label="Número" v={t.docNumber} on={(v) => set(i, { docNumber: v })} />
            )}
            {(t.docType === "DNI" || t.docType === "NIE") && (
              <In label="N.º de soporte" v={t.docSupport} on={(v) => set(i, { docSupport: v })} />
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <In label="Nacionalidad" v={t.nationality} on={(v) => set(i, { nationality: v })} />
            <In
              label="Fecha de nacimiento"
              type="date"
              v={t.birthDate}
              on={(v) => set(i, { birthDate: v })}
            />
            <In label="Parentesco (si es menor)" v={t.kinship} on={(v) => set(i, { kinship: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <In label="Dirección de residencia" v={t.address} on={(v) => set(i, { address: v })} />
            <In label="Localidad" v={t.city} on={(v) => set(i, { city: v })} />
            <In label="País" v={t.country} on={(v) => set(i, { country: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <In label="Teléfono" v={t.phone} on={(v) => set(i, { phone: v })} />
            <In label="Correo" v={t.email} on={(v) => set(i, { email: v })} />
          </div>
          {list.length > 1 && (
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setList(list.filter((_, j) => j !== i))}
            >
              Quitar este viajero
            </button>
          )}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-end gap-4">
        <button
          type="button"
          className="pv-btn pv-btn--ghost"
          onClick={() => setList([...list, blank()])}
        >
          Añadir viajero
        </button>
        <label className="block">
          <span className="pv-label">Forma de pago de la reserva</span>
          <select
            className="pv-select"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option value="plataforma">A través de la plataforma</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="otro">Otro</option>
          </select>
        </label>
      </div>
      {state && !state.ok && (
        <p className="pv-note pv-note--error" role="alert">
          {state.error}
        </p>
      )}
      <p className="text-xs text-[var(--color-ink-faint)]">
        Los datos se guardan cifrados, solo los ve la persona del equipo que presenta la
        comunicación y no se usan para nada más.
      </p>
      <Submit label="Guardar datos de viajeros" />
    </form>
  );
}

function In({
  label,
  v,
  on,
  type = "text",
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="pv-label">{label}</span>
      <input
        className="pv-input"
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        autoComplete="off"
      />
    </label>
  );
}
