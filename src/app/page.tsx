import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = pageMetadata({
  title: "Praetoria Vacacional · Alojamientos de playa y montaña con reserva directa",
  description:
    "Reserva directa en dos alojamientos: Javalambre Mountain SuperSki para la nieve y Valencia Frente al Mar para la playa. Disponibilidad real, precio total y confirmación inmediata.",
  path: "/",
  hreflangFor: "/",
});

export const revalidate = 3600;

export default function HomePage() {
  return <HomeView locale="es" />;
}
