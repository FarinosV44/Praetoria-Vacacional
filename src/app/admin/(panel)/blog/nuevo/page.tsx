import Link from "next/link";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { saveBlogPostAction } from "@/domains/blog/actions";

export const metadata = { title: "Nuevo artículo" };

export default function NewBlogPostPage() {
  return (
    <div className="space-y-5">
      <Link href="/admin/blog" className="text-sm text-[var(--accent-700)] hover:underline">
        ← Volver al blog
      </Link>
      <h1 className="font-display text-2xl">Nuevo artículo</h1>
      <BlogPostForm action={saveBlogPostAction} />
    </div>
  );
}
