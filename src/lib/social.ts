/** Public profile URL for an Instagram handle (with or without a leading @). */
export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}
