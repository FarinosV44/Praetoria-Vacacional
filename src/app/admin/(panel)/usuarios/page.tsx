import { getRepository } from "@/lib/repository";
import { env, DEMO_MODE } from "@/lib/env";
import { getAdminContext } from "@/domains/admin/context";
import { ROLE_LABEL, type AdminRole } from "@/domains/admin/roles";
import {
  deleteAdminUserAction,
  revokeAdminUserSessionsAction,
  setAdminUserActiveAction,
  setAdminUserMfaRequiredAction,
  updateAdminUserRoleAction,
} from "@/domains/admin/user-actions";
import { InviteForm } from "./InviteForm";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

const ROLES: AdminRole[] = ["admin", "gestion", "lectura"];

function ago(iso: string | null): string {
  if (!iso) return "nunca";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export default async function UsuariosPage() {
  const users = await getRepository().listAdminUsers();
  const me = await getAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Usuarios del panel</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Cada operador tiene su cuenta y su rol. Puedes desactivar un usuario (queda fuera al
          instante, aunque tenga la sesión abierta), forzar la verificación en dos pasos para las
          acciones sensibles, o cerrar todas sus sesiones.{" "}
          {DEMO_MODE
            ? "En modo demostración no hay Supabase Auth: el login sigue siendo por contraseña única y las invitaciones no envían correo."
            : env.supabaseConfigured
              ? "Las invitaciones se envían por correo desde Supabase Auth."
              : null}
        </p>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Invitar a un usuario</h2>
        <InviteForm />
      </section>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">2FA</th>
              <th className="px-3 py-2">Última actividad</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[var(--color-ink-soft)]">
                  Sin usuarios registrados todavía. Invita al primero arriba.
                </td>
              </tr>
            )}
            {users.map((u) => {
              const isMe = me?.userId === u.id || me?.email === u.email;
              const pending = !!u.inviteTokenHash;
              return (
                <tr key={u.id} className="border-b border-[var(--color-line)] last:border-0 align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{u.fullName || u.email}</div>
                    <div className="text-xs text-[var(--color-ink-soft)]">{u.email}</div>
                    {isMe && <span className="text-xs text-[var(--accent-600)]">tú</span>}
                  </td>
                  <td className="px-3 py-3">
                    <form action={updateAdminUserRoleAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                      <button className="admin-btn" data-variant="ghost" type="submit">
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-3">
                    {pending ? (
                      <span className="admin-chip" data-tone="warn">
                        invitación pendiente
                      </span>
                    ) : u.active ? (
                      <span className="admin-chip" data-tone="accent">
                        activo
                      </span>
                    ) : (
                      <span className="admin-chip" data-tone="warn">
                        desactivado
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <form action={setAdminUserMfaRequiredAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="required" value={u.mfaRequired ? "false" : "true"} />
                      <button className="admin-btn" data-variant="ghost" type="submit">
                        {u.mfaRequired ? "Obligatoria ✓" : "Opcional"}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-3 text-xs text-[var(--color-ink-soft)]">{ago(u.lastSeenAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <form action={setAdminUserActiveAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                        <button className="admin-btn" data-variant="ghost" type="submit" disabled={isMe && u.active}>
                          {u.active ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                      <form action={revokeAdminUserSessionsAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="admin-btn" data-variant="ghost" type="submit">
                          Cerrar sesiones
                        </button>
                      </form>
                      <form action={deleteAdminUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="admin-btn" data-variant="ghost" type="submit" disabled={isMe}>
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
