import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = pageMetadata({
  title: "Praetoria Vacacional · Beach and mountain stays, booked direct",
  description:
    "Book direct at two apartments: right on la Llastra beach south of Valencia and next to the Javalambre ski slopes. Full price and instant confirmation.",
  path: "/en",
  locale: "en",
  hreflangFor: "/",
});

export const revalidate = 3600;

export default function EnHomePage() {
  return <HomeView locale="en" />;
}
