"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { track } from "@/lib/analytics";

/** Formularios del portal y del panel: estado, errores y botón con «enviando». */

type Result = { ok: true; message?: string; demoUrl?: string } | { ok: false; error: string } | null;

export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-4",
  resetOnSuccess = false,
  encType,
}: {
  action: (prev: unknown, fd: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className} encType={encType}>
      {children}
      {state && !state.ok && (
        <p className="pv-note pv-note--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p className="pv-note pv-note--info" role="status">
          {state.message}
          {state.demoUrl && (
            <>
              {" "}
              <a className="font-semibold underline" href={state.demoUrl}>
                (modo demo: abrir enlace)
              </a>
            </>
          )}
        </p>
      )}
      <Submit label={submitLabel} />
    </form>
  );
}

export function Submit({ label, variant = "ink" }: { label: string; variant?: "ink" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`pv-btn pv-btn--${variant}`} disabled={pending} aria-busy={pending}>
      {pending ? "Enviando…" : label}
    </button>
  );
}

/** Botón de pago que registra el inicio del checkout (sin datos personales). */
export function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="pv-btn pv-btn--ink pv-btn--lg"
      disabled={pending}
      onClick={() => track("checkout_start", { service: "tramites" })}
    >
      {pending ? "Abriendo el pago seguro…" : label}
    </button>
  );
}

/** Marca de conversión cuando el pedido aparece pagado. */
export function TrackOnce({ event, params }: { event: "service_order_complete"; params?: Record<string, string | number> }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) {
      track(event, params);
      setDone(true);
    }
  }, [done, event, params]);
  return null;
}
