import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { RequestLinkForm } from "./RequestLinkForm";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Gestiona tu reserva",
    description: "Accede a tu reserva directa con Praetoria Vacacional para ver los detalles, indicar tu llegada y descargar la factura.",
    path: "/mi-reserva",
  }),
  robots: { index: false, follow: false },
};

export default function MiReservaPage() {
  return (
    <div className="container-page max-w-lg py-12">
      <h1 className="display-2">Gestiona tu reserva</h1>
      <p className="lede mt-3">
        Introduce tu localizador y el correo con el que reservaste. Te enviaremos un enlace privado
        para ver los detalles, indicar tu hora de llegada, hacer peticiones y descargar la factura.
      </p>
      <div className="pv-card pv-card--pad mt-8">
        <RequestLinkForm />
      </div>
      <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
        ¿Reservaste por Booking o Airbnb? Gestiona esa reserva desde la plataforma correspondiente.
      </p>
    </div>
  );
}
