import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { articleJsonLd } from "@/lib/seo";
import { TRAMITES_PUBLIC_PREFIX } from "@/domains/tramites/launch";

/** Marco común de las guías de trámites: migas, artículo, fecha de revisión y llamada al servicio. */
export function GuideShell({
  path,
  title,
  description,
  updated,
  lede,
  children,
}: {
  path: string;
  title: string;
  description: string;
  updated: string;
  lede: string;
  children: React.ReactNode;
}) {
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Gestión de trámites", path: TRAMITES_PUBLIC_PREFIX },
    { name: title, path },
  ];
  return (
    <>
      <JsonLd
        data={articleJsonLd({
          headline: title,
          description,
          path,
          datePublished: updated,
          dateModified: updated,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <article className="container-page py-[clamp(2.5rem,2rem+2vw,4.5rem)]">
        <header className="mx-auto max-w-2xl">
          <p className="eyebrow">Guía para propietarios</p>
          <h1 className="display-3 mt-3 text-balance">{title}</h1>
          <p className="lede mt-4">{lede}</p>
          <p className="mt-3 text-sm text-[var(--color-ink-faint)]">
            Revisado el{" "}
            {new Date(updated).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            . Información general, no sustituye al asesoramiento sobre tu caso.
          </p>
        </header>
        <div className="blog-prose mx-auto mt-8 max-w-2xl">{children}</div>
        <aside className="mx-auto mt-12 max-w-2xl rounded-[var(--radius-lg)] bg-[var(--color-ink)] p-6 text-white sm:p-8">
          <p className="text-lg font-semibold">¿Prefieres que lo hagamos nosotros?</p>
          <p className="mt-2 text-white/80">
            Damos de alta tu vivienda en SES.HOSPEDAJES y comunicamos cada reserva y entrada por ti,
            con justificante en tu carpeta.
          </p>
          <Link href={TRAMITES_PUBLIC_PREFIX} className="pv-btn pv-btn--ondark mt-5">
            Ver el servicio y los precios
          </Link>
        </aside>
      </article>
    </>
  );
}
