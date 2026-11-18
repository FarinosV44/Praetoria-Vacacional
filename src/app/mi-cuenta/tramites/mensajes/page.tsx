import { requireOwner } from "@/domains/tramites/context";
import { ownerReadStore, serverStore } from "@/domains/tramites/repo";
import { MessageForm } from "@/components/tramites/portal-forms";
import { EmptyState, fmtDateTime } from "@/components/tramites/ui";

export const metadata = { title: "Mensajes" };
export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const ctx = await requireOwner("/mi-cuenta/tramites/mensajes");
  const messages = (await ownerReadStore().listMessages(ctx.account.id)).filter((m) => m.accountId === ctx.account.id);
  // Marcar como leídos es una escritura del servidor sobre su propia cuenta.
  await serverStore().markMessagesRead(ctx.account.id, "owner");
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="m-h">
        <h1 id="m-h" className="text-2xl font-semibold">Mensajes</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Respondemos en horario de oficina, de lunes a viernes.</p>
        {messages.length === 0 ? (
          <EmptyState>Todavía no hay mensajes.</EmptyState>
        ) : (
          <ol className="mt-4 space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`max-w-[42rem] rounded-[var(--radius-md)] p-4 text-sm ${m.author === "owner" ? "ml-auto bg-[var(--color-sea-50)]" : "border border-[var(--color-line)] bg-white"}`}
              >
                <span className="block text-xs text-[var(--color-ink-faint)]">
                  {m.author === "owner" ? "Tú" : "Equipo Praetoria"} · {fmtDateTime(m.createdAt)}
                </span>
                <span className="mt-1 block whitespace-pre-line">{m.body}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="pv-card self-start p-5" aria-labelledby="new-h">
        <h2 id="new-h" className="font-semibold">Escríbenos</h2>
        <div className="mt-4">
          <MessageForm />
        </div>
      </section>
    </div>
  );
}
