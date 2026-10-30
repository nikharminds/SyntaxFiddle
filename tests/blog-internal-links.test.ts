import { describe, expect, it } from "vitest";
import { getAllPosts } from "../lib/blog/posts";
import { TOOLS } from "../lib/tools";

/**
 * Enforcement for the blog internal-linking guideline (see
 * content/blog/README.md): every article must pass link equity to the tool
 * ecosystem with direct, crawlable links — at minimum to its own related
 * tool. Layout affordances (ToolBanner, sidebar CTA, tools grid) supplement
 * but do not replace in-context anchor-text links in the article body.
 */

function routesForTool(slug: string): string[] {
  const tool = TOOLS.find((entry) => entry.slug === slug);
  if (!tool) return [];
  return [tool.href ?? `/${tool.slug}/`, ...(tool.conversions?.map((c) => c.href) ?? [])];
}

const ALL_TOOL_ROUTES = new Set(TOOLS.flatMap((tool) => routesForTool(tool.slug)));

describe("internal linking guideline", () => {
  it("every post links its related tool (markdown link or ToolBanner)", () => {
    for (const post of getAllPosts()) {
      const routes = routesForTool(post.relatedToolSlug);
      expect(
        routes.length,
        `relatedToolSlug "${post.relatedToolSlug}" resolves to no tool route`,
      ).toBeGreaterThan(0);

      const hasContextualLink = routes.some((href) => post.body.includes(href));
      const hasBanner = post.body.includes(`<ToolBanner tool="${post.relatedToolSlug}"`);
      expect(
        hasContextualLink || hasBanner,
        `${post.slug} must contain a contextual link to its related tool (one of: ${routes.join(", ")})`,
      ).toBe(true);
    }
  });

  it("every post passes link equity to at least one registered tool route", () => {
    for (const post of getAllPosts()) {
      const linked = [...ALL_TOOL_ROUTES].some((href) => post.body.includes(href));
      expect(linked, `${post.slug} contains no links into the tool ecosystem`).toBe(true);
    }
  });

  it("every embedded <ToolBanner> has a tool attribute resolving to a registered tool", () => {
    // A typo like <ToolBanner tool="json-zod" /> (or a missing tool prop)
    // renders nothing and fails silently in MDX — catch it here instead.
    for (const post of getAllPosts()) {
      const embedded = [...post.body.matchAll(/<ToolBanner\b[^>]*>/g)].map((m) => m[0]);
      for (const tag of embedded) {
        const slug = /tool="([^"]+)"/.exec(tag)?.[1];
        if (!slug) {
          throw new Error(`${post.slug}: ${tag} is missing tool="slug" and would render nothing`);
        }
        expect(
          routesForTool(slug).length,
          `${post.slug}: ${tag} references unregistered tool "${slug}"`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
