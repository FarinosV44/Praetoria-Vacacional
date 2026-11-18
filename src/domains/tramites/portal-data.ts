import "server-only";
import { ownerReadStore } from "./repo";
import { ownsAccount, type OwnerContext } from "./context";
import { nextPending } from "./deadlines";
import { isOpen, needsAttention } from "./workflow";

/**
 * Lecturas del portal «Mi carpeta». Todas pasan por `ownerReadStore()` (RLS
 * con la sesión del cliente en Supabase) y además filtran por las cuentas del
 * contexto: una fila de otra cuenta nunca llega a la vista.
 */

const mine = <T extends { accountId: string }>(ctx: OwnerContext, rows: T[]) => rows.filter((r) => ownsAccount(ctx, r.accountId));

export async function portalSnapshot(ctx: OwnerContext) {
  const s = ownerReadStore();
  const accountId = ctx.account.id;
  const [properties, filings, documents, reports, orders, messages] = await Promise.all([
    s.listProperties({ accountId }),
    s.listFilings({ accountId }),
    s.listDocuments({ accountId }),
    s.listReports({ accountId }),
    s.listOrders({ accountId }),
    s.listMessages(accountId),
  ]);
  return {
    properties: mine(ctx, properties),
    filings: mine(ctx, filings),
    documents: mine(ctx, documents),
    reports: mine(ctx, reports),
    orders: mine(ctx, orders),
    messages: mine(ctx, messages),
  };
}

export type PortalSnapshot = Awaited<ReturnType<typeof portalSnapshot>>;

export function attention(snap: PortalSnapshot, now = new Date()) {
  const docsPending = snap.filings.filter((f) => isOpen(f.status) && needsAttention(f));
  const unpaid = snap.orders.filter((o) => o.status === "pendiente_pago" || o.status === "pendiente_verificacion");
  const reportsMissingData = snap.reports.filter((r) => !r.cancelledAt && !r.travellerDataEnc && r.checkIn >= now.toISOString().slice(0, 10));
  const deadlines = snap.reports
    .map((r) => ({ r, n: nextPending(r, now) }))
    .filter((x) => x.n && (x.n.state === "vence_pronto" || x.n.state === "vencido"));
  const unpaidReports = snap.reports.filter((r) => r.billing === "pendiente");
  const unread = snap.messages.filter((m) => m.author === "admin" && !m.readByOwnerAt).length;
  return { docsPending, unpaid, reportsMissingData, deadlines, unpaidReports, unread };
}
