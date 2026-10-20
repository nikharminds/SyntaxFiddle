import Link from "next/link";
import { ArrowRight, Braces, Cloud, Database, FileCode2, type LucideIcon } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";
import type { TargetFormat } from "@/lib/converter/types";

const TARGET_ICONS: Record<TargetFormat, LucideIcon> = {
  sql: Database,
  json: Braces,
  "soql-in": Cloud,
  xml: FileCode2,
};

const TARGET_TAGLINES: Record<TargetFormat, string> = {
  sql: "Typed CREATE TABLE plus multi-row INSERTs batched at 500.",
  json: "Array-of-objects export with type preservation and minify toggle.",
  "soql-in": "Deduped, escaped WHERE IN clauses chunked at 200 values.",
  xml: "Well-formed documents with configurable root and row elements.",
};

const TARGET_BADGES: Record<TargetFormat, { label: string; variant: BadgeVariant }[]> = {
  sql: [
    { label: "Zero Upload", variant: "success" },
    { label: "Edge Native", variant: "info" },
  ],
  json: [
    { label: "Zero Upload", variant: "success" },
    { label: "Edge Native", variant: "info" },
  ],
  "soql-in": [
    { label: "Zero Upload", variant: "success" },
    { label: "Salesforce Dev", variant: "default" },
  ],
  xml: [
    { label: "Zero Upload", variant: "success" },
    { label: "Edge Native", variant: "info" },
  ],
};

export function TabularConverters() {
  return (
    <section
      aria-labelledby="converters-heading"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="converters-heading"
            className="text-2xl font-bold tracking-tight text-zinc-100"
          >
            Tabular Data Converters
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Eight dedicated CSV and Excel converters, each pre-configured for its
            target format and statically exported to the CDN edge. Paste or drop
            data, convert instantly — nothing ever leaves your browser.
          </p>
        </div>
        <Link
          href="/csv/"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          Open full studio
          <ArrowRight size={14} />
        </Link>
      </div>

      <ul className="mt-8 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONVERSION_PAIRS.map((pair) => {
          const Icon = TARGET_ICONS[pair.target];
          return (
            <li key={pair.slug}>
              <Card hover className="h-full">
                <Link
                  href={`/${pair.slug}/`}
                  className="flex h-full flex-col gap-3 p-5 focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{pair.sourceLabel}</Badge>
                    <Icon size={16} className="text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                    {pair.sourceLabel} to {pair.targetLabel}
                  </h3>
                  <p className="text-xs leading-5 text-zinc-400">
                    {TARGET_TAGLINES[pair.target]}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {TARGET_BADGES[pair.target].map((badge) => (
                      <Badge key={badge.label} variant={badge.variant} className="text-[10px]">
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
