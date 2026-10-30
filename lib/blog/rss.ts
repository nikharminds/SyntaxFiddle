import { getAllPosts } from "./posts";
import { SITE_URL } from "../site";

/**
 * RSS 2.0 feed generator for the blog.
 *
 * Pure and deterministic — the build output only changes when content or
 * frontmatter changes (lastBuildDate derives from the newest post, never
 * from Date.now()). Imported by app/rss.xml/route.ts at build time; there
 * is no runtime request handling (static export).
 */

export const RSS_URL = `${SITE_URL}/rss.xml`;
export const BLOG_URL = `${SITE_URL}/blog/`;

const CHANNEL_TITLE = "SyntaxFiddle Blog";
const CHANNEL_DESCRIPTION =
  "Deep dives, cheat sheets, and engineering notes on cron, cURL, data conversion, and typed schemas — from the team behind SyntaxFiddle's free, 100% client-side developer tools.";
const MAX_ITEMS = 20;

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);
}

/** RFC 822 timestamp (RSS pubDate / lastBuildDate format). */
function toRfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export function buildRssXml(): string {
  const posts = getAllPosts().slice(0, MAX_ITEMS);

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/blog/${post.slug}/`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${toRfc822(post.publishedAt)}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <category>${escapeXml(post.category)}</category>`,
        `      <dc:creator>${escapeXml(post.author.name)}</dc:creator>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  // Deterministic build stamp: the most recent updatedAt across all posts
  // (the feed's true "last content change" — an edited older post counts),
  // never Date.now().
  const lastContentChange = posts.reduce(
    (latest, post) => (post.updatedAt > latest ? post.updatedAt : latest),
    posts[0]?.updatedAt ?? "",
  );
  const lastBuildDate = lastContentChange
    ? `\n    <lastBuildDate>${toRfc822(lastContentChange)}</lastBuildDate>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${BLOG_URL}</link>
    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
    <language>en-us</language>${lastBuildDate}
    <atom:link href="${RSS_URL}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
