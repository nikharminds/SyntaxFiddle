import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Rss, ShieldCheck, Zap } from "lucide-react";
import { BlogIndex, type BlogCardPost } from "@/components/blog/blog-index";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, toUtcTimestamp } from "@/lib/blog/posts";
import { TOOLS } from "@/lib/tools";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Deep dives, cheat sheets, and engineering notes on cron, cURL, data conversion, and typed schemas — from the team behind SyntaxFiddle's free client-side tools.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog/" },
  openGraph: {
    title: "Blog · SyntaxFiddle",
    description: DESCRIPTION,
    url: `${SITE_URL}/blog/`,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [{ url: `${SITE_URL}/og/site.jpg`, width: 1200, height: 630, alt: "SyntaxFiddle Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · SyntaxFiddle",
    description: DESCRIPTION,
    images: [`${SITE_URL}/og/site.jpg`],
  },
};

/** Value proposition: why read (and use) SyntaxFiddle. */
const TRUST_FACTS = [
  { icon: ShieldCheck, label: "100% client-side" },
  { icon: Lock, label: "Zero uploads, zero logging" },
  { icon: Zap, label: "Free, instant, no sign-up" },
];

export default function BlogIndexPage() {
  // Serialize to a light view model — MDX bodies never cross the client edge.
  const posts: BlogCardPost[] = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    readingMinutes: post.readingMinutes,
    authorName: post.author.name,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "SyntaxFiddle Blog",
    description: DESCRIPTION,
    url: `${SITE_URL}/blog/`,
    blogPost: getAllPosts().map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}/`,
      datePublished: toUtcTimestamp(post.publishedAt),
      dateModified: toUtcTimestamp(post.updatedAt),
      author: { "@type": "Person", name: post.author.name },
    })),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          The SyntaxFiddle Blog
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-400">
          Engineering notes and deep dives on cron, cURL, data conversion, and typed
          schemas — written by the team behind tools that run entirely in your
          browser. Everything we build is privacy-first: your data never leaves
          the browser, and nothing is ever logged.
        </p>
        <ul className="mt-5 flex list-none flex-wrap items-center gap-2">
          {TRUST_FACTS.map((fact) => (
            <li key={fact.label}>
              <Badge variant="outline" className="gap-1.5">
                <fact.icon size={12} aria-hidden="true" className="text-emerald-400" />
                {fact.label}
              </Badge>
            </li>
          ))}
          <li>
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-transparent px-2.5 py-0.5 text-xs font-medium leading-4 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Rss size={12} aria-hidden="true" />
              RSS feed
            </a>
          </li>
        </ul>
      </header>

      <div className="mt-10">
        <BlogIndex posts={posts} />
      </div>

      {/* Internal link equity: surface the tool hubs that articles reference,
          passing crawl paths from /blog/ to the core tool routes. */}
      <section aria-labelledby="explore-tools-heading" className="mt-14">
        <h2 id="explore-tools-heading" className="text-lg font-bold tracking-tight text-zinc-100">
          Explore the tools
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Every article is written against these free, client-side utilities — nothing you
          paste ever leaves your browser.
        </p>
        <ul className="mt-5 grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={tool.href ?? `/${tool.slug}/`}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <span className="font-medium">{tool.name}</span>
                <ArrowRight size={14} className="shrink-0 text-zinc-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
