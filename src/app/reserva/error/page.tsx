import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { getCheckoutStrings } from "@/i18n/checkout";
import { localizedPath } from "@/i18n/config";

export const metadata: Metadata = {
  title: "No se completó el pago",
  robots: { index: false, follow: false },
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; lang?: string }>;
}) {
  const { code, lang } = await searchParams;
  const locale = lang === "en" ? "en" : "es";
  const t = getCheckoutStrings(locale);
  const reservation = code ? await getRepository().getReservationByCode(code) : null;
  const property = reservation ? getPropertyById(reservation.propertyId) : null;

  const retryHref = property
    ? localizedPath(
        locale,
        `/reservar/${property.slug}?checkIn=${reservation!.checkIn}&checkOut=${reservation!.checkOut}&guests=${reservation!.guests}`,
      )
    : localizedPath(locale, "/");

  return (
    <div className="container-page py-16" lang={locale === "en" ? "en" : undefined}>
      <div className="pv-card pv-card--soft mx-auto max-w-lg !p-8 text-center">
        <p className="text-4xl">↺</p>
        <h1 className="mt-3 display-3">{t.failedHeading}</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">{t.failedSub}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={retryHref}
            className="pv-btn pv-btn--primary"
          >
            {property ? t.retry : t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
