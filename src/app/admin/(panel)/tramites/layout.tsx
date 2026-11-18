import { getAdminContext } from "@/domains/admin/context";
import { can } from "@/domains/admin/roles";

/**
 * Servicios a propietarios: datos de clientes externos. Solo los roles con
 * permiso de trámites ven esta sección (el rol «Solo lectura» no).
 */
export default async function TramitesAdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  if (!ctx || !can(ctx.role, "tramites.write")) {
    return (
      <div className="admin-card p-6 text-sm">
        <h1 className="font-display text-xl">Servicios a propietarios</h1>
        <p className="admin-muted mt-2">
          Tu rol no tiene acceso a esta sección. Pide a un administrador el rol «Gestor de
          trámites».
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
