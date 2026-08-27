import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyBySlug, localizedProperty } from "@/domains/properties/registry";
import { quoteForCheckout } from "@/domains/booking/service";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { getCheckoutStrings } from "@/i18n/checkout";
import { localizedPath, type Locale } from "@/i18n/config";

export async function CheckoutPageView({
  slug,
  checkIn,
  checkOut,
  guests,
  locale,
}: {
  slug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  locale: Locale;
}) {
  const raw = getPropertyBySlug(slug);
  if (!raw) notFound();
  const prop = localizedProperty(raw, locale);
  const t = getCheckoutStrings(locale);

  const result = await quoteForCheckout(prop.slug, checkIn, checkOut, guests);

  return (
    <div data-experience={prop.experience} className="container-page py-8">
      <h1 className="sr-only">
        {locale === "en" ? "Book" : "Reservar"} {prop.name}
      </h1>
      {!result.ok ? (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--color-line)] bg-white p-6 text-center">
          <p className="font-display text-xl">{t.cannotContinue}</p>
          <p className="mt-2 text-[var(--color-ink-soft)]">{result.error}</p>
          <Link
            href={localizedPath(locale, `/${prop.slug}`)}
            className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
          >
            {t.chooseDates(prop.name)}
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
          locale={locale}
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
