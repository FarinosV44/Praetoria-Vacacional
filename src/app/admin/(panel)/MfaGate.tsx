"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { challengeMfaAction } from "@/domains/admin/mfa-actions";

/**
 * Issue #65 — shown instead of the panel when the session is AAL1 but the user
 * (or their account policy) requires AAL2. A correct TOTP code lifts the session.
 */
export function MfaGate() {
  const router = useRouter();
  const [state, action, pending] = useActionState(challengeMfaAction, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-[var(--color-line)] bg-white p-6">
      <h1 className="font-display text-lg">Verificación en dos pasos</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Introduce el código de 6 dígitos de tu aplicación de autenticación para continuar.
      </p>
      <form action={action} className="mt-4 space-y-3">
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          className="h-11 w-full rounded-xl border border-[var(--color-line)] px-3 text-center text-lg tracking-[0.3em]"
          placeholder="000000"
        />
        {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
        <button className="admin-btn w-full" data-variant="primary" type="submit" disabled={pending}>
          {pending ? "Verificando…" : "Verificar"}
        </button>
      </form>
    </div>
  );
}
