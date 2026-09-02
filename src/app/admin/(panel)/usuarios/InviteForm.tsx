"use client";

import { useActionState } from "react";
import { inviteAdminUserAction } from "@/domains/admin/user-actions";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteAdminUserAction, null);

  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Correo</span>
        <input
          type="email"
          name="email"
          required
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3"
          placeholder="operador@praetoria.es"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Nombre (opcional)</span>
        <input
          type="text"
          name="fullName"
          className="h-10 w-full rounded-lg border border-[var(--color-line)] px-3"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">Rol</span>
        <select name="role" defaultValue="gestion" className="h-10 rounded-lg border border-[var(--color-line)] px-2">
          <option value="admin">Administrador</option>
          <option value="gestion">Gestión</option>
          <option value="lectura">Solo lectura</option>
        </select>
      </label>
      <button className="admin-btn" data-variant="primary" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Invitar"}
      </button>
      {state && !state.ok && (
        <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-green-700 sm:col-span-4">
          Invitación creada. {state.message}
        </p>
      )}
    </form>
  );
}
