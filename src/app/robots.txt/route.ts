import { robotsTxt } from "@/domains/marketing/agent-content";

// A route handler rather than `robots.ts`: Next's robots metadata has no field
// for the Content-Signal directive.
export const dynamic = "force-static";

export function GET() {
  return new Response(robotsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
