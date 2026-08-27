import type { Metadata } from "next";
import { CheckoutPageView } from "@/components/checkout/CheckoutPageView";

export const metadata: Metadata = { title: "Book", robots: { index: false, follow: false } };

export default async function EnReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { property } = await params;
  const sp = await searchParams;
  return (
    <CheckoutPageView
      slug={property}
      checkIn={typeof sp.checkIn === "string" ? sp.checkIn : ""}
      checkOut={typeof sp.checkOut === "string" ? sp.checkOut : ""}
      guests={Number(typeof sp.guests === "string" ? sp.guests : "2") || 2}
      coupon={typeof sp.coupon === "string" ? sp.coupon : undefined}
      locale="en"
    />
  );
}
