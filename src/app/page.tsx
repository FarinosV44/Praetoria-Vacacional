import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = pageMetadata({
  title: "Praetoria Vacacional · Apartamentos de playa y montaña",
  description:
    "Dos apartamentos con reserva directa: frente al mar en la playa de la Llastra, al sur de Valencia, y junto a las pistas de Javalambre.",
  path: "/",
  hreflangFor: "/",
});

export const revalidate = 3600;

export default function HomePage() {
  return <HomeView locale="es" />;
}
