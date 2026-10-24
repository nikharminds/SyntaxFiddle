"use client";

import * as React from "react";
import {
  AlertTriangle,
  Braces,
  Check,
  Copy,
  Eraser,
  Lock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useXmlInfer } from "@/hooks/useXmlInfer";
import type { SchemaTarget } from "@/lib/json-schema";
import type { JsonSyntaxDiagnosticDetail } from "@/lib/json-schema/protocol";
import { JSON_INFER_DEBOUNCE_MS } from "@/lib/json-schema/protocol";
import { cn } from "@/lib/utils";

const COPY_FEEDBACK_MS = 2000;

const TARGETS: Array<{ value: SchemaTarget; label: string }> = [
  { value: "zod", label: "Zod" },
  { value: "ts", label: "TypeScript" },
  { value: "pydantic", label: "Pydantic" },
  { value: "go", label: "Go Structs" },
];

const TARGET_LABELS: Record<SchemaTarget, string> = {
  zod: "Zod schema",
  ts: "TypeScript interfaces",
  pydantic: "Pydantic models",
  go: "Go structs",
};

const EXAMPLES = [
  {
    label: "Book Catalog",
    json: `<catalog>
  <book id="bk101" available="true">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <price>44.95</price>
    <published_at>2000-10-01T09:00:00Z</published_at>
  </book>
  <book id="bk102" available="false">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <price>5.95</price>
    <published_at>2000-12-16T00:00:00Z</published_at>
  </book>
</catalog>`,
  },
  {
    label: "SOAP Envelope",
    json: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetOrderResponse>
      <order_id>98123</order_id>
      <status>shipped</status>
      <total>129.99</total>
      <items>
        <item><sku>A-1</sku><qty>2</qty></item>
        <item><sku>B-7</sku><qty>1</qty></item>
      </items>
    </GetOrderResponse>
  </soap:Body>
</soap:Envelope>`,
  },
  {
    label: "RSS Feed",
    json: `<rss version="2.0">
  <channel>
    <title>Engineering Notes</title>
    <link>https://example.dev/feed</link>
    <item>
      <title>Postmortem: the 3 a.m. deploy</title>
      <pubDate>2026-10-18T04:15:00Z</pubDate>
      <guid isPermaLink="false">postmortem-3am</guid>
    </item>
    <item>
      <title>Why we rewrote the parser</title>
      <pubDate>2026-10-21T16:40:00Z</pubDate>
      <guid isPermaLink="false">parser-rewrite</guid>
    </item>
  </channel>
</rss>`,
  },
];

const PLACEHOLDER = '<paste>\n  <your-xml here="true"/>\n  <!-- types are inferred instantly -->\n</paste>';

const EDITOR_METRICS = "h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6";

function formatLocation(detail: JsonSyntaxDiagnosticDetail): string {
  const suffix =
    detail.line !== null
      ? ` at line ${detail.line}${detail.column !== null ? `, column ${detail.column}` : ""}`
      : "";
  return `${detail.message}${suffix}`;
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export type XmlConverterWorkspaceProps = {
  defaultTab?: SchemaTarget;
};

export function XmlConverterWorkspace({
  defaultTab = "zod",
}: XmlConverterWorkspaceProps) {
  const toast = useToast();
  const { status, code, error, stats, infer } = useXmlInfer();

  const [json, setJson] = React.useState("");
  const [target, setTarget] = React.useState<SchemaTarget>(
    TARGETS.some((entry) => entry.value === defaultTab) ? defaultTab : "zod",
  );
  const [rootName, setRootName] = React.useState("Root");
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void infer(json, target, rootName);
    }, JSON_INFER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [json, target, rootName, infer]);

  const copyOutput = React.useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      toast({
        title: "Copied to clipboard",
        description: `${TARGET_LABELS[target]} for root "${rootName || "Root"}"`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by your browser.",
        variant: "error",
      });
    }
  }, [code, rootName, target, toast]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void copyOutput();
    }
  };

  const lineCount = json === "" ? 0 : json.split("\n").length;
  const hasSyntaxError = error?.kind === "syntax";

  const statusText =
    error && error.kind === "syntax"
      ? `XML error: ${formatLocation(error.detail)}`
      : error && error.kind === "runtime"
        ? `Conversion failed: ${error.message}`
        : status === "inferring"
          ? "Converting XML to schema…"
          : status === "ready"
            ? `${TARGET_LABELS[target]} generated from XML input`
            : "Paste XML to generate a schema";

  return (
    <section
      aria-label="XML to schema converter workspace"
      onKeyDown={onKeyDown}
      className="space-y-4"
    >
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
              onClick={() => setJson(example.json)}
              className="inline-flex h-8 items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            >
              {example.label}
            </button>
          ))}
        </div>
        <Badge variant="success" className="self-start sm:self-auto">
          <Lock size={12} aria-hidden />
          100% Local Execution: Your PII never leaves this browser tab.
        </Badge>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <label
            htmlFor="json-root-name"
            className="text-xs font-medium text-zinc-500"
          >
            Root name
          </label>
          <input
            id="json-root-name"
            type="text"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            maxLength={64}
            spellCheck={false}
            autoComplete="off"
            placeholder="Root"
            className="h-8 w-44 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 font-mono text-xs text-zinc-200 caret-emerald-300 transition-colors placeholder:text-zinc-600 hover:border-zinc-700 focus:border-emerald-500/40 focus:outline-none"
          />
        </div>
        <Tabs
          idPrefix="json-target"
          tabs={TARGETS.map((entry) => ({
            value: entry.value,
            label: entry.label,
          }))}
          value={target}
          onValueChange={(value) => setTarget(value as SchemaTarget)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">XML input</h2>
            <button
              type="button"
              onClick={() => setJson("")}
              disabled={json === ""}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser size={14} aria-hidden />
              Clear
            </button>
          </div>

          <div className="min-h-0 flex-1">
            <label htmlFor="json-input" className="sr-only">
              Raw XML input
            </label>
            <textarea
              id="json-input"
              value={json}
              onChange={(event) => setJson(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={hasSyntaxError ? true : undefined}
              aria-describedby={error ? "json-input-error" : undefined}
              placeholder={PLACEHOLDER}
              className={cn(
                EDITOR_METRICS,
                "text-zinc-100 caret-emerald-300 placeholder:text-zinc-600 focus:outline-none",
                hasSyntaxError && "text-rose-100/90",
              )}
            />
          </div>

          {error ? (
            <div
              id="json-input-error"
              role="alert"
              className="flex items-start gap-3 border-t border-rose-500/30 bg-rose-500/10 px-4 py-3"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  {error.kind === "syntax" ? "Invalid XML" : "Conversion failed"}
                </p>
                <p className="mt-0.5 font-mono text-[13px] leading-6 text-rose-200/80">
                  {error.kind === "syntax"
                    ? formatLocation(error.detail)
                    : error.message}
                </p>
                {error.kind === "syntax" ? null : (
                  <p className="mt-0.5 text-sm leading-6 text-rose-200/60">
                    The last successful schema is still shown on the right.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
              <span className="font-mono text-xs text-zinc-500">
                {lineCount} {lineCount === 1 ? "line" : "lines"} ·{" "}
                {json.length.toLocaleString()} chars
              </span>
              {status === "inferring" ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                  Converting…
                </span>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">
              Generated schema
            </h2>
            <div className="flex items-center gap-3">
              <p
                className="hidden items-center gap-1.5 text-[11px] text-zinc-500 md:flex"
                aria-hidden
              >
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  ⌘/Ctrl
                </kbd>
                +
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  ↵
                </kbd>
                to copy
              </p>
              <button
                type="button"
                onClick={() => void copyOutput()}
                disabled={!code}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" aria-hidden />
                ) : (
                  <Copy size={14} aria-hidden />
                )}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {code ? (
              <pre className="h-full overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-6 text-zinc-200">
                <code>{code}</code>
              </pre>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                  <Braces size={22} className="text-zinc-400" aria-hidden />
                </span>
                <p className="max-w-xs text-sm leading-6 text-zinc-500">
                  {error
                    ? "Fix the XML on the left to refresh the schema."
                    : "Paste XML on the left — Zod, TypeScript, Pydantic, and Go schemas appear here instantly, generated entirely in your browser."}
                </p>
              </div>
            )}
          </div>

          {stats && code ? (
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
              <span className="font-mono text-xs text-zinc-500">
                Generated in {stats.durationMs} ms · {stats.outputLines} lines ·{" "}
                {formatBytes(stats.inputBytes)} input
              </span>
              <Badge variant="info">{TARGET_LABELS[target]}</Badge>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
