"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { startMfaEnrollmentAction, verifyMfaEnrollmentAction } from "@/domains/admin/mfa-actions";

export function MfaEnroll() {
  const router = useRouter();
  const [enroll, setEnroll] = useState<
    { factorId: string; qr: string; secret: string } | null
  >(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [state, verifyAction, verifying] = useActionState(verifyMfaEnrollmentAction, null);

  if (state?.ok) {
    router.refresh();
  }

  async function begin() {
    setStarting(true);
    setStartError(null);
    const res = await startMfaEnrollmentAction();
    setStarting(false);
    if (res.ok) setEnroll({ factorId: res.factorId, qr: res.qr, secret: res.secret });
    else setStartError(res.error);
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-white p-5">
      {!enroll ? (
        <>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Necesitas una app de autenticación (Google Authenticator, 1Password, Authy…).
          </p>
          <button
            className="admin-btn mt-3"
            data-variant="primary"
            type="button"
            onClick={begin}
            disabled={starting}
          >
            {starting ? "Preparando…" : "Configurar verificación en dos pasos"}
          </button>
          {startError && <p className="mt-2 text-sm text-red-600">{startError}</p>}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            {/* Supabase returns an SVG data URI */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enroll.qr} alt="Código QR de verificación" width={180} height={180} />
            <div className="text-sm">
              <p className="text-[var(--color-ink-soft)]">
                Escanea el QR, o introduce esta clave manualmente:
              </p>
              <code className="mt-1 block break-all rounded bg-[var(--color-surface-2,#f4f6fb)] px-2 py-1 text-xs">
                {enroll.secret}
              </code>
            </div>
          </div>
          <form action={verifyAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="factorId" value={enroll.factorId} />
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
                Código de 6 dígitos
              </span>
              <input
                name="code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                className="h-10 w-32 rounded-lg border border-[var(--color-line)] px-3 text-center tracking-[0.2em]"
                placeholder="000000"
              />
            </label>
            <button className="admin-btn" data-variant="primary" type="submit" disabled={verifying}>
              {verifying ? "Verificando…" : "Activar"}
            </button>
          </form>
          {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
