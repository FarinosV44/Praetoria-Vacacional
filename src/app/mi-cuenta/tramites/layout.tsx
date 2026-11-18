import { requireOwner } from "@/domains/tramites/context";
import { ownerReadStore } from "@/domains/tramites/repo";
import { ownerLogoutAction } from "@/domains/tramites/actions/account";
import { OwnerNav } from "@/components/tramites/OwnerNav";

export const dynamic = "force-dynamic";

export default async function TramitesLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOwner();
  const unread = (await ownerReadStore().listMessages(ctx.account.id)).filter(
    (m) => m.accountId === ctx.account.id && m.author === "admin" && !m.readByOwnerAt,
  ).length;
  return (
    <div className="bg-[var(--color-paper)]">
      <div className="container-page max-w-6xl pt-[clamp(1.5rem,1rem+2vw,2.5rem)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Mi carpeta · Gestión de trámites</p>
            <p className="mt-1 text-lg font-semibold">{ctx.account.legalName}</p>
          </div>
          <form action={ownerLogoutAction}>
            <button type="submit" className="text-sm underline">
              Salir
            </button>
          </form>
        </div>
        <div className="mt-5">
          <OwnerNav unread={unread} />
        </div>
      </div>
      <div className="container-page max-w-6xl py-[clamp(1.5rem,1rem+2vw,3rem)]">{children}</div>
    </div>
  );
}
