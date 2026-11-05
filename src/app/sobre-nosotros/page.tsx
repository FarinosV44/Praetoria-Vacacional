import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { company, companyAddressOneLine, companyRegistryLine } from "@/content/company";
import { directBookingAdvantages } from "@/content/site";
import { getAllProperties } from "@/domains/properties/registry";

export const metadata: Metadata = pageMetadata({
  title: "Sobre nosotros · Praetoria Vacacional",
  description:
    "Quién está detrás de Praetoria Vacacional: dos apartamentos con reserva directa en la playa de la Llastra y en Javalambre, gestionados por PRAETORIA, S.L.",
  path: "/sobre-nosotros",
});

export default function SobreNosotrosPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Sobre nosotros", path: "/sobre-nosotros" },
        ]}
      />
      <div className="container-page max-w-2xl py-10">
        <h1 className="display-2">Sobre nosotros</h1>
        <p className="lede mt-4">
          {company.tradeName} es la web de reserva directa de dos apartamentos: uno frente al mar
          en la playa de la Llastra, al sur de Valencia, y otro en Camarena de la Sierra, junto a
          las pistas de Javalambre.
        </p>

        <section className="mt-10">
          <h2 className="display-3">Nuestros alojamientos</h2>
          <ul className="mt-4 space-y-3">
            {getAllProperties().map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}`}
                  className="font-medium text-[var(--accent-700)] hover:underline"
                >
                  {p.name}
                </Link>
                <p className="text-sm text-[var(--color-ink-soft)]">{p.tagline}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="display-3">Cómo trabajamos</h2>
          <ul className="mt-4 space-y-4">
            {directBookingAdvantages.map((a) => (
              <li key={a.title}>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-[var(--color-ink-soft)]">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="display-3">Quién hay detrás</h2>
          <p className="mt-3 text-[var(--color-ink-soft)]">
            {company.tradeName} es el nombre comercial de {company.legalName}, con NIF{" "}
            {company.taxId} y domicilio social en {companyAddressOneLine()}.{" "}
            {companyRegistryLine()}
          </p>
          <p className="mt-3 text-[var(--color-ink-soft)]">
            Si quieres hablar con nosotros, ve a{" "}
            <Link href="/contacto" className="text-[var(--accent-700)] hover:underline">
              contacto
            </Link>
            . Los datos completos del titular están en el{" "}
            <Link href="/legal/aviso-legal" className="text-[var(--accent-700)] hover:underline">
              aviso legal
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
