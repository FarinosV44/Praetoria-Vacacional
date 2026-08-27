import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { quoteForCheckout } from "@/domains/booking/service";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "Reservar",
  robots: { index: false, follow: false },
};

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { property } = await params;
  const sp = await searchParams;
  const prop = getPropertyBySlug(property);
  if (!prop) notFound();

  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : "";
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : "";
  const guests = Number(typeof sp.guests === "string" ? sp.guests : "2") || 2;

  const result = await quoteForCheckout(prop.slug, checkIn, checkOut, guests);

  return (
    <div data-experience={prop.experience} className="container-page py-8">
      <h1 className="sr-only">Reservar {prop.name}</h1>
      {!result.ok ? (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--color-line)] bg-white p-6 text-center">
          <p className="font-display text-xl">No podemos continuar con estas fechas</p>
          <p className="mt-2 text-[var(--color-ink-soft)]">{result.error}</p>
          <Link
            href={`/${prop.slug}`}
            className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
          >
            Elegir fechas en {prop.name}
          </Link>
        </div>
      ) : (
        <CheckoutFlow
          propertySlug={prop.slug}
          propertyName={prop.name}
          experience={prop.experience}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          quote={{
            nights: result.quote.nights,
            nightlySubtotalCents: result.quote.nightlySubtotalCents,
            cleaningFeeCents: result.quote.cleaningFeeCents,
            extraGuestFeeCents: result.quote.extraGuestFeeCents,
            taxCents: result.quote.taxCents,
            totalCents: result.quote.totalCents,
            lengthOfStayDiscount: result.quote.lengthOfStayDiscount
              ? {
                  label: result.quote.lengthOfStayDiscount.label,
                  amountCents: result.quote.lengthOfStayDiscount.amountCents,
                }
              : null,
          }}
          cancellationSummary={prop.cancellationPolicy.summary}
        />
      )}
    </div>
  );
}
