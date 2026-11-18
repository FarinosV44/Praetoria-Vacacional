import type { Metadata } from "next";
import Link from "next/link";
import { AltaWizard } from "@/components/tramites/AltaWizard";
import { PrealtaForm } from "@/components/tramites/PrealtaForm";
import { getActiveCatalog } from "@/domains/tramites/service";
import { getOwnerContext } from "@/domains/tramites/context";
import { contratacionActiva } from "@/domains/tramites/gate";

export const metadata: Metadata = {
  title: "Contratar la gestión de trámites",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AltaTramitesPage() {
  const active = contratacionActiva();
  const [catalog, ctx] = await Promise.all([getActiveCatalog(), active ? getOwnerContext() : Promise.resolve(null)]);

  return (
    <div className="container-page max-w-6xl py-[clamp(2rem,1.5rem+2vw,3.5rem)]">
      <p className="eyebrow">
        <Link href="/gestion-tramites-alquiler-turistico" className="hover:underline">
          Gestión de trámites
        </Link>
      </p>
      <h1 className="mt-2 display-3 max-w-3xl">{active ? "Contrata la gestión de tus trámites" : "Solicita la gestión de tus trámites"}</h1>
      <p className="lede mt-3 max-w-2xl">
        {active
          ? "Cinco pasos y unos minutos. Verás el precio exacto antes de pagar y podrás subir la documentación después, desde tu carpeta."
          : "Déjanos tus datos y te llamamos para explicarte el servicio y el precio de tu caso. No se cobra nada."}
      </p>
      {ctx && (
        <p className="pv-note pv-note--info mt-4 max-w-2xl">
          Has entrado como {ctx.account.legalName}. El encargo se añadirá a tu carpeta.
        </p>
      )}
      <div className="mt-8">{active ? <AltaWizard catalog={catalog} loggedIn={!!ctx} /> : <PrealtaForm />}</div>
    </div>
  );
}
