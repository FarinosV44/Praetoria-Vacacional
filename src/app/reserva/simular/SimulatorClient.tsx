"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getCheckoutStrings } from "@/i18n/checkout";
import { localizedPath, type Locale } from "@/i18n/config";

export function SimulatorClient({
  reservationId,
  locale = "es",
}: {
  reservationId: string;
  locale?: Locale;
}) {
  const router = useRouter();
  const t = getCheckoutStrings(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const langQ = locale === "en" ? "&lang=en" : "";

  async function run(outcome: "success" | "failure") {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId, outcome }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      setBusy(false);
      return;
    }
    const base = locale === "en" ? "/reserva" : "/reserva";
    if (data.status === "confirmed") router.push(`${base}/exito?code=${data.code}${langQ}`);
    else router.push(`${base}/error?code=${data.code}${langQ}`);
  }

  return (
    <div
      className="mx-auto max-w-md rounded-xl border border-[var(--color-line)] bg-white p-6"
      lang={locale === "en" ? "en" : undefined}
    >
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t.simDemoNote}</p>
      <h1 className="mt-4 font-display text-xl">{t.simHeading}</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 space-y-2">
        <Button className="w-full" size="lg" disabled={busy} onClick={() => run("success")}>
          {t.simOk}
        </Button>
        <Button className="w-full" variant="secondary" disabled={busy} onClick={() => run("failure")}>
          {t.simFail}
        </Button>
      </div>
      <a
        href={localizedPath(locale, "/")}
        className="mt-4 block text-center text-xs text-[var(--color-ink-soft)] underline"
      >
        {t.backHome}
      </a>
    </div>
  );
}
