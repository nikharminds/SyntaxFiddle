import Image from "next/image";
import { assertSupportedBlogImageSource, parseImageMeta } from "@/lib/blog/images";

/**
 * Custom MDX image component (overrides `![alt](src)` in markdown).
 *
 * - next/image wrapper with lazy loading by default; `priority` for the
 *   first in-document image (auto-detected in mdx-content.tsx) and featured
 *   frontmatter images.
 * - WebP/AVIF enforcement at build time: this site is a static export with
 *   globally unoptimized images (no transcoding server), so a non-WebP/AVIF
 *   local source throws during static generation and fails the build.
 * - Intrinsic dimensions come from the markdown title ("… · 1600x900") and
 *   default to 1200×630 — preventing CLS either way.
 * - `<figcaption>` (from `caption`, the markdown title, or fallback `alt`)
 *   gives crawlers explicit semantic context for Google Images.
 */

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

export type BlogImageProps = {
  src: string;
  alt: string;
  /** Markdown title: "Optional caption · 1600x900". */
  title?: string;
  /** Explicit caption (featured images from frontmatter). */
  caption?: string;
  priority?: boolean;
  /** Explicit intrinsic size (featured images) — overrides title-parsed dims. */
  width?: number;
  height?: number;
};

export function BlogImage({
  src,
  alt,
  title,
  caption,
  priority = false,
  width: explicitWidth,
  height: explicitHeight,
}: BlogImageProps) {
  assertSupportedBlogImageSource(src);

  const meta = parseImageMeta(title);
  const width = explicitWidth ?? meta.width ?? DEFAULT_WIDTH;
  const height = explicitHeight ?? meta.height ?? DEFAULT_HEIGHT;
  const figcaption = caption ?? meta.caption ?? alt;

  return (
    <figure className="not-prose my-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-xl border border-zinc-800 bg-zinc-900/40"
      />
      <figcaption className="mt-2 text-center text-xs leading-5 text-zinc-500">
        {figcaption}
      </figcaption>
    </figure>
  );
}
