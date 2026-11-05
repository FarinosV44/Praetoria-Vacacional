import { homeMarkdown } from "@/domains/marketing/agent-content";
import { absoluteUrl } from "@/lib/seo";

/**
 * The home as Markdown, also served at `/` when a request asks for it (see
 * middleware). `no-store` is essential: Hostinger's CDN caches `/`, and storing
 * this response under that URL could serve Markdown to visitors.
 */
export function GET() {
  return new Response(homeMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Accept",
      Link: `<${absoluteUrl("/")}>; rel="canonical"`,
    },
  });
}
