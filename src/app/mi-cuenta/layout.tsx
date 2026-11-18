import type { Metadata } from "next";

// Zona privada de clientes (#176): fuera de buscadores y sin caché compartida
// (cabeceras en middleware.ts).
export const metadata: Metadata = {
  title: { default: "Mi carpeta", template: "%s · Mi carpeta" },
  robots: { index: false, follow: false, nocache: true },
};

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
