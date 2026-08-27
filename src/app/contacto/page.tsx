import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { operator } from "@/content/legal";

export const metadata: Metadata = pageMetadata({
  title: "Contacto",
  description:
    "Contacta con Praetoria Vacacional para dudas sobre disponibilidad, condiciones o tu reserva en Javalambre o Valencia.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <div>
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
            <dd>{operator.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Teléfono</dt>
            <dd>{operator.phone}</dd>
          </div>
        </dl>
        <p className="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Los datos de contacto definitivos se configuran en <code>src/content/legal.ts</code>.
        </p>
      </div>
    </div>
  );
}
