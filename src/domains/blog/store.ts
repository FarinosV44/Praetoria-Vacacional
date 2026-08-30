import "server-only";
import { getRepository } from "@/lib/repository";
import { blogPostSchema } from "./schema";
import type { BlogPost } from "./types";
import { isPubliclyVisible, sortByPublished } from "./helpers";

/**
 * Blog posts are stored one document per key in the shared `content_overrides`
 * KV — `blog:post:<id>`. This reuses the light-CMS persistence (memory +
 * Supabase, DEMO-safe) with no new migration (issue #57, same approach as #50).
 */
const PREFIX = "blog:post:";
const keyFor = (id: string) => `${PREFIX}${id}`;

function parse(value: unknown): BlogPost | null {
  const res = blogPostSchema.safeParse(value);
  return res.success ? (res.data as BlogPost) : null;
}

/** Every post (any status), newest published first. */
export async function listAllPosts(): Promise<BlogPost[]> {
  const rows = await getRepository().listContentOverrides(PREFIX);
  const posts = rows.map((r) => parse(r.value)).filter((p): p is BlogPost => p !== null);
  return sortByPublished(posts);
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const row = await getRepository().getContentOverride(keyFor(id));
  return row ? parse(row.value) : null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const all = await listAllPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

/** True if another post already uses this slug. */
export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const all = await listAllPosts();
  return all.some((p) => p.slug === slug && p.id !== exceptId);
}

export async function savePost(post: BlogPost): Promise<void> {
  await getRepository().setContentOverride(keyFor(post.id), post);
}

export async function deletePost(id: string): Promise<void> {
  await getRepository().setContentOverride(keyFor(id), null);
}

/* ------------------------------ public reads ------------------------------ */

export async function listPublicPosts(now: Date = new Date()): Promise<BlogPost[]> {
  return (await listAllPosts()).filter((p) => isPubliclyVisible(p, now));
}

export async function getPublicPostBySlug(
  slug: string,
  now: Date = new Date(),
): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);
  return post && isPubliclyVisible(post, now) ? post : null;
}
