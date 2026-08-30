import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { saveBlogPostAction, deleteBlogPostAction } from "@/domains/blog/actions";
import { getPostById } from "@/domains/blog/store";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export const metadata = { title: "Editar artículo" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/blog" className="text-sm text-[var(--accent-700)] hover:underline">
        ← Volver al blog
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Editar artículo</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--accent-700)] hover:underline"
          >
            Ver en el sitio ↗
          </a>
          <form action={deleteBlogPostAction}>
            <input type="hidden" name="id" value={post.id} />
            <ConfirmSubmit message={`¿Eliminar el artículo «${post.title}»?`}>Eliminar</ConfirmSubmit>
          </form>
        </div>
      </div>
      <BlogPostForm action={saveBlogPostAction} post={post} />
    </div>
  );
}
