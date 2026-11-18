import { ActionForm } from "@/components/tramites/forms";
import { ownerForgotAction } from "@/domains/tramites/actions/account";

export const metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <div className="container-page max-w-md py-[clamp(2.5rem,2rem+2vw,4rem)]">
      <h1 className="display-3">Recupera tu contraseña</h1>
      <p className="mt-3 text-[var(--color-ink-soft)]">Te enviaremos un enlace para crear una nueva.</p>
      <div className="pv-card mt-6 p-6">
        <ActionForm action={ownerForgotAction} submitLabel="Enviar enlace">
          <label className="block">
            <span className="pv-label">Correo electrónico</span>
            <input className="pv-input" name="email" type="email" autoComplete="email" required />
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
