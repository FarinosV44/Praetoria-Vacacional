import Link from "next/link";
import { getAllProperties } from "@/domains/properties/registry";
import { SyncAllButton } from "@/components/admin/sync/SyncAllButton";

export const metadata = { title: "Sincronizar calendarios" };
export const dynamic = "force-dynamic";

/**
 * Quick link: opening /admin/sincronizar starts the Booking + Airbnb import for
 * every apartment straight away (also the admin app's home-screen shortcut).
 */
export default function QuickSyncPage() {
  const names = Object.fromEntries(getAllProperties().map((p) => [p.slug, p.name]));
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1>Sincronizar calendarios</h1>
      <section className="admin-card p-4">
        <SyncAllButton propertyNames={names} autoRun />
      </section>
      <p className="text-sm">
        <Link href="/admin/sincronizacion" className="underline">
          Ver enlaces iCal y estado de cada canal
        </Link>{" "}
        ·{" "}
        <Link href="/admin/movil" className="underline">
          Volver a la app
        </Link>
      </p>
    </div>
  );
}
