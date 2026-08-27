import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-6xl text-[var(--accent-600)]">404</p>
      <h1 className="mt-4 font-display text-2xl">No encontramos esta página</h1>
      <p className="mt-2 text-[var(--color-ink-soft)]">
        Puede que el enlace haya cambiado. Prueba desde uno de nuestros alojamientos:
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
        >
          Ir al inicio
        </Link>
        {getAllProperties().map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-[var(--color-line)]"
          >
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
