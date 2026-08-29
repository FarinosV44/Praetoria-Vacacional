import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TrackOnMount } from "@/components/TrackOnMount";
import { company, companyAddressOneLine } from "@/content/company";

export const metadata: Metadata = pageMetadata({
  title: "Contacto",
  description:
    "Contacta con Praetoria Vacacional para dudas sobre disponibilidad, condiciones o tu reserva en Javalambre o Valencia.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <div>
      <TrackOnMount event="contact_click" />
      <Breadcrumbs
        items={[
          { name: "Inicio", path: "/" },
          { name: "Contacto", path: "/contacto" },
        ]}
      />
      <div className="container-page max-w-2xl py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Contacto</h1>
        <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
          Para cualquier duda antes de reservar o sobre una reserva existente, escríbenos. Te
          respondemos lo antes posible.
        </p>
        <dl className="mt-8 space-y-3 text-[var(--color-ink)]">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Email</dt>
            <dd>
              <a className="hover:text-[var(--accent-700)]" href={`mailto:${company.email}`}>
                {company.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Teléfono y WhatsApp
            </dt>
            <dd>
              <a
                className="hover:text-[var(--accent-700)]"
                href={`tel:${company.phone.replace(/\s+/g, "")}`}
              >
                {company.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Titular</dt>
            <dd>
              {company.legalName} · NIF {company.taxId}
              <br />
              {companyAddressOneLine()}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
          Consulta el{" "}
          <Link className="underline hover:text-[var(--accent-700)]" href="/legal/aviso-legal">
            aviso legal
          </Link>{" "}
          para los datos registrales completos.
        </p>
      </div>
    </div>
  );
}
