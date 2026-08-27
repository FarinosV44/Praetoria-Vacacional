"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary (issue #42). Never shows a stack trace to the user;
 * logs the detail to the console for the operator.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-5xl text-[var(--accent-600)]">Vaya</p>
      <h1 className="mt-4 font-display text-2xl">Algo no ha ido bien</h1>
      <p className="mt-2 max-w-md text-[var(--color-ink-soft)]">
        Ha ocurrido un problema temporal al cargar esta página. Inténtalo de nuevo; si sigue
        pasando, escríbenos y lo revisamos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-[var(--color-line)]"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
