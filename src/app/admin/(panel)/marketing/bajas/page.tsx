import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata = { title: "Bajas de marketing" };

export default async function BajasPage() {
  const unsubs = await getRepository().listUnsubscribes();
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/marketing" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Marketing
        </Link>
        <h1 className="mt-1 font-display text-2xl">Bajas de marketing</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Los emails de esta lista se excluyen de todas las campañas y su consentimiento se retira
          automáticamente.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <UnsubscribeForm />
      </div>
      <ul className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-white text-sm">
        {unsubs.length === 0 && <li className="p-4 text-[var(--color-ink-soft)]">Sin bajas.</li>}
        {unsubs.map((u) => (
          <li key={u.email} className="flex items-center justify-between p-3">
            <span>{u.email}</span>
            <span className="text-xs text-[var(--color-ink-soft)]">
              {new Date(u.unsubscribedAt).toLocaleDateString("es-ES")} · {u.source ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
