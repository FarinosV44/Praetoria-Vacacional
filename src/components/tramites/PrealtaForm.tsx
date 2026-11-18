"use client";

import { useActionState } from "react";
import { submitPrealtaAction, type PrealtaResult } from "@/domains/tramites/actions/funnel";
import { Submit } from "./forms";

/** Solicitud sin cobro mientras la contratación online no está activada (#174). */
export function PrealtaForm() {
  const [state, action] = useActionState<PrealtaResult | null, FormData>(submitPrealtaAction, null);
  if (state?.ok)
    return (
      <div className="pv-card max-w-2xl p-6" role="status">
        <h2 className="text-xl font-semibold">Solicitud recibida</h2>
        <p className="mt-2 text-[var(--color-ink-soft)]">Te llamaremos en horario de oficina para explicarte el servicio. No se ha cobrado nada.</p>
      </div>
    );
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="pv-card max-w-2xl space-y-4 p-6">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Nombre" name="name" error={err("name")} autoComplete="name" />
        <F label="Teléfono" name="phone" error={err("phone")} type="tel" autoComplete="tel" />
      </div>
      <F label="Correo electrónico" name="email" error={err("email")} type="email" autoComplete="email" />
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Municipio de la vivienda" name="municipality" error={err("municipality")} />
        <F label="Número de viviendas" name="properties" error={err("properties")} type="number" defaultValue="1" />
      </div>
      <F label="¿Qué necesitas? (opcional)" name="services" placeholder="Alta en SES.HOSPEDAJES, comunicar reservas…" />
      <label className="block">
        <span className="pv-label">Mensaje (opcional)</span>
        <textarea name="message" className="pv-textarea !h-28" maxLength={1500} />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>Acepto que Praetoria use estos datos para contactarme sobre esta solicitud.</span>
      </label>
      {err("consent") && <p className="pv-error">{err("consent")}</p>}
      {state && !state.ok && <p className="pv-note pv-note--error" role="alert">{state.error}</p>}
      <Submit label="Enviar solicitud" />
    </form>
  );
}

function F(p: { label: string; name: string; error?: string; type?: string; autoComplete?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="pv-label">{p.label}</span>
      <input
        className="pv-input"
        name={p.name}
        type={p.type ?? "text"}
        autoComplete={p.autoComplete}
        defaultValue={p.defaultValue}
        placeholder={p.placeholder}
        aria-invalid={!!p.error}
      />
      {p.error && <span className="pv-error block">{p.error}</span>}
    </label>
  );
}
