"use client";

import * as React from "react";
import { Download, FileCode2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { useToast } from "@/components/ui/toast";
import type { ParsedTable, TargetFormat } from "@/lib/converter/types";
import type { ConverterStatus } from "@/hooks/useConverter";
import { cn } from "@/lib/utils";

export type ConverterOptionsState = {
  tableName: string;
  dropTable: boolean;
  minified: boolean;
  soqlColumn: string;
  soqlField: string;
  xmlRoot: string;
  xmlRow: string;
};

export type OutputPaneProps = {
  target: TargetFormat;
  status: ConverterStatus;
  output: string | null;
  table: ParsedTable | null;
  options: ConverterOptionsState;
  onOptionsChange: (patch: Partial<ConverterOptionsState>) => void;
};

type OutputLanguage = "sql" | "json" | "soql" | "xml";

type TokenKind = "plain" | "string" | "comment" | "keyword" | "number";

const TOKEN_STYLES: Record<TokenKind, string> = {
  plain: "text-zinc-200",
  string: "text-emerald-300",
  comment: "text-zinc-500 italic",
  keyword: "text-sky-300",
  number: "text-amber-300",
};

const KEYWORDS: Record<OutputLanguage, ReadonlySet<string>> = {
  sql: new Set([
    "CREATE", "TABLE", "DROP", "IF", "EXISTS", "INSERT", "INTO", "VALUES",
    "NULL", "TRUE", "FALSE", "INTEGER", "NUMERIC", "BOOLEAN", "VARCHAR",
  ]),
  json: new Set(["true", "false", "null"]),
  soql: new Set(["IN", "OR", "AND", "SELECT", "WHERE", "FROM", "NOT"]),
  xml: new Set(),
};

const TOKEN_PATTERN =
  /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(<\?[^?\n]*\?>|<\/?[A-Za-z_][A-Za-z0-9_.:-]*|\/?>)|(-?\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)/g;

function languageForTarget(target: TargetFormat): OutputLanguage {
  switch (target) {
    case "sql":
      return "sql";
    case "json":
      return "json";
    case "soql-in":
      return "soql";
    case "xml":
      return "xml";
  }
}

function renderLine(line: string, language: OutputLanguage, lineKey: number) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let fragmentKey = 0;
  for (const match of line.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    const token = match[0];
    if (index > lastIndex) {
      parts.push(<span key={`${lineKey}-${fragmentKey++}`}>{line.slice(lastIndex, index)}</span>);
    }
    let kind: TokenKind = "plain";
    if (match[1]) kind = "comment";
    else if (match[2]) kind = "string";
    else if (match[3]) kind = "keyword";
    else if (match[4]) kind = "number";
    else if (match[5] && KEYWORDS[language].has(token)) kind = "keyword";
    parts.push(
      <span key={`${lineKey}-${fragmentKey++}`} className={TOKEN_STYLES[kind]}>
        {token}
      </span>,
    );
    lastIndex = index + token.length;
  }
  if (lastIndex < line.length) {
    parts.push(<span key={`${lineKey}-${fragmentKey++}`}>{line.slice(lastIndex)}</span>);
  }
  return parts;
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-emerald-500/50 bg-emerald-500/30" : "border-zinc-700 bg-zinc-800",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all",
          checked ? "left-[18px] bg-emerald-400" : "left-0.5 bg-zinc-400",
        )}
      />
    </button>
  );
}

const INPUT_CLASS =
  "h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none";
const LABEL_CLASS = "text-xs font-medium text-zinc-400";

const DOWNLOAD_EXTENSION: Record<TargetFormat, string> = {
  sql: "sql",
  json: "json",
  "soql-in": "txt",
  xml: "xml",
};

const TARGET_LABELS: Record<TargetFormat, string> = {
  sql: "SQL",
  json: "JSON",
  "soql-in": "SOQL IN Clause",
  xml: "XML",
};

const MAX_PREVIEW_LINES = 1500;

