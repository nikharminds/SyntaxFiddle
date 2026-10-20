"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Braces,
  Clock,
  KeyRound,
  Search,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TOOLS, type Tool, type ToolIcon, type ToolStatus } from "@/lib/tools";
import { cn } from "@/lib/utils";

const ICONS: Record<ToolIcon, LucideIcon> = {
  cron: Clock,
  csv: Table2,
  regex: Braces,
  jwt: KeyRound,
};

const STATUS_META: Record<ToolStatus, { label: string; variant: BadgeVariant }> = {
  live: { label: "Live", variant: "success" },
  beta: { label: "Beta", variant: "warning" },
  soon: { label: "Coming Soon", variant: "default" },
};

const SAMPLE_EXPRESSIONS = ["*/5 * * * *", "0 9 * * 1-5", "30 2 1 * *"];

function StatusBadge({ status }: { status: ToolStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function FeaturedToolCard({ tool }: { tool: Tool }) {
  const Icon = ICONS[tool.icon];

  return (
    <Card hover className="h-full">
      <Link
        href={`/${tool.slug}`}
        className="flex h-full flex-col gap-4 p-6 focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Icon size={20} className="text-emerald-400" />
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="info">Featured</Badge>
            <StatusBadge status={tool.status} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
            {tool.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{tool.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
          {SAMPLE_EXPRESSIONS.map((expression) => (
            <code
              key={expression}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-emerald-400"
            >
              {expression}
            </code>
          ))}
        </div>

        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
          Open playground
          <ArrowRight size={15} />
        </span>
      </Link>
    </Card>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = ICONS[tool.icon];
  const isSoon = tool.status === "soon";

  if (isSoon) {
    return (
      <Card className="h-full border-dashed bg-transparent">
        <div className="flex h-full flex-col gap-4 p-6 opacity-75">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
              <Icon size={20} className="text-zinc-400" />
            </span>
            <StatusBadge status={tool.status} />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{tool.name}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{tool.tagline}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover className="flex h-full flex-col">
      <Link
        href={`/${tool.slug}`}
        className="flex flex-1 flex-col gap-4 p-6 focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Icon size={20} className="text-emerald-400" />
          </span>
          <StatusBadge status={tool.status} />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{tool.name}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{tool.description}</p>
        </div>
        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
          Open tool
          <ArrowRight size={15} />
        </span>
      </Link>
      {tool.conversions ? (
        <div className="flex flex-wrap gap-1.5 border-t border-zinc-800/80 px-6 pb-5 pt-4">
          {tool.conversions.map((conversion) => (
            <Link
              key={conversion.href}
              href={conversion.href}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-emerald-400/90 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            >
              {conversion.label}
            </Link>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function ToolGrid() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter((tool) =>
      [tool.name, tool.tagline, tool.description, ...tool.keywords]
        .concat(tool.conversions?.map((conversion) => conversion.label) ?? [])
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="tools-heading" className="text-2xl font-bold tracking-tight text-zinc-100">
            Tool directory
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Every tool ships as pre-rendered HTML and runs on your machine.
          </p>
        </div>
        <div className="flex items-center gap-3 lg:shrink-0">
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search tools"
              placeholder="Search tools, keywords, formats…"
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
          <p aria-live="polite" className="whitespace-nowrap text-xs text-zinc-500">
            {results.length} of {TOOLS.length} tools
          </p>
        </div>
      </div>

      {results.length > 0 ? (
        <ul className="mt-8 grid list-none gap-4 sm:grid-cols-2">
          {results.map((tool) => (
            <li key={tool.slug}>
              {tool.featured ? <FeaturedToolCard tool={tool} /> : <ToolCard tool={tool} />}
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mt-8 border-dashed bg-transparent p-8 text-center">
          <p className="text-sm text-zinc-400">
            No tools match{" "}
            <span className="font-mono text-zinc-200">{query.trim()}</span>. Try “cron”,
            “csv”, “sql”, or “json”.
          </p>
        </Card>
      )}
    </div>
  );
}
