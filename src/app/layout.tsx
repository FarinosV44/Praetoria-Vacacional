import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { publicEnv } from "@/lib/env";
import { absoluteUrl, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${publicEnv.siteName} · Alojamientos de playa y montaña con reserva directa`,
    template: `%s · ${publicEnv.siteName}`,
  },
  description:
    "Reserva directa en dos alojamientos: Javalambre Mountain SuperSki para la nieve y Valencia Frente al Mar para la playa. Disponibilidad real, precio total y confirmación inmediata.",
  applicationName: publicEnv.siteName,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    siteName: publicEnv.siteName,
    locale: "es_ES",
    url: absoluteUrl("/"),
    images: ["/images/og/default.svg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1f3a6b",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
