import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { assertSupportedBlogImageSource, parseImageMeta } from "../lib/blog/images";
import { getAllPosts } from "../lib/blog/posts";

describe("assertSupportedBlogImageSource", () => {
  it("accepts webp/avif local sources and remote https sources", () => {
    expect(() => assertSupportedBlogImageSource("/blog/a/shot.webp")).not.toThrow();
    expect(() => assertSupportedBlogImageSource("/blog/a/shot.AVIF")).not.toThrow();
    expect(() => assertSupportedBlogImageSource("https://cdn.example.com/a.png")).not.toThrow();
  });

  it("rejects non-webp/avif local sources (static export cannot transcode)", () => {
    for (const src of ["/blog/a/shot.png", "/blog/a/shot.jpg", "/blog/a/shot.gif", "/blog/a/shot.svg"]) {
      expect(() => assertSupportedBlogImageSource(src)).toThrow(/WebP or AVIF/);
    }
  });
});

describe("parseImageMeta", () => {
  it("splits caption and dimensions from markdown titles", () => {
    expect(parseImageMeta("Cron fields · 1600x900")).toEqual({
      caption: "Cron fields",
      width: 1600,
      height: 900,
    });
  });

  it("accepts the multiplication sign and dims-only titles", () => {
    expect(parseImageMeta("1600×900")).toEqual({ width: 1600, height: 900 });
  });

  it("passes through plain captions and empty titles", () => {
    expect(parseImageMeta("Just a caption")).toEqual({ caption: "Just a caption" });
    expect(parseImageMeta(undefined)).toEqual({});
  });
});

describe("featured images", () => {
  it("every post ships a featured image that exists on disk as webp/avif", () => {
    for (const post of getAllPosts()) {
      const image = post.image;
      expect(image, `${post.slug} must declare a frontmatter featured image`).toBeTruthy();
      if (!image) continue;

      expect(image.alt.length, `${post.slug}: featured alt must be >= 10 chars`).toBeGreaterThanOrEqual(10);
      expect(() => assertSupportedBlogImageSource(image.url), `${post.slug}: ${image.url}`).not.toThrow();

      const file = path.join(process.cwd(), "public", image.url);
      expect(fs.existsSync(file), `${post.slug}: missing public asset ${image.url}`).toBe(true);
    }
  });
});

describe("inline MDX images", () => {
  const IMAGE_PATTERN = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

  it("all shipped posts use SEO-grade alt text and supported formats", () => {
    for (const post of getAllPosts()) {
      for (const match of post.body.matchAll(IMAGE_PATTERN)) {
        const alt = match[1] ?? "";
        const src = match[2] ?? "";
        expect(
          alt.length,
          `${post.slug}: image alt "${alt}" must be >= 10 chars for SEO`,
        ).toBeGreaterThanOrEqual(10);
        expect(() => assertSupportedBlogImageSource(src), `${post.slug}: ${src}`).not.toThrow();
      }
    }
  });
});
