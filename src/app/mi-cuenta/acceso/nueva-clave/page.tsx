import { ActionForm } from "@/components/tramites/forms";
import { ownerResetAction } from "@/domains/tramites/actions/account";

export const metadata = { title: "Nueva contraseña" };
export const dynamic = "force-dynamic";

export default async function NuevaClavePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="container-page max-w-md py-[clamp(2.5rem,2rem+2vw,4rem)]">
      <h1 className="display-3">Crea una contraseña nueva</h1>
      <div className="pv-card mt-6 p-6">
        <ActionForm action={ownerResetAction} submitLabel="Guardar contraseña">
          {token && <input type="hidden" name="token" value={token} />}
          <label className="block">
            <span className="pv-label">Contraseña nueva</span>
            <input className="pv-input" name="password" type="password" autoComplete="new-password" required minLength={10} />
            <span className="pv-hint block">Mínimo 10 caracteres, con letras y al menos un número.</span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
