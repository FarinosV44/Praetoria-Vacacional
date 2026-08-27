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
      <div className="mx-auto max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-8 text-center">
        <p className="text-4xl">↺</p>
        <h1 className="mt-3 font-display text-2xl">{t.failedHeading}</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">{t.failedSub}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={retryHref}
            className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white"
          >
            {property ? t.retry : t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
