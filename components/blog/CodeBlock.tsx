"use client";

import { useEffect, isValidElement, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom MDX code block container: framed chrome, a language indicator badge,
 * and a one-click copy-to-clipboard button (with execCommand fallback for
 * non-secure preview contexts).
 *
 * Registered as the `pre` override in components/blog/mdx-content.tsx. The
 * highlight tokenization itself is done at build time by rehype-highlight —
 * this component only adds interactive chrome on top of static markup.
 */

function extractLanguage(node: ReactNode): string | null {
  if (isValidElement(node)) {
    const className = (node.props as { className?: string }).className;
    if (typeof className === "string") {
      const match = /language-([\w+#.-]+)/.exec(className);
      if (match?.[1]) return match[1];
    }
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const language = extractLanguage(child);
      if (language) return language;
    }
  }
  return null;
}

const COPY_RESET_MS = 2000;

export function CodeBlock({ children, className }: { children?: ReactNode; className?: string }) {
  const preRef = useRef<HTMLPreElement>(null);
  const timerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const language = extractLanguage(children);

  // Clear any pending "copied" reset when the block unmounts mid-animation.
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    const text = preRef.current?.innerText ?? "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/40 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
          className={
            copied
              ? "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400 transition-colors"
              : "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
          }
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* children is the build-time highlighted <code class="hljs language-x">
          element — rendered as-is so highlight tokens are preserved. The
          not-prose wrapper neutralizes the typography plugin's pre rules, so
          spacing/typography is fully controlled here. */}
      <pre
        ref={preRef}
        className={cn(
          "block overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed text-zinc-100",
          className,
        )}
      >
        {children}
      </pre>
    </div>
  );
}
