import { describe, expect, it } from "vitest";
import { blogFrontmatterSchema } from "../lib/blog/schema";
import { getAllPosts, getPostBySlug, getPostSlugs } from "../lib/blog/posts";
import { TOOLS } from "../lib/tools";

const validFrontmatter = {
  title: "A perfectly valid blog post title",
  description:
    "A description that is comfortably longer than fifty characters so the schema accepts it.",
  publishedAt: "2026-01-10",
  updatedAt: "2026-01-15",
  category: "DevOps",
  tags: ["cron", "scheduling"],
  author: { name: "Test Author" },
  relatedToolSlug: "cron",
};

describe("blog frontmatter schema", () => {
  it("accepts a complete frontmatter object", () => {
    const result = blogFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
  });

  it("accepts an optional faq array and trims values", () => {
    const result = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      title: "  A perfectly valid blog post title  ",
      faq: [{ question: "Is this a valid question?", answer: "Yes, it is long enough to pass." }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("A perfectly valid blog post title");
      expect(result.data.faq).toHaveLength(1);
    }
  });

  it("rejects titles over the 60-character SEO budget", () => {
    const result = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      title: "A title that just keeps going and going until it passes sixty characters for sure",
    });
    expect(result.success).toBe(false);
  });

  it("rejects descriptions shorter than 50 characters", () => {
    const result = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      description: "Too short.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-ISO or impossible dates", () => {
    expect(
      blogFrontmatterSchema.safeParse({ ...validFrontmatter, publishedAt: "10-01-2026" })
        .success,
    ).toBe(false);
    expect(
      blogFrontmatterSchema.safeParse({ ...validFrontmatter, updatedAt: "2026-02-30" }).success,
    ).toBe(false);
  });

  it("rejects updatedAt earlier than publishedAt", () => {
    const result = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      publishedAt: "2026-01-10",
      updatedAt: "2026-01-09",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty tag lists and unknown related tools", () => {
    expect(
      blogFrontmatterSchema.safeParse({ ...validFrontmatter, tags: [] }).success,
    ).toBe(false);
    expect(
      blogFrontmatterSchema.safeParse({ ...validFrontmatter, relatedToolSlug: "not-a-tool" })
        .success,
    ).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { relatedToolSlug: _omitted, ...withoutTool } = validFrontmatter;
    expect(blogFrontmatterSchema.safeParse(withoutTool).success).toBe(false);
  });

  it("accepts an optional featured image with SEO-grade alt text", () => {
    const result = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      image: {
        url: "/blog/cron-expressions-explained/fields.webp",
        alt: "Annotated five-field cron expression diagram",
        caption: "Field order for standard cron expressions",
        width: 1600,
        height: 900,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects featured images with alt text under 10 characters", () => {
    const result = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      image: { url: "/blog/x/a.webp", alt: "too short" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer or non-positive image dimensions", () => {
    const fractional = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      image: { url: "/blog/x/a.webp", alt: "A valid alt text", width: 12.5, height: 900 },
    });
    expect(fractional.success).toBe(false);

    const zero = blogFrontmatterSchema.safeParse({
      ...validFrontmatter,
      image: { url: "/blog/x/a.webp", alt: "A valid alt text", width: 0, height: 900 },
    });
    expect(zero.success).toBe(false);
  });
});

describe("content/blog registry", () => {
  it("ships published posts that all pass validation", () => {
    // getAllPosts() throws on any invalid frontmatter, so loading is the
    // assertion. Unpublished posts wait in content/blog/drafts/.
    expect(getAllPosts().length).toBeGreaterThanOrEqual(1);
  });

  it("derives kebab-case slugs from file names", () => {
    for (const slug of getPostSlugs()) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("keeps every title within the SEO budget and description in range", () => {
    for (const post of getAllPosts()) {
      expect(post.title.length).toBeLessThanOrEqual(60);
      expect(post.description.length).toBeGreaterThanOrEqual(50);
      expect(post.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("links every relatedToolSlug to a registered tool", () => {
    const toolSlugs = new Set(TOOLS.map((tool) => tool.slug));
    for (const post of getAllPosts()) {
      expect(toolSlugs.has(post.relatedToolSlug)).toBe(true);
    }
  });

  it("sorts posts newest first with unique slugs", () => {
    const posts = getAllPosts();
    const slugs = new Set(posts.map((post) => post.slug));
    expect(slugs.size).toBe(posts.length);
    for (let index = 1; index < posts.length; index += 1) {
      const previous = posts[index - 1];
      const current = posts[index];
      if (previous && current) {
        expect(previous.publishedAt >= current.publishedAt).toBe(true);
      }
    }
  });

  it("returns null for unknown or unsafe slugs", () => {
    expect(getPostBySlug("does-not-exist")).toBeNull();
    expect(getPostBySlug("../etc/passwd")).toBeNull();
  });
});
