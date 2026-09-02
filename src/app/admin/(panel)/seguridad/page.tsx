import { env, DEMO_MODE } from "@/lib/env";
import { getAdminContext } from "@/domains/admin/context";
import { disableMfaAction } from "@/domains/admin/mfa-actions";
import { MfaEnroll } from "./MfaEnroll";

export const metadata = { title: "Seguridad" };
export const dynamic = "force-dynamic";

export default async function SeguridadPage() {
  const ctx = await getAdminContext();

  let factors: { id: string; status: string }[] = [];
  if (env.supabaseBrowserConfigured && ctx?.source === "supabase") {
    try {
      const { supabaseServer } = await import("@/lib/supabase/server");
      const sb = await supabaseServer();
      const { data } = await sb.auth.mfa.listFactors();
      factors = (data?.totp ?? []).map((f) => ({ id: f.id, status: f.status }));
    } catch {
      /* ignore */
    }
  }
  const verified = factors.find((f) => f.status === "verified");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Seguridad de tu cuenta</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Verificación en dos pasos (TOTP) para tu sesión. Un administrador puede hacerla
          obligatoria para las acciones sensibles (ajustes, facturación).
        </p>
      </div>

      {DEMO_MODE || !env.supabaseBrowserConfigured ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-ink-soft)]">
          La verificación en dos pasos usa Supabase Auth. Actívala configurando Supabase
          (<code>NEXT_PUBLIC_SUPABASE_URL</code> + claves) y habilitando Auth en el proyecto.
        </div>
      ) : ctx?.source !== "supabase" ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-ink-soft)]">
          Has entrado con la contraseña única del panel. La verificación en dos pasos por usuario
          está disponible al iniciar sesión con tu cuenta de Supabase Auth.
        </div>
      ) : verified ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-sm">
            <span className="admin-chip" data-tone="accent">
              activa
            </span>{" "}
            Tu cuenta tiene la verificación en dos pasos configurada.
          </p>
          <form action={disableMfaAction} className="mt-3">
            <input type="hidden" name="factorId" value={verified.id} />
            <button className="admin-btn" data-variant="ghost" type="submit">
              Desactivar
            </button>
          </form>
        </div>
      ) : (
        <MfaEnroll />
      )}
    </div>
  );
}
