"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { formatShortDate } from "@/lib/blog/format";
import { cn } from "@/lib/utils";

/**
 * Client-side category filter + responsive post grid for the blog index.
 * Receives a pre-serialized view model (no MDX bodies) from the server page,
 * so the client bundle stays tiny and static export friendly.
 */

export type BlogCardPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  authorName: string;
};

export function BlogIndex({ posts }: { posts: BlogCardPost[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [posts]);

  const visiblePosts = activeCategory
    ? posts.filter((post) => post.category === activeCategory)
    : posts;

  return (
    <section aria-label="All articles">
      <div
        role="group"
        aria-label="Filter articles by category"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          aria-pressed={activeCategory === null}
          onClick={() => setActiveCategory(null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            activeCategory === null
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
          )}
        >
          All posts <span className="opacity-60">({posts.length})</span>
        </button>
        {categories.map((category) => {
          const isActive = activeCategory === category.name;
          return (
            <button
              key={category.name}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveCategory(isActive ? null : category.name)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
              )}
            >
              {category.name} <span className="opacity-60">({category.count})</span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-4 text-xs text-zinc-500">
        Showing {visiblePosts.length} of {posts.length} articles
      </p>

      {visiblePosts.length > 0 ? (
        <ul className="mt-6 grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePosts.map((post) => (
            <li key={post.slug} className="h-full">
              <article className="h-full">
                <Link
                  href={`/blog/${post.slug}/`}
                  className="group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
                      <CalendarDays size={11} aria-hidden="true" />
                      Updated {formatShortDate(post.updatedAt)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-base font-semibold leading-6 tracking-tight text-zinc-100 transition-colors group-hover:text-emerald-300">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">
                    {post.description}
                  </p>

                  <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} aria-hidden="true" />
                      {post.readingMinutes} min read
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{post.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Published {formatShortDate(post.publishedAt)}</span>
                  </p>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
          No articles in this category yet.
        </p>
      )}
    </section>
  );
}
