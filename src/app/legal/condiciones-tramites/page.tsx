import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TRAMITES_LEGAL_VERSIONS, tramitesMandate, tramitesPrivacy, tramitesTerms, type LegalSection } from "@/content/tramites-legal";

export const metadata: Metadata = pageMetadata({
  title: "Condiciones del servicio de gestión de trámites",
  description:
    "Condiciones, precios, autorización de representación y privacidad del servicio de gestión de trámites de alquiler turístico de Praetoria Vacacional.",
  path: "/legal/condiciones-tramites",
});

function Block({ id, title, version, sections }: { id: string; title: string; version: string; sections: LegalSection[] }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="display-3">{title}</h2>
      <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Versión {version}</p>
      {sections.map((s) => (
        <div key={s.heading} className="mt-6">
          <h3 className="text-lg font-semibold">{s.heading}</h3>
          {s.paragraphs.map((p, i) => (
            <p key={i} className="mt-2 text-[var(--color-ink-soft)]">
              {p}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}

export default function CondicionesTramitesPage() {
  return (
    <article>
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Gestión de trámites", path: "/gestion-tramites-alquiler-turistico" },
          { name: "Condiciones", path: "/legal/condiciones-tramites" },
        ]}
      />
      <div className="container-page max-w-3xl py-10">
        <h1 className="display-2">Condiciones del servicio de gestión de trámites</h1>
        <p className="mt-4 text-[var(--color-ink-soft)]">
          Estas condiciones se aplican cuando contratas con nosotros la gestión de trámites de tu vivienda de uso turístico. Al
          contratar guardamos la versión que aceptas, con la fecha y la hora.
        </p>
        <nav className="mt-6 flex flex-wrap gap-4 text-sm" aria-label="Apartados">
          <a href="#condiciones" className="underline">Condiciones</a>
          <a href="#autorizacion" className="underline">Autorización de representación</a>
          <a href="#privacidad" className="underline">Privacidad y encargo del tratamiento</a>
        </nav>
        <Block id="condiciones" title="Condiciones del servicio" version={TRAMITES_LEGAL_VERSIONS.terms} sections={tramitesTerms} />
        <Block id="autorizacion" title="Autorización de representación" version={TRAMITES_LEGAL_VERSIONS.mandate} sections={tramitesMandate} />
        <Block id="privacidad" title="Privacidad y encargo del tratamiento" version={TRAMITES_LEGAL_VERSIONS.privacy} sections={tramitesPrivacy} />
      </div>
    </article>
  );
}
