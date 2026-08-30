import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, articleJsonLd } from "@/lib/seo";
import { getPublicPostBySlug, listPublicPosts } from "@/domains/blog/store";
import { renderMarkdown } from "@/domains/blog/markdown";
import {
  autoExcerpt,
  ctaForPost,
  readingMinutes,
  relatedPosts,
} from "@/domains/blog/helpers";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { bookingSectionHref } from "@/domains/booking/anchor";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listPublicPosts()).map((p) => ({ slug: p.slug }));
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) return {};
  const meta = pageMetadata({
    title: post.seoTitle || `${post.title} | Blog Praetoria Vacacional`,
    description: post.metaDescription || autoExcerpt(post),
    path: `/blog/${post.slug}`,
    images: post.ogImageUrl || post.featuredImageUrl ? [post.ogImageUrl || post.featuredImageUrl!] : undefined,
  });
  if (post.canonicalUrl) meta.alternates = { ...meta.alternates, canonical: post.canonicalUrl };
  if (post.ogTitle && meta.openGraph) meta.openGraph.title = post.ogTitle;
  if (post.ogDescription && meta.openGraph) meta.openGraph.description = post.ogDescription;
  return meta;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.bodyMarkdown);
  const cta = ctaForPost(post);
  const ctaProperty = cta?.propertySlug ? getPropertyBySlug(cta.propertySlug) : null;
  const related = relatedPosts(post, await listPublicPosts(), 3);

  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <div data-experience={ctaProperty?.experience}>
      <JsonLd
        data={articleJsonLd({
          headline: post.title,
          description: post.metaDescription || autoExcerpt(post),
          path: `/blog/${post.slug}`,
          image: post.featuredImageUrl,
          datePublished: post.publishedAt,
          dateModified: post.updatedContentAt || post.updatedAt,
          author: post.author,
        })}
      />
      <Breadcrumbs items={crumbs} />

      <article className="container-page py-8">
        <header className="mx-auto max-w-2xl">
          <p className="eyebrow">{[post.category, "Blog"].filter(Boolean).join(" · ")}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
            {post.author} · Publicado el {fmtDate(post.publishedAt)}
            {post.updatedContentAt && post.updatedContentAt !== post.publishedAt && (
              <> · Actualizado el {fmtDate(post.updatedContentAt)}</>
            )}
            {" · "}
            {readingMinutes(post)} min de lectura
          </p>
        </header>

        {post.featuredImageUrl && (
          <figure className="mx-auto mt-6 max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="w-full rounded-[var(--radius-card)] object-cover"
            />
            {post.featuredImageAlt && (
              <figcaption className="mt-2 text-center text-xs text-[var(--color-ink-soft)]">
                {post.featuredImageAlt}
              </figcaption>
            )}
          </figure>
        )}

        <div
          className="blog-prose mx-auto mt-8 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {post.tags.length > 0 && (
          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-[var(--color-paper)] px-3 py-1 text-xs text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {cta && (
          <section
            data-experience={ctaProperty?.experience}
            className="mx-auto mt-12 max-w-2xl rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--accent-50)] p-6"
          >
            <h2 className="font-display text-xl">{cta.heading}</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{cta.body}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {ctaProperty ? (
                <>
                  <Link
                    href={`/${ctaProperty.slug}`}
                    className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
                  >
                    Ver {ctaProperty.name}
                  </Link>
                  <Link
                    href={bookingSectionHref(ctaProperty.slug)}
                    className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium ring-1 ring-[var(--color-line)] hover:ring-[var(--accent-500)]"
                  >
                    Ver fechas y precio
                  </Link>
                </>
              ) : (
                <Link
                  href="/#buscador"
                  className="inline-flex h-11 items-center rounded-full bg-[var(--accent-600)] px-5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
                >
                  Ver disponibilidad
                </Link>
              )}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mx-auto mt-12 max-w-2xl">
            <h2 className="font-display text-xl">Sigue leyendo</h2>
            <ul className="mt-4 space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="block rounded-xl border border-[var(--color-line)] p-4 text-sm hover:border-[var(--accent-500)]"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mx-auto mt-10 max-w-2xl text-sm">
          <Link href="/blog" className="text-[var(--accent-700)] hover:underline">
            ← Volver al blog
          </Link>
        </p>
      </article>
    </div>
  );
}
