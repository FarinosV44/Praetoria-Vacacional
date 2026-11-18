import Link from "next/link";
import { requireOwner } from "@/domains/tramites/context";
import { portalSnapshot } from "@/domains/tramites/portal-data";
import { ownerLogoutAction, ownerRevokeSessionsAction } from "@/domains/tramites/actions/account";
import { tramitesMandate } from "@/content/tramites-legal";
import { fmtDateTime } from "@/components/tramites/ui";
import { company } from "@/content/company";

export const metadata = { title: "Mis datos" };
export const dynamic = "force-dynamic";

export default async function DatosPage() {
  const ctx = await requireOwner("/mi-cuenta/tramites/datos");
  const snap = await portalSnapshot(ctx);
  const a = ctx.account;
  const acceptances = snap.orders.map((o) => ({ ref: o.reference, ...o.acceptance }));
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="t-h" className="space-y-4">
        <h1 id="t-h" className="text-2xl font-semibold">Mis datos</h1>
        <dl className="pv-card divide-y divide-[var(--color-line)] text-sm">
          {[
            ["Titular", a.legalName],
            [a.kind === "empresa" ? "CIF" : "NIF / NIE", a.taxId],
            ["Contacto", a.contactName],
            ["Correo", a.email],
            ["Teléfono", a.phone],
            ["Facturación", a.billingAddress],
            ["Novedades por correo", a.marketingOptIn ? "Sí" : "No"],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 p-3">
              <dt className="text-[var(--color-ink-soft)]">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Para cambiar estos datos, pedir la baja, una copia de tus datos o su supresión,{" "}
          <Link href="/mi-cuenta/tramites/mensajes" className="underline">
            escríbenos
          </Link>{" "}
          o envía un correo a {company.email}.
        </p>
        <div className="flex flex-wrap gap-3">
          <form action={ownerLogoutAction}>
            <button className="pv-btn pv-btn--ghost" type="submit">
              Cerrar sesión
            </button>
          </form>
          <form action={ownerRevokeSessionsAction}>
            <button className="pv-btn pv-btn--ghost" type="submit">
              Cerrar sesión en todos los dispositivos
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="aut-h" className="space-y-4">
        <h2 id="aut-h" className="text-lg font-semibold">Autorizaciones y condiciones aceptadas</h2>
        <ul className="pv-card divide-y divide-[var(--color-line)] text-sm">
          {acceptances.map((x) => (
            <li key={x.ref} className="p-3">
              <span className="font-medium">{x.ref}</span> · {fmtDateTime(x.acceptedAt)}
              <span className="block text-xs text-[var(--color-ink-faint)]">
                {x.termsVersion} · {x.privacyVersion} · {x.mandateVersion}
              </span>
            </li>
          ))}
        </ul>
        <details className="pv-card p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Texto de la autorización de representación</summary>
          {tramitesMandate.map((s) => (
            <div key={s.heading} className="mt-3 space-y-2">
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ))}
          <p className="mt-3 text-[var(--color-ink-soft)]">
            Para presentar en tu nombre necesitamos este texto firmado: imprímelo o fírmalo con certificado y súbelo en «Documentos» como
            «Autorización de representación firmada».
          </p>
        </details>
        <p className="text-sm">
          <Link href="/legal/condiciones-tramites" className="underline">
            Condiciones del servicio y privacidad
          </Link>
        </p>
      </section>
    </div>
  );
}
