import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = pageMetadata({
  title: "Praetoria Vacacional · Beach and mountain stays, booked direct",
  description:
    "Book direct at two properties: Javalambre Mountain SuperSki for the snow and Valencia Frente al Mar for the beach. Real availability, full price, instant confirmation.",
  path: "/en",
  locale: "en",
  hreflangFor: "/",
});

export const revalidate = 3600;

export default function EnHomePage() {
  return <HomeView locale="en" />;
}
