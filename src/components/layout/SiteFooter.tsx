import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { LogoMark } from "./Logo";
import { company, companyAddressOneLine } from "@/content/company";

const legal = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacidad", label: "Política de privacidad" },
  { href: "/legal/cookies", label: "Política de cookies" },
  { href: "/legal/condiciones-reserva", label: "Condiciones de reserva" },
];

const colHead =
  "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]";
const colLink =
  "block py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--accent-700)]";

export function SiteFooter() {
  const properties = getAllProperties();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-line)] bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-display text-lg">
            <LogoMark className="h-5 w-5 text-[var(--accent-600)]" />
            Praetoria Vacacional
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Reserva directa en alojamientos de playa y montaña. Sin intermediarios, con
            confirmación inmediata.
          </p>
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
              <Link className={colLink} href="/contacto">
                Contacto
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
      <div className="border-t border-[var(--color-line)] pb-16 lg:pb-0">
        <div className="container-page space-y-1 py-6 text-xs text-[var(--color-ink-faint)]">
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
