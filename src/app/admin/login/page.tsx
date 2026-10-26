import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated, adminEnabled } from "@/domains/admin/auth";
import { env } from "@/lib/env";
import { safeAdminNext } from "@/domains/admin/next-path";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Acceso administración", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Honour `next` so the phone app (start_url /admin/movil) lands back on its
  // own screen after signing in, not on the dashboard.
  if (await isAdminAuthenticated()) redirect(safeAdminNext((await searchParams).next));
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-white p-6">
        <h1 className="font-display text-xl">Administración</h1>
        {adminEnabled ? (
          <LoginForm supabaseAuth={env.adminSupabaseAuth} />
        ) : (
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            El panel no está configurado. Define <code>ADMIN_PASSWORD</code> en el entorno para
            habilitarlo (ver <code>docs/SETUP.md</code>).
          </p>
        )}
      </div>
    </div>
  );
}
