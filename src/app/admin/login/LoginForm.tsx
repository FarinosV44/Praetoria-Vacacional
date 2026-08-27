"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/domains/admin/actions";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, action, pending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.ok) router.replace(params.get("next") ?? "/admin");
  }, [state, router, params]);

  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-ink-soft)]">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-11 w-full rounded-xl border border-[var(--color-line)] px-3"
        />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
