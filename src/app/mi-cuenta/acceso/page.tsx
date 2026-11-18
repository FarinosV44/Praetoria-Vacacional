import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/tramites/forms";
import { ownerLoginAction } from "@/domains/tramites/actions/account";
import { getOwnerContext } from "@/domains/tramites/context";
import { portalDisponible } from "@/domains/tramites/gate";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function AccesoPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  if (await getOwnerContext()) redirect(sp.next?.startsWith("/mi-cuenta/tramites") ? sp.next : "/mi-cuenta/tramites");
  const available = portalDisponible();
  return (
    <div className="container-page max-w-md py-[clamp(2.5rem,2rem+2vw,4rem)]">
      <p className="eyebrow">Gestión de trámites</p>
      <h1 className="mt-2 display-3">Entra en tu carpeta</h1>
      <p className="mt-3 text-[var(--color-ink-soft)]">
        Tus viviendas, trámites, documentos y justificantes en un solo sitio.
      </p>
      {sp.error === "enlace" && (
        <p className="pv-note pv-note--error mt-5" role="alert">
          El enlace no es válido o ya se ha usado. Entra con tu correo y contraseña o pide uno nuevo.
        </p>
      )}
      {!available ? (
        <p className="pv-note pv-note--warn mt-6">El acceso de clientes estará disponible muy pronto.</p>
      ) : (
        <div className="pv-card mt-6 p-6">
          <ActionForm action={ownerLoginAction} submitLabel="Entrar">
            <input type="hidden" name="next" value={sp.next ?? "/mi-cuenta/tramites"} />
            <label className="block">
              <span className="pv-label">Correo electrónico</span>
              <input className="pv-input" name="email" type="email" autoComplete="email" required />
            </label>
            <label className="block">
              <span className="pv-label">Contraseña</span>
              <input className="pv-input" name="password" type="password" autoComplete="current-password" required />
            </label>
          </ActionForm>
          <p className="mt-4 text-sm">
            <Link href="/mi-cuenta/acceso/recuperar" className="underline">
              He olvidado mi contraseña
            </Link>
          </p>
        </div>
      )}
      <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
        ¿Todavía no eres cliente?{" "}
        <Link href="/gestion-tramites-alquiler-turistico" className="font-semibold underline">
          Conoce el servicio
        </Link>
      </p>
    </div>
  );
}
