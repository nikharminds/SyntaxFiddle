"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocHeading } from "@/lib/blog/headings";

/**
 * Sticky-sidebar table of contents with scroll-spy.
 *
 * Heading ids are generated at build time (lib/blog/headings.ts) and attached
 * by the MDX h2/h3 overrides, so this component only tracks scroll position:
 * the active entry is the last heading whose top edge crossed the sticky
 * navbar line (rAF-throttled passive listener — no layout thrash, no
 * IntersectionObserver edge cases with tall sections).
 */

const SCROLL_OFFSET_PX = 96; // sticky navbar (64px) + breathing room

export function TableOfContents({
  headings,
  title = "On this page",
  className,
}: {
  headings: TocHeading[];
  title?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      let current: string | null = headings[0]?.id ?? null;
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= SCROLL_OFFSET_PX) {
          current = heading.id;
        } else {
          break;
        }
      }
      // Fully scrolled to the footer → highlight the final section.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (atBottom) {
        current = headings[headings.length - 1]?.id ?? current;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <ul className="mt-3 list-none space-y-0.5">
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block border-l-2 py-1 pr-2 text-[13px] leading-5 transition-colors",
                  heading.depth === 3 ? "pl-6" : "pl-3.5",
                  isActive
                    ? "border-emerald-400 font-medium text-emerald-300"
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
