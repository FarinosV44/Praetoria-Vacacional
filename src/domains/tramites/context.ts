import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getOwnerSession, type OwnerSession } from "./auth";
import { serverStore } from "./repo";
import type { OwnerAccount, OwnerMembership } from "./types";

/**
 * Quién es el propietario que navega por «Mi carpeta», memorizado por petición.
 * La pertenencia se resuelve en el servidor; las lecturas del portal además van
 * con su propia sesión (RLS) — dos barreras independientes.
 */

export interface OwnerContext {
  session: OwnerSession;
  memberships: OwnerMembership[];
  account: OwnerAccount;
}

export const getOwnerContext = cache(async (): Promise<OwnerContext | null> => {
  const session = await getOwnerSession();
  if (!session || !session.emailVerified) return null;
  const memberships = await serverStore().listMembershipsByUser(session.userId);
  const first = memberships[0];
  if (!first) return null;
  let account = await serverStore().getAccount(first.accountId);
  if (!account || account.status === "baja" || account.status === "suspendido") return null;
  if (account.status === "pendiente_verificacion") {
    // Primer acceso con el email ya confirmado: se activa la cuenta.
    const { activateAfterVerification } = await import("./service");
    await activateAfterVerification(account.id);
    account = (await serverStore().getAccount(account.id)) ?? account;
  }
  return { session, memberships, account };
});

export async function requireOwner(next = "/mi-cuenta/tramites"): Promise<OwnerContext> {
  const ctx = await getOwnerContext();
  if (!ctx) redirect(`/mi-cuenta/acceso?next=${encodeURIComponent(next)}`);
  return ctx;
}

/** ¿La fila pertenece a una cuenta del propietario? (defensa en profundidad). */
export function ownsAccount(ctx: OwnerContext, accountId: string | null | undefined): boolean {
  return !!accountId && ctx.memberships.some((m) => m.accountId === accountId);
}
