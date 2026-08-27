"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function SimulatorClient({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (data.status === "confirmed") router.push(`/reserva/exito?code=${data.code}`);
    else router.push(`/reserva/error?code=${data.code}`);
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--color-line)] bg-white p-6">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Modo demostración: Stripe no está configurado. Este paso simula la pasarela de pago para
        poder probar el flujo completo. Configura Stripe para el cobro real (docs/SETUP.md).
      </p>
      <h1 className="mt-4 font-display text-xl">Pasarela de pago (simulada)</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 space-y-2">
        <Button className="w-full" size="lg" disabled={busy} onClick={() => run("success")}>
          Simular pago correcto
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          disabled={busy}
          onClick={() => run("failure")}
        >
          Simular pago fallido
        </Button>
      </div>
    </div>
  );
}