export function OutputPane({
  target,
  status,
  output,
  table,
  options,
  onOptionsChange,
}: OutputPaneProps) {
  const toast = useToast();
  const language = languageForTarget(target);
  const busy = status === "parsing" || status === "generating";

  const lines = React.useMemo(() => (output ? output.split("\n") : []), [output]);
  const visibleLines = lines.slice(0, MAX_PREVIEW_LINES);
  const hiddenLineCount = Math.max(lines.length - visibleLines.length, 0);

  const onDownload = () => {
    if (!output) return;
    const extension = DOWNLOAD_EXTENSION[target];
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `syntaxfiddle-output.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({
      title: `Downloaded ${TARGET_LABELS[target]} file`,
      description: `syntaxfiddle-output.${extension}`,
      variant: "success",
    });
  };

  return (
    <Card className="flex h-full min-h-[520px] flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Output
        </h2>
        <Badge variant="outline">{TARGET_LABELS[target]}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3" aria-label="Output options">
        {target === "sql" ? (
          <>
            <label className="flex-1 min-w-[140px] space-y-1.5">
              <span className={LABEL_CLASS}>Table name</span>
              <input
                type="text"
                value={options.tableName}
                onChange={(event) => onOptionsChange({ tableName: event.target.value })}
                placeholder="imported_data"
                className={INPUT_CLASS}
              />
            </label>
            <div className="flex items-center gap-2 pb-1.5">
              <Switch
                checked={options.dropTable}
                onChange={(value) => onOptionsChange({ dropTable: value })}
                label="DROP TABLE IF EXISTS"
              />
              <span className={cn(LABEL_CLASS, "font-mono")}>DROP TABLE IF EXISTS</span>
            </div>
          </>
        ) : null}

        {target === "json" ? (
          <div className="flex items-center gap-2 pb-1.5">
            <Switch
              checked={options.minified}
              onChange={(value) => onOptionsChange({ minified: value })}
              label="Minify output"
            />
            <span className={LABEL_CLASS}>Minify output</span>
          </div>
        ) : null}

        {target === "soql-in" ? (
          <>
            <label className="min-w-[140px] flex-1 space-y-1.5">
              <span className={LABEL_CLASS}>Source column</span>
              <select
                value={options.soqlColumn}
                onChange={(event) => onOptionsChange({ soqlColumn: event.target.value })}
                className={INPUT_CLASS}
              >
                {(table?.headers ?? []).map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[140px] flex-1 space-y-1.5">
              <span className={LABEL_CLASS}>Target SOQL field</span>
              <input
                type="text"
                value={options.soqlField}
                onChange={(event) => onOptionsChange({ soqlField: event.target.value })}
                placeholder="Id"
                className={INPUT_CLASS}
              />
            </label>
          </>
        ) : null}

        {target === "xml" ? (
          <>
            <label className="min-w-[120px] flex-1 space-y-1.5">
              <span className={LABEL_CLASS}>Root element</span>
              <input
                type="text"
                value={options.xmlRoot}
                onChange={(event) => onOptionsChange({ xmlRoot: event.target.value })}
                placeholder="root"
                className={INPUT_CLASS}
              />
            </label>
            <label className="min-w-[120px] flex-1 space-y-1.5">
              <span className={LABEL_CLASS}>Row element</span>
              <input
                type="text"
                value={options.xmlRow}
                onChange={(event) => onOptionsChange({ xmlRow: event.target.value })}
                placeholder="row"
                className={INPUT_CLASS}
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="h-full overflow-auto" aria-label="Generated output">
          {output && !busy ? (
            <pre className="min-h-full py-3 font-mono text-xs leading-5">
              {visibleLines.map((line, index) => (
                <div key={index} className="flex hover:bg-zinc-800/40">
                  <span className="w-10 shrink-0 select-none border-r border-zinc-800/80 pr-2 text-right text-zinc-600">
                    {index + 1}
                  </span>
                  <code className="whitespace-pre pl-3 pr-4 text-zinc-200">
                    {line.length === 0 ? " " : renderLine(line, language, index)}
                  </code>
                </div>
              ))}
              {hiddenLineCount > 0 ? (
                <div className="flex">
                  <span className="w-10 shrink-0 select-none border-r border-zinc-800/80 pr-2 text-right text-zinc-600">
                    …
                  </span>
                  <code className="whitespace-pre pl-3 pr-4 text-zinc-500 italic">
                    {hiddenLineCount.toLocaleString()} more lines — download the file for the full output
                  </code>
                </div>
              ) : null}
            </pre>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center">
              {busy ? (
                <div className="w-full max-w-md space-y-2" aria-hidden>
                  {[92, 78, 85, 60, 88, 45].map((width, index) => (
                    <div
                      key={index}
                      className="h-4 animate-pulse rounded bg-zinc-800/70"
                      style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <FileCode2 size={28} className="text-zinc-600" />
                  <p className="text-sm text-zinc-500">
                    Generated {TARGET_LABELS[target]} appears here after conversion.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {output && !busy ? (
          <div className="pointer-events-none absolute bottom-3 right-3 flex gap-2">
            <CopyButton
              value={output}
              label="Copy"
              className="pointer-events-auto shadow-lg shadow-black/40"
            />
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 shadow-lg shadow-black/40 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <Download size={14} />
              Download .{DOWNLOAD_EXTENSION[target]}
            </button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
