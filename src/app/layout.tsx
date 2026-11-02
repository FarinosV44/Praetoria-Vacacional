import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { publicEnv } from "@/lib/env";
import { absoluteUrl, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Analytics } from "@/components/Analytics";
import { ExperimentTracker } from "@/components/ExperimentTracker";
import "./globals.css";

// One neo-grotesk family for brand, headlines and text (creative direction 2026,
// #99). Inter is OFL-licensed; the optical-size axis gives Helvetica-like display
// cuts at headline sizes without shipping a second font.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${publicEnv.siteName} · Alojamientos de playa y montaña con reserva directa`,
    template: `%s · ${publicEnv.siteName}`,
  },
  description:
    "Dos apartamentos con reserva directa: frente al mar en la playa de la Llastra, al sur de Valencia, y junto a las pistas de Javalambre.",
  applicationName: publicEnv.siteName,
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    siteName: publicEnv.siteName,
    locale: "es_ES",
    url: absoluteUrl("/"),
    images: ["/images/og/default.jpg"],
  },
  robots: { index: true, follow: true },
  verification: publicEnv.gscVerification
    ? { google: publicEnv.gscVerification }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#202827",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <SiteChrome
          header={<SiteHeader />}
          footer={<SiteFooter />}
          whatsappNumber={publicEnv.whatsappNumber}
        >
          {children}
        </SiteChrome>
        <Analytics />
        <ExperimentTracker />
      </body>
    </html>
  );
}
