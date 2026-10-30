import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, PenLine } from "lucide-react";
import { MDXContent } from "@/components/blog/mdx-content";
import { BlogImage } from "@/components/blog/BlogImage";
import { BlogPostStructuredData } from "@/components/blog/structured-data";
import { ToolBanner, ToolCtaSidebar } from "@/components/blog/ToolCTA";
import { TableOfContents } from "@/components/blog/toc";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { extractHeadings } from "@/lib/blog/headings";
import { formatDate, getAllPosts, getPostBySlug, getPostSlugs, type BlogPost } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}/`;
  // Build-time generated 1200×630 card (app/blog/[slug]/opengraph-image.tsx).
  const ogImage = `${SITE_URL}/blog/${post.slug}/opengraph-image`;

  return {
    // absolute (not the layout template) — the schema caps titles at 60 chars
    // so the tag stays inside the SERP truncation budget without a suffix.
    title: { absolute: post.title },
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}/` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      siteName: "SyntaxFiddle",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: post.title, type: "image/png" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

/** Same category scores higher than shared tags; ties break newest-first. */
function getRelatedPosts(current: BlogPost, limit: number): BlogPost[] {
  return getAllPosts()
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? 2 : 0) +
        post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.post.publishedAt < b.post.publishedAt
          ? 1
          : a.post.publishedAt > b.post.publishedAt
            ? -1
            : 0),
    )
    .slice(0, limit)
    .map(({ post }) => post);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.body);
  const relatedPosts = getRelatedPosts(post, 3);
  const isUpdated = post.updatedAt !== post.publishedAt;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <BlogPostStructuredData post={post} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog/" },
          { label: post.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_264px] xl:gap-14">
        {/* Article column */}
        <div className="min-w-0 max-w-3xl">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{post.category}</Badge>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-base leading-7 text-zinc-400">{post.description}</p>

            {/* Optional featured image — frontmatter `image` (WebP/AVIF). */}
            {post.image ? (
              <div className="mt-6">
                <BlogImage
                  src={post.image.url}
                  alt={post.image.alt}
                  caption={post.image.caption}
                  width={post.image.width}
                  height={post.image.height}
                  priority
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <PenLine size={12} aria-hidden="true" />
                {post.author.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={12} aria-hidden="true" />
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </span>
              {isUpdated ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                  </span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} aria-hidden="true" />
                {post.readingMinutes} min read
              </span>
            </div>
          </header>

          {/* Collapsible ToC for narrow screens (sticky sidebar takes over on lg+) */}
          {headings.length > 0 ? (
            <details className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-200">
                On this page
              </summary>
              <TableOfContents headings={headings} className="mt-3" />
            </details>
          ) : null}

          <article className="prose prose-zinc mt-8 max-w-none prose-headings:tracking-tight prose-a:break-words">
            <MDXContent source={post.body} />
          </article>

          {/* Frontmatter-driven in-content CTA — authors can also embed
              <ToolBanner tool="…" /> mid-article from any MDX body. */}
          <ToolBanner tool={post.relatedToolSlug} />

          {post.faq && post.faq.length > 0 ? (
            <section aria-labelledby="faq-heading" className="mt-14">
              <h2 id="faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
                Frequently Asked Questions
              </h2>
              <div className="mt-5 space-y-3">
                {post.faq.map((entry) => (
                  <details
                    key={entry.question}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-zinc-100">
                      {entry.question}
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{entry.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section aria-labelledby="related-posts-heading" className="mt-14">
              <h2
                id="related-posts-heading"
                className="text-xl font-bold tracking-tight text-zinc-100"
              >
                Related articles
              </h2>
              <ul className="mt-5 grid list-none gap-2 sm:grid-cols-2">
                {relatedPosts.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/blog/${related.slug}/`}
                      className="flex h-full flex-col gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-3 transition-colors hover:border-emerald-500/40"
                    >
                      <span className="text-sm font-medium text-zinc-200">{related.title}</span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(related.publishedAt)} · {related.readingMinutes} min read
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="mt-14 text-sm text-zinc-500">
            <Link href="/blog/" className="transition-colors hover:text-emerald-300">
              ← All articles
            </Link>
          </p>
        </div>

        {/* Sticky sidebar: scroll-spy ToC + contextual tool CTA (lg and up) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <TableOfContents headings={headings} />
            <ToolCtaSidebar slug={post.relatedToolSlug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
