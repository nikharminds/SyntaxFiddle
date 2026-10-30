import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import { blogFrontmatterSchema, type BlogFrontmatter } from "./schema";

/**
 * File-based blog registry. Reads content/blog/*.mdx at build time only —
 * every consumer (generateStaticParams, generateMetadata, pages, sitemap)
 * runs during static generation, so nothing here ever ships to the client.
 */

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WORDS_PER_MINUTE = 200;

export type BlogPost = BlogFrontmatter & {
  /** Kebab-case slug derived from the file name (e.g. cron-explained.mdx → cron-explained). */
  slug: string;
  /** MDX source with the frontmatter block stripped. */
  body: string;
  wordCount: number;
  readingMinutes: number;
};

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `frontmatter.${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n  - ");
}

function readPost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx$/, "");
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Invalid blog file name "${fileName}": expected kebab-case with a .mdx extension`,
    );
  }

  const raw = fs.readFileSync(path.join(BLOG_CONTENT_DIR, fileName), "utf8");
  const parsed = matter(raw);
  const result = blogFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(
      `Invalid frontmatter in content/blog/${fileName}:\n  - ${formatIssues(result.error)}`,
    );
  }

  const body = parsed.content;
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return {
    ...result.data,
    slug,
    body,
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
  };
}

let postCache: BlogPost[] | null = null;

/** All posts, newest first (ties broken alphabetically for deterministic output). */
export function getAllPosts(): BlogPost[] {
  if (!postCache) {
    const files = fs
      .readdirSync(BLOG_CONTENT_DIR)
      .filter((file) => file.endsWith(".mdx"))
      .sort();
    postCache = files
      .map(readPost)
      .sort((a, b) =>
        a.publishedAt === b.publishedAt
          ? b.slug.localeCompare(a.slug)
          : a.publishedAt < b.publishedAt
            ? 1
            : -1,
      );
  }
  return postCache;
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getPostBySlug(slug: string): BlogPost | null {
  // Reject anything that is not a plain kebab-case slug before it gets near
  // the file system (also guards against path traversal at request time).
  if (!SLUG_PATTERN.test(slug)) return null;
  return getAllPosts().find((post) => post.slug === slug) ?? null;
}

// Date helpers live in ./format (fs-free) so client components can import
// them without bundling node:fs. Re-exported here for existing call sites.
export { formatDate, toUtcTimestamp } from "./format";
