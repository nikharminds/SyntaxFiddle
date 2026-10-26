"use client";

import * as React from "react";
import { AlertTriangle, Database, Download, Eraser, Lock, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  SOQL_INDENT_OPTIONS,
  useSoqlFormatter,
  type SoqlIndent,
} from "@/hooks/useSoqlFormatter";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  {
    label: "Accounts + subquery",
    query: [
      "SELECT Id, Name, Industry, AnnualRevenue,",
      "(SELECT LastName, Email, Phone FROM Contacts WHERE Email LIKE '%@example.com' ORDER BY LastName LIMIT 5)",
      "FROM Account WHERE Industry = 'Technology' AND AnnualRevenue > USD1000000",
      "WITH SECURITY_ENFORCED ORDER BY Name ASC LIMIT 100",
    ].join(" "),
  },
  {
    label: "TYPEOF polymorphic",
    query: [
      "SELECT Id, TYPEOF What WHEN Account THEN What.Name WHEN Opportunity THEN Opportunity.Name ELSE WhatId END",
      "FROM Task WHERE ActivityDate > LAST_N_DAYS:30 AND IsClosed = FALSE",
    ].join(" "),
  },
  {
    label: "Aggregate + HAVING",
    query: [
      "SELECT StageName, COUNT(Id) deals, SUM(Amount) total, Owner__r.Profile.Name",
      "FROM Opportunity__c WHERE CloseDate > TODAY GROUP BY StageName",
      "HAVING COUNT(Id) > 5 ORDER BY deals DESC LIMIT 50",
    ].join(" "),
  },
];

const PLACEHOLDER = [
  "SELECT Id, Name, (SELECT LastName, Email FROM Contacts)",
  "FROM Account",
  "WHERE Industry = 'Technology' AND CreatedDate > LAST_N_DAYS:90",
  "ORDER BY Name ASC LIMIT 100",
  "",
  "-- paste any SOQL query; it is formatted live in a background worker",
].join("\n");

type OutputTokenKind = "plain" | "string" | "comment" | "keyword" | "literal" | "bind";

const OUTPUT_TOKEN_STYLES: Record<OutputTokenKind, string> = {
  plain: "text-zinc-200",
  string: "text-emerald-300",
  comment: "text-zinc-500 italic",
  keyword: "text-sky-300",
  literal: "text-amber-300",
  bind: "text-fuchsia-300",
};

const SOQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "ORDER", "BY", "HAVING", "LIMIT", "OFFSET",
  "WITH", "TYPEOF", "WHEN", "THEN", "ELSE", "END", "AND", "OR", "NOT", "IN",
  "LIKE", "INCLUDES", "EXCLUDES", "ASC", "DESC", "NULLS", "FIRST", "LAST", "FOR",
  "VIEW", "UPDATE", "REFERENCE", "ALL", "ROWS", "USING", "SCOPE",
  "SECURITY_ENFORCED", "USER_MODE", "SYSTEM_MODE", "DATA", "CATEGORY",
  "AT", "ABOVE", "BELOW", "ABOVE_OR_BELOW",
]);

const SOQL_LITERALS = new Set<string>(["TODAY", "YESTERDAY", "TOMORROW", "TRUE", "FALSE", "NULL"]);
for (const period of ["WEEK", "MONTH", "QUARTER", "YEAR", "FISCAL_QUARTER", "FISCAL_YEAR"]) {
  for (const prefix of ["THIS", "LAST", "NEXT"]) {
    SOQL_LITERALS.add(`${prefix}_${period}`);
  }
}
for (const unit of ["DAYS", "WEEKS", "MONTHS", "QUARTERS", "FISCAL_QUARTERS", "FISCAL_YEARS"]) {
  SOQL_LITERALS.add(`LAST_N_${unit}`);
  SOQL_LITERALS.add(`NEXT_N_${unit}`);
  SOQL_LITERALS.add(`N_${unit}_AGO`);
}

// comment | string | number / date value | bind | word  (currency e.g. USD500 matches "word")
const OUTPUT_TOKEN_PATTERN =
  /(\/\/[^\n]*|--[^\n]*|\/\*[^\n]*?\*\/)|('(?:[^'\\\n]|\\.)*')|(\d{4}-\d{2}-\d{2}(?:T[\d:.+-]*Z?)?|-?\d+(?:\.\d+)?)|(:[A-Za-z_][A-Za-z0-9_.]*)|([A-Za-z_][A-Za-z0-9_]*)/g;

function classifyWord(token: string): OutputTokenKind {
  const upper = token.toUpperCase();
  if (SOQL_KEYWORDS.has(upper)) return "keyword";
  if (SOQL_LITERALS.has(upper) || /^[A-Z]{3}\d/.test(token)) return "literal";
  return "plain";
}

function renderSoqlLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let fragmentKey = 0;
  for (const match of line.matchAll(OUTPUT_TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    const token = match[0];
    if (index > lastIndex) {
      parts.push(<span key={fragmentKey++}>{line.slice(lastIndex, index)}</span>);
    }
    let kind: OutputTokenKind = "plain";
    if (match[1]) kind = "comment";
    else if (match[2]) kind = "string";
    else if (match[3]) kind = "literal";
    else if (match[4]) kind = "bind";
    else if (match[5]) kind = classifyWord(token);
    parts.push(
      <span key={fragmentKey++} className={OUTPUT_TOKEN_STYLES[kind]}>
        {token}
      </span>,
    );
    lastIndex = index + token.length;
  }
  if (lastIndex < line.length) {
    parts.push(<span key={fragmentKey++}>{line.slice(lastIndex)}</span>);
  }
  return parts;
}

function formatDuration(ms: number): string {
  if (ms < 1) return "under 1 ms";
  if (ms < 1000) return `${ms.toFixed(ms < 10 ? 1 : 0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

const EDITOR_METRICS = "h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6";

export type SoqlFormatterWorkspaceProps = {
  initialQuery?: string;
  initialIndent?: SoqlIndent;
};

export function SoqlFormatterWorkspace({
  initialQuery,
  initialIndent,
}: SoqlFormatterWorkspaceProps) {
  const toast = useToast();
  const {
    query,
    setQuery,
    indent,
    setIndent,
    output,
    error,
    isFormatting,
    executionMode,
    durationMs,
    clear,
  } = useSoqlFormatter({ initialQuery, initialIndent });

  const stats = React.useMemo(() => {
    if (!output) return null;
    return { lines: output.split("\n").length, chars: output.length };
  }, [output]);

  const downloadOutput = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "formatted-soql.soql";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({
      title: "Download started",
      description: "formatted-soql.soql",
      variant: "success",
    });
  };

  const statusText = error
    ? `Formatting error: ${error}`
    : isFormatting
      ? "Formatting SOQL…"
      : stats
        ? `Formatted SOQL — ${stats.lines} lines in ${durationMs === null ? "—" : formatDuration(durationMs)}`
        : query.trim()
          ? "Formatting…"
          : "Paste a SOQL query to format";

  return (
    <section aria-label="SOQL formatter workspace" className="space-y-4">
      <p aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Quick load examples"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <Sparkles size={12} aria-hidden />
            Examples
          </span>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => setQuery(example.query)}
              className="inline-flex h-8 items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            >
              {example.label}
            </button>
          ))}
        </div>
        <Badge variant="success" className="self-start sm:self-auto">
          <Lock size={12} aria-hidden />
          100% Client-Side — formatting runs in a background worker.
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">SOQL query</h2>
            <button
              type="button"
              onClick={clear}
              disabled={query === ""}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser size={14} aria-hidden />
              Clear
            </button>
          </div>

          <div className="min-h-0 flex-1">
            <label htmlFor="soql-formatter-input" className="sr-only">
              Raw SOQL query
            </label>
            <textarea
              id="soql-formatter-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={PLACEHOLDER}
              className={cn(
                EDITOR_METRICS,
                "text-zinc-100 caret-emerald-300 placeholder:text-zinc-600 focus:outline-none",
              )}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-2.5">
            <span className="font-mono text-xs text-zinc-500">
              {query.length.toLocaleString()} chars
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs",
                isFormatting ? "text-emerald-300" : "text-zinc-500",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isFormatting ? "animate-pulse bg-emerald-400" : "bg-zinc-600",
                )}
              />
              {isFormatting
                ? "Formatting…"
                : executionMode === "main-thread"
                  ? "Formatted on main thread"
                  : "Web Worker ready"}
            </span>
          </div>
        </Card>

        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold text-zinc-200">Formatted SOQL</h2>
              <Tabs
                idPrefix="soql-indent"
                className="h-auto"
                tabs={SOQL_INDENT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={indent}
                onValueChange={(value) => setIndent(value as SoqlIndent)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadOutput}
                disabled={!output}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} aria-hidden />
                Download
              </button>
              <CopyButton value={output} label="Copy SOQL" disabled={!output} />
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {output ? (
              <pre className="h-full overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-6 text-zinc-200">
                <code>
                  {output.split("\n").map((line, index, lines) => (
                    <React.Fragment key={index}>
                      {renderSoqlLine(line)}
                      {index < lines.length - 1 ? "\n" : null}
                    </React.Fragment>
                  ))}
                </code>
              </pre>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                  <Database size={22} className="text-zinc-400" aria-hidden />
                </span>
                <p className="max-w-xs text-sm leading-6 text-zinc-500">
                  {error
                    ? "Fix the formatting error below — output will refresh automatically."
                    : "Type or paste a SOQL query — clean, indented SOQL appears here instantly, formatted in a background worker."}
                </p>
              </div>
            )}
          </div>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-3 border-t border-amber-500/30 bg-amber-500/10 px-4 py-3"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-amber-300">Formatting failed</p>
                <p className="mt-0.5 text-sm leading-6 text-amber-200/80">{error}</p>
              </div>
            </div>
          ) : stats ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 px-4 py-2.5">
              <span className="font-mono text-xs text-zinc-500">
                {stats.lines.toLocaleString()} lines · {stats.chars.toLocaleString()} chars
              </span>
              <span className="text-xs text-zinc-500">
                {durationMs !== null ? `Formatted in ${formatDuration(durationMs)}` : "Formatted"}
                {" · "}
                {executionMode === "worker" ? "Web Worker" : "main thread"}
              </span>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
