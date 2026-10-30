import { isValidElement, type ComponentProps, type ReactNode } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { BlogImage } from "./BlogImage";
import { CodeBlock } from "./CodeBlock";
import { ToolBanner } from "./ToolCTA";
import { slugifyHeading } from "@/lib/blog/headings";

/**
 * Renders raw MDX (frontmatter already stripped) as a React server component.
 *
 * Compilation — including rehype-highlight tokenization — happens entirely at
 * build time: the static HTML ships pre-highlighted with zero client-side
 * markdown runtime. The only client islands are CodeBlock's copy button and
 * the ToC scroll spy.
 *
 * Component overrides:
 * - h2/h3 — slugified ids + scroll-mt for the sticky ToC (ids MUST match
 *   lib/blog/headings.ts).
 * - pre — CodeBlock chrome (language badge + copy button).
 * - img — BlogImage (WebP/AVIF enforcement, lazy/priority, figcaption). The
 *   first image in the document is auto-detected from the source string and
 *   rendered with `priority` (featured top-of-page images get eager LCP
 *   treatment without authors wiring props by hand).
 * - table — horizontal-scroll wrapper for GFM tables.
 * - ToolBanner — <ToolBanner tool="slug" /> in-content CTAs.
 *
 * - remark-gfm: tables, task lists, strikethrough.
 * - rehype-highlight: build-time highlight.js classes (styled in globals.css).
 */

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function AnchorHeading({ as: Tag, children, ...props }: ComponentProps<"h2"> & { as: "h2" | "h3" }) {
  const id = slugifyHeading(textOf(children));
  return (
    <Tag id={id} {...props} className="scroll-mt-24">
      {children}
    </Tag>
  );
}

/** First markdown image in the document — rendered with loading priority. */
const FIRST_IMAGE_PATTERN = /!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/;

function buildMdxComponents(priorityImageSrc: string | null) {
  return {
    pre: CodeBlock,
    h2: (props: ComponentProps<"h2">) => <AnchorHeading as="h2" {...props} />,
    h3: (props: ComponentProps<"h3">) => <AnchorHeading as="h3" {...props} />,
    img: ({ src, alt, title }: ComponentProps<"img">) =>
      typeof src === "string" ? (
        <BlogImage src={src} alt={alt ?? ""} title={title} priority={src === priorityImageSrc} />
      ) : null,
    table: ({ className, ...props }: ComponentProps<"table">) => (
      <div className="overflow-x-auto">
        <table {...props} className={className} />
      </div>
    ),
    ToolBanner,
  };
}

export async function MDXContent({ source }: { source: string }) {
  const priorityImageSrc = FIRST_IMAGE_PATTERN.exec(source)?.[1] ?? null;
  const { content } = await compileMDX({
    source,
    components: buildMdxComponents(priorityImageSrc),
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypeHighlight, { detect: false, ignoreMissing: true }]],
      },
    },
  });
  return content;
}
