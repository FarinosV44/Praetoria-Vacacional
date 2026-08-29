import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { CampaignForm } from "../../CampaignForm";
import { createCampaignAndRedirect } from "@/domains/marketing/actions";

export const metadata = { title: "Nueva campaña" };

export default async function NuevaCampanaPage() {
  const segments = await getRepository().listSegments();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/marketing" className="text-sm text-[var(--accent-700)] hover:underline">
          ← Marketing
        </Link>
        <h1 className="mt-1 font-display text-2xl">Nueva campaña</h1>
      </div>
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <CampaignForm
          action={createCampaignAndRedirect}
          segments={segments}
          submitLabel="Crear campaña"
        />
      </div>
    </div>
  );
}
