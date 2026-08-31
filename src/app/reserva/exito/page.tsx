import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { formatMoney, formatDateLong, guestsLabel, nightsLabel } from "@/lib/format";
import { getCheckoutStrings } from "@/i18n/checkout";
import { localizedPath } from "@/i18n/config";
import { ConfirmationTracker } from "./ConfirmationTracker";

export const metadata: Metadata = {
  title: "Reserva confirmada",
  robots: { index: false, follow: false },
};

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; lang?: string }>;
}) {
  const { code, lang } = await searchParams;
  const locale = lang === "en" ? "en" : "es";
  const t = getCheckoutStrings(locale);
  const reservation = code ? await getRepository().getReservationByCode(code) : null;
  const property = reservation ? getPropertyById(reservation.propertyId) : null;
  const confirmed = reservation?.status === "confirmed";

  return (
    <div className="container-page py-16" lang={locale === "en" ? "en" : undefined}>
      <div className="pv-card pv-card--soft mx-auto max-w-lg !p-8 text-center">
        {confirmed ? (
          <>
            <ConfirmationTracker
              propertySlug={property?.slug ?? ""}
              totalCents={reservation!.totalCents}
              code={reservation!.code}
            />
            <span
              aria-hidden
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-50)] text-2xl text-[var(--color-success)]"
            >
              ✓
            </span>
            <h1 className="mt-4 display-3">{t.confirmedHeading}</h1>
            <p className="mt-2 text-[var(--color-ink-soft)]">{t.confirmedSub}</p>
            <dl className="mt-6 space-y-2 text-left text-sm">
              <Row label={t.ref} value={reservation!.code} strong />
              <Row label={t.property} value={property?.name ?? "—"} />
              <Row label={t.checkIn} value={formatDateLong(reservation!.checkIn)} />
              <Row label={t.checkOut} value={formatDateLong(reservation!.checkOut)} />
              <Row
                label={t.stay}
                value={`${nightsLabel(reservation!.nights)} · ${guestsLabel(reservation!.guests)}`}
              />
              <Row label={t.amountPaid} value={formatMoney(reservation!.totalCents)} strong />
            </dl>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-50)] text-2xl"
            >
              ⏳
            </span>
            <h1 className="mt-4 display-3">{t.confirmingHeading}</h1>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              {reservation ? t.confirmingSub : t.notFoundSub}
            </p>
          </>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={localizedPath(locale, "/")}
            className="pv-btn pv-btn--primary"
          >
            {t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
      <dt className="text-[var(--color-ink-soft)]">{label}</dt>
      <dd className={strong ? "font-semibold" : ""}>{value}</dd>
    </div>
  );
}
