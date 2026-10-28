import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { instagramUrl } from "@/lib/social";
import { landingLinksFor } from "@/domains/marketing/navigation";
import { Wordmark } from "./Logo";
import { company, companyAddressOneLine } from "@/content/company";

const legal = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacidad", label: "Política de privacidad" },
  { href: "/legal/cookies", label: "Política de cookies" },
  { href: "/legal/condiciones-reserva", label: "Condiciones de reserva" },
];

const colHead =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/60";
const colLink =
  "block py-1.5 text-sm text-white/85 underline-offset-4 hover:text-white hover:underline";

export function SiteFooter() {
  const properties = getAllProperties();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[var(--color-ink)] text-white/80">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div>
          <p className="text-white">
            <Wordmark />
            <span className="sr-only">Praetoria Vacacional</span>
          </p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            Dos apartamentos con reserva directa: frente a la playa de la Llastra y en
            Camarena de la Sierra, junto a Javalambre.
          </p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
            Síguenos en Instagram
          </p>
          <ul className="mt-1">
            {properties
              .filter((p) => p.instagram)
              .map((p) => (
                <li key={p.slug}>
                  <a
                    className={colLink}
                    href={instagramUrl(p.instagram!)}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Instagram de ${p.name}: @${p.instagram}`}
                  >
                    @{p.instagram}
                  </a>
                </li>
              ))}
          </ul>
        </div>

        <nav aria-label="Alojamientos">
          <p className={colHead}>Alojamientos</p>
          <ul className="mt-2">
            {properties.map((p) => (
              <li key={p.slug}>
                <Link className={colLink} href={`/${p.slug}`}>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
          {/* The landing pages behind the money keywords, linked site-wide so
              they are one click from anywhere (DinoRANK internal PageRank). */}
          <p className={`${colHead} mt-6`}>Dónde alojarse</p>
          <ul className="mt-2">
            {properties.flatMap((p) => landingLinksFor(p.slug)).map((l) => (
              <li key={l.path}>
                <Link className={colLink} href={l.path}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Guías">
          <p className={colHead}>Descubre</p>
          <ul className="mt-2">
            <li>
              <Link className={colLink} href="/guias">
                Guías de destino
              </Link>
            </li>
            <li>
              <Link className={colLink} href="/blog">
                Blog y actualidad
              </Link>
            </li>
            <li>
              <Link className={colLink} href="/ventajas-reserva-directa">
                Ventajas de reservar directo
              </Link>
            </li>
            <li>
              <Link className={colLink} href="/propietarios">
                Gestionamos tu apartamento
              </Link>
            </li>
            <li>
              <Link className={colLink} href="/contacto">
                Contacto
              </Link>
            </li>
            <li>
              <Link className={colLink} href="/mi-reserva">
                Gestiona tu reserva
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <p className={colHead}>Legal</p>
          <ul className="mt-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link className={colLink} href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* bottom clearance so the mobile/tablet sticky booking bar never covers
          the copyright line; removed once that bar is gone (lg+) */}
      <div className="border-t border-white/15 pb-16 lg:pb-0">
        <div className="container-page space-y-1 py-6 text-xs text-white/65">
          <p>
            © {year} {company.tradeName}. Pagos seguros procesados por Stripe.
          </p>
          <p>
            {company.legalName} ({company.legalForm}) · NIF {company.taxId} ·{" "}
            {companyAddressOneLine()}
          </p>
        </div>
      </div>
    </footer>
  );
}
