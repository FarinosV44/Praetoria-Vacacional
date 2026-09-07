"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { assertCapability } from "@/domains/admin/roles";
import { logAction } from "@/domains/admin/audit";
import { reportError } from "@/lib/observability/report";
import { getPropertyBySlug } from "@/domains/properties/registry";
import { blogPostFormSchema } from "./schema";
import { slugify } from "./helpers";
import { deletePost, getPostById, savePost, slugTaken } from "./store";
import type { BlogPost } from "./types";

type ActionResult = { ok: true; slug: string } | { ok: false; error: string };

async function assertAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("No autorizado");
}

/**
 * Turn an auth/capability throw into a message the editor can show, so a
 * permission or session problem reads as a form error instead of the generic
 * "ha ocurrido un problema" boundary.
 */
function authMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("MFA_REQUERIDO")) {
    return "Necesitas completar la verificación en dos pasos para publicar.";
  }
  if (msg.startsWith("SIN_PERMISO")) {
    return "Tu usuario no tiene permiso para publicar en el blog (falta la capacidad «content.write»).";
  }
  if (msg === "No autorizado") {
    return "Tu sesión ha caducado. Vuelve a iniciar sesión en /admin y repite la publicación.";
  }
  return "No se pudo verificar tu sesión. Vuelve a iniciar sesión e inténtalo de nuevo.";
}

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function saveBlogPostAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertAdmin();
    await assertCapability("content.write");
  } catch (err) {
    return { ok: false, error: authMessage(err) };
  }

  const parsed = blogPostFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const d = parsed.data;

  let existing: BlogPost | null;
  let slug: string;
  try {
    existing = d.id ? await getPostById(d.id) : null;
    if (d.id && !existing) return { ok: false, error: "El artículo ya no existe" };

    slug = slugify(d.slug || d.title);
    if (!slug) return { ok: false, error: "No se pudo generar un slug a partir del título" };
    if (await slugTaken(slug, existing?.id)) {
      return { ok: false, error: `Ya existe un artículo con el slug «${slug}»` };
    }
  } catch (err) {
    reportError(err, { scope: "blog/save/preflight" });
    return {
      ok: false,
      error:
        "No se pudo comprobar el artículo contra la base de datos. Inténtalo de nuevo en unos segundos.",
    };
  }

  // A published post with no explicit date publishes now. Validate the date
  // string *before* calling toISOString(), which throws on an invalid Date.
  if (d.publishedAt && Number.isNaN(new Date(d.publishedAt).getTime())) {
    return { ok: false, error: "La fecha de publicación no es válida" };
  }
  let publishedAt = d.publishedAt
    ? new Date(d.publishedAt).toISOString()
    : existing?.publishedAt ?? null;
  if (d.status === "published" && !publishedAt) publishedAt = new Date().toISOString();

  const related =
    d.relatedPropertySlug && getPropertyBySlug(d.relatedPropertySlug)
      ? d.relatedPropertySlug
      : null;

  const now = new Date().toISOString();
  const clean = (s: string) => (s.trim() ? s.trim() : null);

  const post: BlogPost = {
    id: existing?.id ?? crypto.randomUUID(),
    slug,
    status: d.status,
    title: d.title,
    excerpt: d.excerpt ?? "",
    bodyMarkdown: d.bodyMarkdown,
    featuredImageUrl: clean(d.featuredImageUrl ?? ""),
    featuredImageAlt: d.featuredImageAlt ?? "",
    category: d.category ?? "",
    tags: (d.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    destination: d.destination,
    relatedPropertySlug: related,
    author: (d.author ?? "").trim() || "Praetoria Vacacional",
    seoTitle: clean(d.seoTitle ?? ""),
    metaDescription: clean(d.metaDescription ?? ""),
    canonicalUrl: clean(d.canonicalUrl ?? ""),
    ogTitle: clean(d.ogTitle ?? ""),
    ogDescription: clean(d.ogDescription ?? ""),
    ogImageUrl: clean(d.ogImageUrl ?? ""),
    publishedAt,
    updatedContentAt:
      existing && existing.bodyMarkdown === d.bodyMarkdown ? existing.updatedContentAt : now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  try {
    await savePost(post);
  } catch (err) {
    reportError(err, { scope: "blog/save/persist" });
    return {
      ok: false,
      error:
        "No se pudo guardar el artículo en la base de datos. Inténtalo de nuevo en unos segundos.",
    };
  }

  await logAction(existing ? "blog.update" : "blog.create", {
    entity: "blog_post",
    entityId: post.id,
    meta: { slug: post.slug, status: post.status },
  });

  // The post is already persisted — a cache-revalidation hiccup must not fail
  // the save.
  try {
    if (existing && existing.slug !== post.slug) revalidateBlog(existing.slug);
    revalidateBlog(post.slug);
  } catch (err) {
    reportError(err, { scope: "blog/save/revalidate" });
  }

  // A brand-new post redirects to its own editor so a second save edits it
  // instead of creating a duplicate.
  if (!existing) redirect(`/admin/blog/${post.id}`);
  return { ok: true, slug: post.slug };
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await assertCapability("content.write");
  const id = String(formData.get("id") ?? "");
  if (id) {
    const post = await getPostById(id);
    await deletePost(id);
    await logAction("blog.delete", {
      entity: "blog_post",
      entityId: id,
      meta: { slug: post?.slug },
    });
    revalidateBlog(post?.slug);
  }
  redirect("/admin/blog");
}
