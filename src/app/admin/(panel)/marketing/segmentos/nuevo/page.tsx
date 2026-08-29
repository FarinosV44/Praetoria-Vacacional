import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { SegmentForm } from "../../SegmentForm";
import { createSegmentAndRedirect } from "@/domains/marketing/actions";

export const metadata = { title: "Nuevo segmento" };

export default function NuevoSegmentoPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/marketing" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Marketing
        </Link>
        <h1 className="mt-1 font-display text-2xl">Nuevo segmento</h1>
      </div>
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <SegmentForm
          action={createSegmentAndRedirect}
          properties={getAllProperties()}
          submitLabel="Crear segmento"
        />
      </div>
    </div>
  );
}
