"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitOwnerLeadAction, type OwnerLeadResult } from "@/domains/owners/actions";
import { OWNER_LICENCE, OWNER_LOCATIONS, OWNER_ZONES } from "@/domains/owners/types";
import { track } from "@/lib/analytics";

const input =
  "h-11 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 text-[var(--color-ink)] aria-[invalid=true]:border-red-600";
const labelText = "mb-1 block text-sm font-medium text-[var(--color-ink-soft)]";

export function OwnerLeadForm() {
  const [state, action, pending] = useActionState<OwnerLeadResult | null, FormData>(
    async (prev, fd) => {
      const r = await submitOwnerLeadAction(prev, fd);
      if (r.ok) track("generate_lead", { lead_type: "owner" });
      return r;
    },
    null,
  );

  if (state?.ok) {
    return (
      <div role="status" className="pv-card pv-card--pad">
        <p className="font-display text-xl">¡Gracias! Hemos recibido tu solicitud.</p>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Te llamaremos en breve para conocer tu alojamiento y preparar tu propuesta.
        </p>
      </div>
    );
  }

  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  const errProps = (k: string) =>
    err(k) ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {};
  const ErrorText = ({ k }: { k: string }) =>
    err(k) ? (
      <span id={`${k}-error`} className="mt-1 block text-xs text-red-700">
        {err(k)}
      </span>
    ) : null;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <label className="block sm:col-span-2">
        <span className={labelText}>Nombre</span>
        <input name="name" required autoComplete="name" className={input} {...errProps("name")} />
        <ErrorText k="name" />
      </label>
      <label className="block">
        <span className={labelText}>Teléfono</span>
        <input name="phone" type="tel" required autoComplete="tel" className={input} {...errProps("phone")} />
        <ErrorText k="phone" />
      </label>
      <label className="block">
        <span className={labelText}>Correo electrónico</span>
        <input name="email" type="email" required autoComplete="email" className={input} {...errProps("email")} />
        <ErrorText k="email" />
      </label>
      <label className="block">
        <span className={labelText}>¿Dónde está tu alojamiento?</span>
        <select name="zone" required defaultValue="" className={input} {...errProps("zone")}>
          <option value="" disabled>
            Elige la zona
          </option>
          {OWNER_ZONES.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
        <ErrorText k="zone" />
      </label>
      <label className="block">
        <span className={labelText}>Ubicación</span>
        <select name="location" required defaultValue="" className={input} {...errProps("location")}>
          <option value="" disabled>
            Elige una opción
          </option>
          {OWNER_LOCATIONS.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
        <ErrorText k="location" />
      </label>
      <label className="block">
        <span className={labelText}>Dormitorios</span>
        <input name="bedrooms" type="number" min={0} max={20} inputMode="numeric" className={input} {...errProps("bedrooms")} />
        <ErrorText k="bedrooms" />
      </label>
      <label className="block">
        <span className={labelText}>¿Tiene licencia turística?</span>
        <select name="licence" required defaultValue="" className={input} {...errProps("licence")}>
          <option value="" disabled>
            Elige una opción
          </option>
          {OWNER_LICENCE.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
        <ErrorText k="licence" />
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--color-ink)] sm:col-span-2">
        <input type="checkbox" name="onPlatforms" className="h-4 w-4" />
        Ya lo anuncio en Booking, Airbnb u otra plataforma
      </label>
      <label className="block sm:col-span-2">
        <span className={labelText}>Cuéntanos algo más (opcional)</span>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-[var(--color-ink)]"
          placeholder="Metros, terraza, vistas, si lo usas algunas semanas al año…"
        />
      </label>

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-[var(--color-ink-soft)] sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4" {...errProps("consent")} />
        <span>
          He leído y acepto la{" "}
          <Link href="/legal/privacidad" className="underline">
            política de privacidad
          </Link>
          . Usaremos tus datos solo para contactarte sobre la gestión de tu alojamiento.
        </span>
      </label>
      <ErrorText k="consent" />

      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" className="pv-btn pv-btn--primary pv-btn--lg w-full sm:w-auto" disabled={pending}>
          {pending ? "Enviando…" : "Quiero mi propuesta"}
        </button>
      </div>
    </form>
  );
}
