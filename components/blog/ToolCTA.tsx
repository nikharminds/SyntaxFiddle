import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Clock,
  Database,
  KeyRound,
  SquareTerminal,
  Table2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { TOOLS, type ToolIcon } from "@/lib/tools";

/**
 * Contextual tool cross-promotion for blog articles.
 *
 * - `ToolBanner` — in-content banner. Embeddable directly in MDX as
 *   `<ToolBanner tool="cron" />` (registered in mdx-content.tsx) and rendered
 *   by the article route with the post's frontmatter `relatedToolSlug`.
 * - `ToolCtaSidebar` — compact card for the sticky article sidebar.
 *
 * Both resolve against the TOOLS registry so links can never go stale —
 * frontmatter already guarantees the slug exists (Zod-validated at build).
 */

const TOOL_ICONS: Record<ToolIcon, LucideIcon> = {
  cron: Clock,
  csv: Table2,
  regex: Braces,
  jwt: KeyRound,
  curl: SquareTerminal,
  database: Database,
};

export type ResolvedTool = {
  name: string;
  tagline: string;
  href: string;
  icon: LucideIcon;
};

export function resolveTool(slug: string): ResolvedTool | null {
  const tool = TOOLS.find((entry) => entry.slug === slug);
  if (!tool) return null;
  return {
    name: tool.name,
    tagline: tool.tagline,
    href: tool.href ?? `/${tool.slug}/`,
    icon: TOOL_ICONS[tool.icon],
  };
}

/**
 * In-content CTA. Authors embed it in MDX as <ToolBanner tool="cron" />;
 * the article route renders it with the post's frontmatter relatedToolSlug.
 */
export function ToolBanner({
  tool,
  title = "Try it while you read",
}: {
  tool?: string;
  title?: string;
}) {
  const resolved = tool ? resolveTool(tool) : null;
  if (!resolved) return null;
  const Icon = resolved.icon;

  return (
    <div className="not-prose my-8 flex flex-col gap-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <Icon size={18} className="text-emerald-400" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            <strong className="font-semibold text-zinc-200">{resolved.name}</strong> —{" "}
            {resolved.tagline}
          </p>
        </div>
      </div>
      <Link
        href={resolved.href}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
      >
        Open tool
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function ToolCtaSidebar({ slug }: { slug: string }) {
  const tool = resolveTool(slug);
  if (!tool) return null;
  const Icon = tool.icon;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
        <Wrench size={12} aria-hidden="true" />
        Try the tool
      </p>
      <div className="mt-3 flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <Icon size={15} className="text-emerald-400" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-zinc-100">{tool.name}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{tool.tagline}</p>
        </div>
      </div>
      <Link
        href={tool.href}
        className="mt-3.5 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
      >
        Open tool
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}
