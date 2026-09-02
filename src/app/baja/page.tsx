import type { Metadata } from "next";
import { getRepository } from "@/lib/repository";
import { verifyUnsubToken } from "@/domains/marketing/unsubscribe";
import { confirmUnsubscribeAction } from "./actions";

export const metadata: Metadata = {
  title: "Baja de comunicaciones",
  robots: { index: false, follow: false },
};

export default async function BajaPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; hecho?: string }>;
}) {
  const { t, hecho } = await searchParams;
  const email = t ? verifyUnsubToken(t) : null;

  let already = false;
  if (email) already = await getRepository().isUnsubscribed(email).catch(() => false);

  return (
    <div className="container-page max-w-lg py-16">
      <h1 className="display-3">Baja de comunicaciones comerciales</h1>
      {!email ? (
        <p className="mt-4 text-[var(--color-ink-soft)]">
          Este enlace no es válido. Si quieres dejar de recibir nuestras comunicaciones, escríbenos y
          lo gestionamos.
        </p>
      ) : hecho || already ? (
        <p className="mt-4 text-[var(--color-ink)]">
          Hecho. <strong>{email}</strong> ya no recibirá comunicaciones comerciales nuestras. Los
          correos operativos de tus reservas (confirmación, llegada, factura) se siguen enviando.
        </p>
      ) : (
        <form action={confirmUnsubscribeAction} className="mt-6">
          <input type="hidden" name="t" value={t} />
          <p className="text-[var(--color-ink-soft)]">
            Vas a dar de baja <strong>{email}</strong> de las comunicaciones comerciales.
          </p>
          <button type="submit" className="pv-btn pv-btn--primary mt-4">
            Confirmar baja
          </button>
        </form>
      )}
    </div>
  );
}
