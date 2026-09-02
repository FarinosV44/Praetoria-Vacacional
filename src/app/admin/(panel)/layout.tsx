import type { Metadata } from "next";
import "./admin.css";
import { requireAdmin } from "@/domains/admin/auth";
import { logoutAction } from "@/domains/admin/actions";
import { DEMO_MODE } from "@/lib/env";
import { getCurrentRole, ROLE_LABEL } from "@/domains/admin/roles";
import { getAdminContext } from "@/domains/admin/context";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MfaGate } from "./MfaGate";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const role = await getCurrentRole();
  const ctx = await getAdminContext();
  return (
    <div className="admin-shell">
      <div className="admin-grid">
        <AdminNav />

        <div className="flex min-w-0 flex-col">
          <header className="admin-topbar">
            <AdminTopbar
              right={
                <div className="flex items-center gap-2">
                  <span className="admin-chip hidden md:inline-flex" data-tone="accent">
                    {ROLE_LABEL[role]}
                  </span>
                  {DEMO_MODE && (
                    <span
                      className="admin-chip hidden md:inline-flex"
                      data-tone="warn"
                      title="Sin base de datos conectada"
                    >
                      modo demo
                    </span>
                  )}
                  <form action={logoutAction}>
                    <button className="admin-btn" data-variant="ghost" type="submit">
                      Salir
                    </button>
                  </form>
                </div>
              }
            />
          </header>

          <main className="admin-main">{ctx?.needsMfa ? <MfaGate /> : children}</main>
        </div>
      </div>
    </div>
  );
}
