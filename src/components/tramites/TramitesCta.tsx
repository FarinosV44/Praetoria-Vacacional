"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

/**
 * Botón principal de la landing. Con la contratación online desactivada no
 * aparenta un alta con pago: lleva a la prealta (solicitud sin cobro).
 */
export function TramitesCta({
  active,
  where,
  tone = "dark",
}: {
  active: boolean;
  where: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/alta-tramites"
      onClick={() => track("lead_start", { source: where, mode: active ? "alta" : "prealta" })}
      className={`pv-btn pv-btn--lg ${tone === "light" ? "pv-btn--ondark" : "pv-btn--ink"}`}
    >
      {active ? "Contratar gestión de trámites" : "Solicitar el alta sin compromiso"}
    </Link>
  );
}
