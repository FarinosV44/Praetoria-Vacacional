"use client";

import { useActionState } from "react";
import type { BlogPost } from "@/domains/blog/types";
import { BLOG_DESTINATIONS } from "@/domains/blog/types";

type Result = { ok: true; slug: string } | { ok: false; error: string } | null;

const inputClass =
  "h-9 w-full rounded-lg border border-[var(--color-line)] px-2 text-sm";
const areaClass =
  "w-full rounded-lg border border-[var(--color-line)] p-2 text-sm font-mono";

export function BlogPostForm({
  action,
  post,
}: {
  action: (
    prev: unknown,
    fd: FormData,
  ) => Promise<{ ok: true; slug: string } | { ok: false; error: string }>;
  post?: BlogPost;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    (prev, fd) => action(prev, fd),
    null,
  );

  const Field = ({
    label,
    name,
    defaultValue,
    placeholder,
    type = "text",
    hint,
  }: {
    label: string;
    name: string;
    defaultValue?: string | null;
    placeholder?: string;
    type?: string;
    hint?: string;
  }) => (
    <label className="block text-xs">
      <span className="mb-1 block text-[var(--color-ink-soft)]">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-[10px] text-[var(--color-ink-soft)]">{hint}</span>}
    </label>
  );

  return (
    <form action={formAction} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <section className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Título" name="title" defaultValue={post?.title} placeholder="Apertura de temporada en Javalambre" />
        </div>
        <Field
          label="Slug (URL)"
          name="slug"
          defaultValue={post?.slug}
          placeholder="apertura-temporada-javalambre"
          hint={post ? "Cámbialo con cuidado: la URL antigua dejará de existir." : "Se genera del título si lo dejas vacío."}
        />
        <label className="block text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">Estado</span>
          <select name="status" defaultValue={post?.status ?? "draft"} className={inputClass}>
            <option value="draft">Borrador (no visible)</option>
            <option value="published">Publicado</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">Destino relacionado</span>
          <select name="destination" defaultValue={post?.destination ?? "general"} className={inputClass}>
            {BLOG_DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">
            Alojamiento para el CTA (opcional)
          </span>
          <select
            name="relatedPropertySlug"
            defaultValue={post?.relatedPropertySlug ?? ""}
            className={inputClass}
          >
            <option value="">Según el destino</option>
            <option value="valencia">Valencia Frente al Mar</option>
            <option value="javalambre">Javalambre Mountain SuperSki</option>
          </select>
        </label>
        <Field
          label="Fecha de publicación (opcional)"
          name="publishedAt"
          type="datetime-local"
          defaultValue={post?.publishedAt ? post.publishedAt.slice(0, 16) : ""}
          hint="Si es futura, el artículo se publica solo en esa fecha."
        />
        <Field label="Categoría" name="category" defaultValue={post?.category} placeholder="Nieve · Gastronomía · Familia" />
        <Field
          label="Etiquetas (separadas por comas)"
          name="tags"
          defaultValue={post?.tags.join(", ")}
          placeholder="javalambre, esquí, familia"
        />
        <Field label="Autor / editor" name="author" defaultValue={post?.author ?? "Praetoria Vacacional"} />
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <label className="block text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">Extracto</span>
          <textarea
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            rows={2}
            className={areaClass.replace(" font-mono", "")}
            placeholder="Resumen breve que aparece en las tarjetas y en los resultados de búsqueda."
          />
        </label>
        <label className="mt-3 block text-xs">
          <span className="mb-1 block text-[var(--color-ink-soft)]">
            Contenido (Markdown: #, ##, listas con -, **negrita**, [texto](enlace))
          </span>
          <textarea
            name="bodyMarkdown"
            defaultValue={post?.bodyMarkdown ?? ""}
            rows={18}
            className={areaClass}
            placeholder={"## Un subtítulo\n\nUn párrafo con un [enlace a la ficha](/javalambre) y **texto destacado**.\n\n- Un punto\n- Otro punto"}
          />
        </label>
      </section>

      <section className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-ink-soft)]">
          Imagen destacada y SEO
        </div>
        <Field
          label="URL de la imagen destacada"
          name="featuredImageUrl"
          defaultValue={post?.featuredImageUrl}
          placeholder="https://… o /images/…"
        />
        <Field label="Texto alternativo (ALT) de la imagen" name="featuredImageAlt" defaultValue={post?.featuredImageAlt} />
        <Field label="SEO title (opcional)" name="seoTitle" defaultValue={post?.seoTitle} />
        <Field label="Meta description (opcional)" name="metaDescription" defaultValue={post?.metaDescription} />
        <Field label="Canonical (solo si procede)" name="canonicalUrl" defaultValue={post?.canonicalUrl} />
        <Field label="OG image (opcional)" name="ogImageUrl" defaultValue={post?.ogImageUrl} />
        <Field label="OG title (opcional)" name="ogTitle" defaultValue={post?.ogTitle} />
        <Field label="OG description (opcional)" name="ogDescription" defaultValue={post?.ogDescription} />
      </section>

      <div className="flex items-center gap-4">
        <button
          className="h-10 rounded-lg bg-[var(--accent-600)] px-5 text-sm font-medium text-white disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Guardando…" : post ? "Guardar cambios" : "Crear artículo"}
        </button>
        {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
        {state && state.ok && (
          <p className="text-sm text-green-700">
            Guardado.{" "}
            <a className="underline" href={`/blog/${state.slug}`} target="_blank" rel="noreferrer">
              Ver artículo
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
