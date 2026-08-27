import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SimulatorClient } from "./SimulatorClient";
import { stripeEnabled } from "@/domains/payments/stripe";

export const metadata: Metadata = { title: "Pago (demo)", robots: { index: false, follow: false } };

export default async function SimularPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; lang?: string }>;
}) {
  const { id, lang } = await searchParams;
  if (stripeEnabled || !id) redirect("/");
  return (
    <div className="container-page py-12">
      <SimulatorClient reservationId={id} locale={lang === "en" ? "en" : "es"} />
    </div>
  );
}
