import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { CAMPAIGN_STATUS_LABEL } from "@/domains/marketing/types";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { CampaignForm } from "../../CampaignForm";
import { SendCampaignForm } from "../../SendCampaignForm";
import {
  saveCampaignAction,
  deleteCampaignAction,
  prepareCampaignAction,
} from "@/domains/marketing/actions";

export const metadata = { title: "Campaña" };

export default async function CampanaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const campaign = await repo.getCampaign(id);
  if (!campaign) notFound();
  const [segments, recipients] = await Promise.all([
    repo.listSegments(),
    repo.listCampaignRecipients(id),
  ]);
  const sendable = recipients.filter((r) => r.status === "pending").length;
  const skipped = recipients.filter((r) => r.status !== "pending").length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/marketing" className="text-sm text-[var(--accent-700)] hover:underline">
            ← Marketing
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-2xl">{campaign.name}</h1>
            <span className="rounded-full bg-[var(--accent-50)] px-2 py-0.5 text-xs text-[var(--accent-700)]">
              {CAMPAIGN_STATUS_LABEL[campaign.status]}
            </span>
          </div>
        </div>
        {campaign.status !== "sent" && (
          <form action={deleteCampaignAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <ConfirmSubmit message={`Eliminar la campaña «${campaign.name}»?`}>Eliminar</ConfirmSubmit>
          </form>
        )}
      </div>

      {campaign.status === "draft" && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
          <h2 className="mb-3 font-display text-lg">Editar campaña</h2>
          <CampaignForm
            action={saveCampaignAction}
            segments={segments}
            campaign={campaign}
            submitLabel="Guardar cambios"
          />
        </div>
      )}

      {campaign.status !== "sent" && (
        <form action={prepareCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <button className="h-10 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm">
            {campaign.status === "prepared" ? "Recalcular destinatarios" : "Preparar destinatarios"}
          </button>
        </form>
      )}

      {campaign.status === "prepared" && (
        <SendCampaignForm campaignId={campaign.id} recipients={sendable} />
      )}

      {recipients.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg">
            Destinatarios · {sendable} a enviar · {skipped} excluidos
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {recipients.slice(0, 300).map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 text-xs">{r.email ?? "—"}</td>
                    <td className="p-3 text-xs">{r.phone ?? "—"}</td>
                    <td className="p-3 text-xs">
                      {r.status}
                      {r.error ? ` · ${r.error}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
