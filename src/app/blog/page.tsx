import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { listPublicPosts } from "@/domains/blog/store";
import { autoExcerpt } from "@/domains/blog/helpers";
import { BLOG_DESTINATIONS } from "@/domains/blog/types";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Blog · Actualidad y guías de Valencia, playa y nieve | Praetoria Vacacional",
  description:
    "Actualidad, planes y consejos de nuestros dos destinos: la playa de la Llastra al sur de Valencia y Javalambre en Camarena de la Sierra. Gastronomía, esquí, familia y escapadas.",
  path: "/blog",
});

const DEST_LABEL = Object.fromEntries(BLOG_DESTINATIONS.map((d) => [d.value, d.label]));
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "";

export default async function BlogIndexPage() {
  const posts = await listPublicPosts();
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} />

      <header className="container-page pt-4">
        <p className="eyebrow">Actualidad y guías</p>
        <h1 className="mt-2 display-2">Blog de Praetoria Vacacional</h1>
        <p className="lede mt-3 max-w-2xl">
          Planes, gastronomía, nieve y playa alrededor de nuestros dos alojamientos: la playa de la
          Llastra al sur de Valencia y Javalambre, en Camarena de la Sierra.
        </p>
      </header>

      <div className="container-page py-10">
        {posts.length === 0 ? (
          <p className="pv-card !p-6 text-[var(--color-ink-soft)]">
            Aún no hay artículos publicados. Vuelve pronto.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="pv-card pv-card--interactive group flex h-full flex-col overflow-hidden !p-0"
                >
                  {post.featuredImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.featuredImageUrl}
                      alt={post.featuredImageAlt || post.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {[post.category, DEST_LABEL[post.destination]].filter(Boolean).join(" · ")}
                    </p>
                    <h2 className="mt-1 font-display text-lg group-hover:text-[var(--accent-700)]">
                      {post.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm text-[var(--color-ink-soft)]">
                      {autoExcerpt(post, 140)}
                    </p>
                    <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
                      {fmtDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-sm text-[var(--color-ink-soft)]">
          ¿Buscas guías completas de cada destino?{" "}
          <Link href="/guias" className="text-[var(--accent-700)] hover:underline">
            Consulta las guías de Javalambre y de la playa de Valencia
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
