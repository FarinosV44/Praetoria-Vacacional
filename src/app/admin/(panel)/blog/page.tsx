import Link from "next/link";
import { listAllPosts } from "@/domains/blog/store";
import { isScheduled } from "@/domains/blog/helpers";
import { BLOG_DESTINATIONS } from "@/domains/blog/types";
import { deleteBlogPostAction } from "@/domains/blog/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export const metadata = { title: "Blog" };

const DEST_LABEL = Object.fromEntries(BLOG_DESTINATIONS.map((d) => [d.value, d.label]));

export default async function AdminBlogPage() {
  const posts = await listAllPosts();
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Blog / Actualidad</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Publica artículos, noticias y guías sin tocar código. Los artículos publicados aparecen
            en <code>/blog</code>, se añaden al sitemap y enlazan con la ficha del alojamiento.
          </p>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="h-10 shrink-0 rounded-lg bg-[var(--accent-600)] px-4 text-sm font-medium leading-10 text-white"
        >
          Nuevo artículo
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-ink-soft)]">
          Todavía no hay artículos. Crea el primero con «Nuevo artículo».
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-soft)]">
              <th className="py-2 pr-3">Título</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Destino</th>
              <th className="py-2 pr-3">Fecha</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-[var(--color-line)] align-top">
                <td className="py-2 pr-3">
                  <Link href={`/admin/blog/${post.id}`} className="font-medium hover:text-[var(--accent-700)]">
                    {post.title}
                  </Link>
                  <div className="text-xs text-[var(--color-ink-soft)]">/blog/{post.slug}</div>
                </td>
                <td className="py-2 pr-3">
                  {post.status === "published" ? (
                    isScheduled(post, now) ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        programado
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        publicado
                      </span>
                    )
                  ) : (
                    <span className="rounded-full bg-[var(--color-paper)] px-2 py-0.5 text-xs ring-1 ring-[var(--color-line)]">
                      borrador
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-xs">{DEST_LABEL[post.destination]}</td>
                <td className="py-2 pr-3 text-xs text-[var(--color-ink-soft)]">
                  {(post.publishedAt ?? post.createdAt).slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <form action={deleteBlogPostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <ConfirmSubmit message={`¿Eliminar el artículo «${post.title}»?`}>
                      Eliminar
                    </ConfirmSubmit>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
