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
import { useJsonInfer } from "@/hooks/useJsonInfer";
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
    label: "API Response",
    json: JSON.stringify(
      {
        id: 1001,
        user_name: "harshal",
        "created-at": "2024-01-15T10:30:00Z",
        is_active: true,
        roles: ["admin", "editor"],
        profile: {
          display_name: "Harshal",
          "last-login": "2026-10-01T08:12:00Z",
          followers: 1284,
        },
      },
      null,
      2,
    ),
  },
  {
    label: "Mixed Array",
    json: JSON.stringify(
      [
        { id: 1, title: "First", tags: ["a"] },
        { id: 2, title: "Second", done: true, tags: ["b", "c"] },
      ],
      null,
      2,
    ),
  },
  {
    label: "Webhook Event",
    json: JSON.stringify(
      {
        event: "invoice.paid",
        sent_at: "2026-10-20T14:04:00Z",
        data: {
          amount: 4999,
          currency: "usd",
          customer: { email: "billing@acme.dev", verified: true },
          lines: [{ description: "Pro plan", quantity: 1, unit_price: 4999 }],
        },
      },
      null,
      2,
    ),
  },
];

const PLACEHOLDER = '{\n  "paste": "your JSON here",\n  "types": ["are", "inferred", "instantly"]\n}';

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

export type JsonConverterWorkspaceProps = {
  defaultTab?: SchemaTarget;
  initialJson?: string;
};

export function JsonConverterWorkspace({
  defaultTab = "zod",
  initialJson = "",
}: JsonConverterWorkspaceProps) {
  const toast = useToast();
  const { status, code, error, stats, infer } = useJsonInfer();

  const [json, setJson] = React.useState(initialJson);
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
      ? `JSON error: ${formatLocation(error.detail)}`
      : error && error.kind === "runtime"
        ? `Conversion failed: ${error.message}`
        : status === "inferring"
          ? "Converting JSON to schema…"
          : status === "ready"
            ? `${TARGET_LABELS[target]} generated from JSON input`
            : "Paste JSON to generate a schema";

  return (
    <section
      aria-label="JSON to schema converter workspace"
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
            <h2 className="text-sm font-semibold text-zinc-200">JSON input</h2>
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
              Raw JSON input
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
                  {error.kind === "syntax" ? "Invalid JSON" : "Conversion failed"}
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
                    ? "Fix the JSON on the left to refresh the schema."
                    : "Paste JSON on the left — Zod, TypeScript, Pydantic, and Go schemas appear here instantly, generated entirely in your browser."}
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
