"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExpandableCodeCellProps = {
  text: string;
  /** Hide the expand control for short values that never truncate. */
  expandThreshold?: number;
  className?: string;
};

/**
 * Monospace cell for long single-line payloads (SOQL queries, debug
 * messages): truncated to one visual line with a native title tooltip, and
 * an aria-expanded toggle that reveals the full text in place — no layout
 * jump for sibling columns, no row-spanning hacks.
 */
export function ExpandableCodeCell({
  text,
  expandThreshold = 64,
  className,
}: ExpandableCodeCellProps) {
  const [expanded, setExpanded] = React.useState(false);
  const expandable = text.length > expandThreshold;

  return (
    <div className={cn("flex min-w-0 items-start gap-1", className)}>
      <code
        title={expandable && !expanded ? text : undefined}
        className={cn(
          "min-w-0 flex-1 break-all font-mono text-[13px] leading-5 text-zinc-200",
          !expanded && "line-clamp-1",
        )}
      >
        {text}
      </code>
      {expandable ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/60"
        >
          <ChevronDown
            size={13}
            aria-hidden
            className={cn("transition-transform", expanded && "rotate-180")}
          />
          <span className="sr-only">
            {expanded ? "Collapse full text" : "Expand full text"}
          </span>
        </button>
      ) : null}
    </div>
  );
}
