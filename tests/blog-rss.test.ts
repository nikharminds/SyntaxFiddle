import { describe, expect, it } from "vitest";
import { buildRssXml, escapeXml, RSS_URL } from "../lib/blog/rss";
import { getAllPosts } from "../lib/blog/posts";
import { SITE_URL } from "../lib/site";

describe("escapeXml", () => {
  it("escapes the five XML specials", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });

  it("leaves plain text (including em dashes) untouched", () => {
    expect(escapeXml("cron — explained")).toBe("cron — explained");
  });
});

describe("buildRssXml", () => {
  it("emits a valid RSS 2.0 document with an atom self-reference", () => {
    const xml = buildRssXml();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain(`<atom:link href="${RSS_URL}" rel="self" type="application/rss+xml"/>`);
  });

  it("includes every post as an item with permanent guid and GMT pubDate", () => {
    const xml = buildRssXml();
    const posts = getAllPosts();

    expect(xml.match(/<item>/g)?.length).toBe(posts.length);
    for (const post of posts) {
      expect(xml).toContain(`<link>${SITE_URL}/blog/${post.slug}/</link>`);
      expect(xml).toContain(
        `<guid isPermaLink="true">${SITE_URL}/blog/${post.slug}/</guid>`,
      );
    }
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} .* GMT<\/pubDate>/);
  });

  it("lists the newest post first", () => {
    const xml = buildRssXml();
    const newest = getAllPosts()[0];
    if (!newest) return;
    const firstItem = xml.slice(xml.indexOf("<item>"), xml.indexOf("</item>"));
    expect(firstItem).toContain(escapeXml(newest.title));
    expect(firstItem).toContain("<dc:creator>");
  });
});
