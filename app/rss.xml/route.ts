import { buildRssXml } from "@/lib/blog/rss";

/**
 * RSS feed for the blog — statically generated at build time from
 * content/blog/*.mdx. With output: "export" this route is emitted as a
 * plain /rss.xml asset: no server, no runtime cost. Discoverability is
 * handled by the <link rel="alternate" type="application/rss+xml"> tag
 * injected from the root layout metadata.
 */

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildRssXml(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
