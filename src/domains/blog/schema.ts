import { z } from "zod";

const nullableTrimmed = z
  .string()
  .trim()
  .max(400)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

/** The persisted document shape (validated on read; malformed docs are ignored). */
export const blogPostSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug no válido"),
  status: z.enum(["draft", "published"]),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).default(""),
  bodyMarkdown: z.string().default(""),
  featuredImageUrl: nullableTrimmed,
  featuredImageAlt: z.string().max(300).default(""),
  category: z.string().max(80).default(""),
  tags: z.array(z.string().max(40)).max(20).default([]),
  destination: z.enum(["javalambre", "valencia", "ambos", "general"]),
  relatedPropertySlug: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "javalambre" || v === "valencia" ? v : null)),
  author: z.string().max(120).default("Praetoria Vacacional"),
  seoTitle: nullableTrimmed,
  metaDescription: nullableTrimmed,
  canonicalUrl: nullableTrimmed,
  ogTitle: nullableTrimmed,
  ogDescription: nullableTrimmed,
  ogImageUrl: nullableTrimmed,
  publishedAt: z.string().optional().nullable().default(null),
  updatedContentAt: z.string().optional().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Raw admin-form fields (strings from FormData). */
export const blogPostFormSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().max(80).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  title: z.string().trim().min(3, "El título es obligatorio").max(200),
  excerpt: z.string().trim().max(500).optional().default(""),
  bodyMarkdown: z.string().trim().min(1, "El contenido no puede estar vacío"),
  featuredImageUrl: z.string().trim().max(400).optional().default(""),
  featuredImageAlt: z.string().trim().max(300).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  tags: z.string().trim().max(400).optional().default(""),
  destination: z.enum(["javalambre", "valencia", "ambos", "general"]).default("general"),
  relatedPropertySlug: z.string().trim().optional().default(""),
  author: z.string().trim().max(120).optional().default("Praetoria Vacacional"),
  seoTitle: z.string().trim().max(200).optional().default(""),
  metaDescription: z.string().trim().max(400).optional().default(""),
  canonicalUrl: z.string().trim().max(400).optional().default(""),
  ogTitle: z.string().trim().max(200).optional().default(""),
  ogDescription: z.string().trim().max(400).optional().default(""),
  ogImageUrl: z.string().trim().max(400).optional().default(""),
  publishedAt: z.string().trim().max(40).optional().default(""),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;
