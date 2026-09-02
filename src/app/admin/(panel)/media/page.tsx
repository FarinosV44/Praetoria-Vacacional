import { getRepository } from "@/lib/repository";
import { env, DEMO_MODE } from "@/lib/env";
import { MediaUpload } from "./MediaUpload";
import { MediaCard } from "./MediaCard";

export const metadata = { title: "Biblioteca de medios" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const assets = await getRepository().listMedia({ limit: 200 }).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Biblioteca de medios</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Sube imágenes una vez y reutilízalas: cada archivo guarda su texto alternativo (ALT),
          punto focal para recortes y etiquetas. Los archivos se guardan en un bucket privado y se
          sirven mediante enlaces firmados.
        </p>
        {(DEMO_MODE || !env.supabaseConfigured) && (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Sin Supabase Storage no se pueden subir archivos. Configura Supabase y crea un bucket
            <strong> privado</strong> llamado <code>media</code>.
          </p>
        )}
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-display text-lg">Subir</h2>
        <MediaUpload disabled={DEMO_MODE || !env.supabaseConfigured} />
      </section>

      {assets.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Aún no hay archivos.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <MediaCard key={a.id} asset={a} />
          ))}
        </div>
      )}
    </div>
  );
}
