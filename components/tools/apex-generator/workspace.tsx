"use client";

import * as React from "react";
import {
  AlertTriangle,
  Braces,
  Check,
  Copy,
  Download,
  Eraser,
  Lock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useApexGenerator } from "@/hooks/useApexGenerator";
import type { ApexPreset } from "@/lib/apex-generator";
import { APEX_GENERATE_DEBOUNCE_MS } from "@/lib/apex-generator/protocol";
import type { JsonSyntaxDiagnosticDetail } from "@/lib/json-schema/protocol";
import { cn } from "@/lib/utils";

const COPY_FEEDBACK_MS = 2000;

interface WorkspaceExample {
  readonly label: string;
  readonly json: string;
}

interface PresetConfig {
  readonly rootName: string;
  readonly auraEnabled: boolean;
  readonly includeParse: boolean;
  readonly includeSerialize: boolean;
  readonly cacheableParse: boolean;
  readonly includeCalloutHelper: boolean;
  readonly examples: readonly WorkspaceExample[];
}

const SOQL_RESULT_EXAMPLE = `{
  "totalSize": 2,
  "done": true,
  "nextRecordsUrl": "/services/data/v60.0/query/01gXX/",
  "records": [
    {
      "attributes": { "type": "Account", "url": "/services/data/v60.0/sobjects/Account/001XX/" },
      "Id": "001XX000003DGb2AAG",
      "Name": "Acme Corp",
      "AnnualRevenue": 1250000.5,
      "LastActivityDate": "2026-09-30",
      "IsDeleted": false
    },
    {
      "attributes": { "type": "Account", "url": "/services/data/v60.0/sobjects/Account/001YY/" },
      "Id": "001XX000003DGb3AAG",
      "Name": "Globex",
      "AnnualRevenue": 99000,
      "Industry": "Energy"
    }
  ]
}`;

const WEBHOOK_EXAMPLE = `{
  "event": "invoice.paid",
  "sent_at": "2026-10-20T14:04:00Z",
  "data": {
    "amount": 4999,
    "currency": "usd",
    "customer": { "email": "billing@acme.dev", "verified": true },
    "lines": [{ "description": "Pro plan", "quantity": 1, "unit_price": 4999 }]
  }
}`;

const MIXED_ARRAY_EXAMPLE = `[
  { "Id": "001", "Name": "Acme", "IsActive": true },
  { "Id": "002", "Name": "Globex", "IsActive": false, "Priority": 1 }
]`;

const WIRE_RESPONSE_EXAMPLE = `{
  "opportunity": {
    "Id": "006XX000004dDaaGAE",
    "Name": "Renewal — Acme Corp",
    "Amount": 48000,
    "StageName": "Proposal",
    "CloseDate": "2026-12-31",
    "IsWon": false
  },
  "lineItems": [
    { "product": "Sales Cloud", "quantity": 12, "unitPrice": 4000, "isRenewal": true },
    { "product": "Service Cloud", "quantity": 4, "unitPrice": 600.5 }
  ],
  "computedAt": "2026-10-27T09:15:00Z"
}`;

const CALLOUT_RESPONSE_EXAMPLE = `{
  "status": "success",
  "requestId": "req_9f2c81",
  "payment": {
    "id": "pay_3Xb2",
    "amount": 1999.99,
    "currency": "usd",
    "captured": true,
    "refunded": null
  },
  "metadata": { "orderId": "a-1023", "source": "web" }
}`;

const PRESET_CONFIGS: Record<ApexPreset, PresetConfig> = {
  hub: {
    rootName: "JsonResponse",
    auraEnabled: true,
    includeParse: true,
    includeSerialize: true,
    cacheableParse: false,
    includeCalloutHelper: false,
    examples: [
      { label: "SOQL Query Result", json: SOQL_RESULT_EXAMPLE },
      { label: "Webhook Payload", json: WEBHOOK_EXAMPLE },
      { label: "Array of Records", json: MIXED_ARRAY_EXAMPLE },
    ],
  },
  lwc: {
    rootName: "LwcResponse",
    auraEnabled: true,
    includeParse: true,
    includeSerialize: false,
    cacheableParse: true,
    includeCalloutHelper: false,
    examples: [
      { label: "Wire Response", json: WIRE_RESPONSE_EXAMPLE },
      { label: "SOQL Query Result", json: SOQL_RESULT_EXAMPLE },
      { label: "Webhook Payload", json: WEBHOOK_EXAMPLE },
    ],
  },
  wrapper: {
    rootName: "CalloutWrapper",
    auraEnabled: false,
    includeParse: true,
    includeSerialize: true,
    cacheableParse: false,
    includeCalloutHelper: true,
    examples: [
      { label: "REST Callout", json: CALLOUT_RESPONSE_EXAMPLE },
      { label: "Webhook Payload", json: WEBHOOK_EXAMPLE },
      { label: "Array of Records", json: MIXED_ARRAY_EXAMPLE },
    ],
  },
};

const PLACEHOLDER =
  '{\n  "paste": "your JSON here",\n  "an": ["apex", "class", "appears", "instantly"]\n}';

const EDITOR_METRICS =
  "h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6";

type OutputTokenKind = "plain" | "string" | "comment" | "keyword" | "number" | "annotation";

const OUTPUT_TOKEN_STYLES: Record<OutputTokenKind, string> = {
  plain: "text-zinc-200",
  string: "text-emerald-300",
  comment: "text-zinc-500 italic",
  keyword: "text-sky-300",
  number: "text-amber-300",
  annotation: "text-fuchsia-300",
};

const APEX_OUTPUT_KEYWORDS = new Set([
  "public", "private", "protected", "global", "class", "static", "final",
  "return", "new", "this", "get", "set", "String", "Decimal", "Boolean",
  "DateTime", "Integer", "Long", "Double", "List", "Map", "Set", "Object",
  "JSON", "deserialize", "serialize",
]);

const OUTPUT_TOKEN_PATTERN =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*')|(@[A-Za-z_$][A-Za-z0-9_$]*)|(-?\d+(?:\.\d+)?)|([A-Za-z_$][A-Za-z0-9_$]*)/g;

function renderApexLine(line: string): React.ReactNode[] {
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
    else if (match[3]) kind = "annotation";
    else if (match[4]) kind = "number";
    else if (match[5] && APEX_OUTPUT_KEYWORDS.has(token)) kind = "keyword";
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

export type ApexGeneratorWorkspaceProps = {
  preset?: ApexPreset;
};

interface ToggleOption {
  readonly key:
    | "auraEnabled"
    | "includeParse"
    | "includeSerialize"
    | "cacheableParse"
    | "includeCalloutHelper";
  readonly label: string;
}

const TOGGLES: readonly ToggleOption[] = [
  { key: "auraEnabled", label: "@AuraEnabled" },
  { key: "includeParse", label: "parse()" },
  { key: "includeSerialize", label: "serialize()" },
  { key: "cacheableParse", label: "cacheable" },
  { key: "includeCalloutHelper", label: "callout" },
];

/** Toggles whose output only exists when parse() is generated. */
const REQUIRES_PARSE: ReadonlySet<ToggleOption["key"]> = new Set([
  "cacheableParse",
  "includeCalloutHelper",
]);

export function ApexGeneratorWorkspace({
  preset = "hub",
}: ApexGeneratorWorkspaceProps) {
  const config = PRESET_CONFIGS[preset];
  const toast = useToast();
  const { status, code, className, error, stats, generate } = useApexGenerator();

  const [json, setJson] = React.useState(config.examples[0]?.json ?? "");
  const [rootName, setRootName] = React.useState(config.rootName);
  const [auraEnabled, setAuraEnabled] = React.useState(config.auraEnabled);
  const [includeParse, setIncludeParse] = React.useState(config.includeParse);
  const [includeSerialize, setIncludeSerialize] = React.useState(
    config.includeSerialize,
  );
  const [cacheableParse, setCacheableParse] = React.useState(config.cacheableParse);
  const [includeCalloutHelper, setIncludeCalloutHelper] = React.useState(
    config.includeCalloutHelper,
  );
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void generate(json, {
        rootName: rootName || "Root",
        auraEnabled,
        includeParse,
        includeSerialize,
        cacheableParse,
        includeCalloutHelper,
      });
    }, APEX_GENERATE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    json,
    rootName,
    auraEnabled,
    includeParse,
    includeSerialize,
    cacheableParse,
    includeCalloutHelper,
    generate,
  ]);

  const copyOutput = React.useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      toast({
        title: "Copied to clipboard",
        description: `${className || "Apex"}.cls — ${stats?.outputLines ?? 0} lines`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by your browser.",
        variant: "error",
      });
    }
  }, [className, code, stats, toast]);

  const downloadCls = React.useCallback(() => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${className || "Generated"}.cls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({
      title: "Download started",
      description: `${className || "Generated"}.cls saved to your downloads.`,
      variant: "success",
    });
  }, [className, code, toast]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void copyOutput();
    }
  };

  const lineCount = json === "" ? 0 : json.split("\n").length;
  const hasSyntaxError = error?.kind === "syntax";

  const toggleState: Record<ToggleOption["key"], boolean> = {
    auraEnabled,
    includeParse,
    includeSerialize,
    cacheableParse,
    includeCalloutHelper,
  };
  const toggleSetters: Record<ToggleOption["key"], (value: boolean) => void> = {
    auraEnabled: setAuraEnabled,
    includeParse: setIncludeParse,
    includeSerialize: setIncludeSerialize,
    cacheableParse: setCacheableParse,
    includeCalloutHelper: setIncludeCalloutHelper,
  };

  const statusText =
    error && error.kind === "syntax"
      ? `JSON error: ${formatLocation(error.detail)}`
      : error && error.kind === "runtime"
        ? `Generation failed: ${error.message}`
        : status === "generating"
          ? "Generating Apex classes from JSON…"
          : status === "ready"
            ? `Apex class ${className || ""} generated from JSON input`
            : "Paste JSON to generate Apex classes";

  return (
    <section
      aria-label="JSON to Apex class generator workspace"
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
          {config.examples.map((example) => (
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
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor="apex-root-name"
            className="text-xs font-medium text-zinc-500"
          >
            Class name
          </label>
          <input
            id="apex-root-name"
            type="text"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            maxLength={64}
            spellCheck={false}
            autoComplete="off"
            placeholder="JsonResponse"
            className="h-8 w-44 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 font-mono text-xs text-zinc-200 caret-emerald-300 transition-colors placeholder:text-zinc-600 hover:border-zinc-700 focus:border-emerald-500/40 focus:outline-none"
          />
          <div
            role="group"
            aria-label="Generated code options"
            className="flex items-center gap-1.5"
          >
            {TOGGLES.map((option) => {
              const active = toggleState[option.key];
              const disabled = REQUIRES_PARSE.has(option.key) && !includeParse;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  title={
                    disabled
                      ? `Requires parse() — turn parse() on to use ${option.label}`
                      : undefined
                  }
                  onClick={() => toggleSetters[option.key](!active)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-md border px-2.5 font-mono text-xs transition-colors",
                    disabled
                      ? "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600 opacity-50"
                      : active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
                  )}
                >
                  {active ? <Check size={12} aria-hidden /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <p
          className="hidden items-center gap-1.5 text-[11px] text-zinc-500 lg:flex"
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
            <label htmlFor="apex-json-input" className="sr-only">
              Raw JSON input
            </label>
            <textarea
              id="apex-json-input"
              value={json}
              onChange={(event) => setJson(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={hasSyntaxError ? true : undefined}
              aria-describedby={error ? "apex-json-input-error" : undefined}
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
              id="apex-json-input-error"
              role="alert"
              className="flex items-start gap-3 border-t border-rose-500/30 bg-rose-500/10 px-4 py-3"
            >
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0 text-rose-400"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  {error.kind === "syntax" ? "Invalid JSON" : "Generation failed"}
                </p>
                <p className="mt-0.5 font-mono text-[13px] leading-6 text-rose-200/80">
                  {error.kind === "syntax"
                    ? formatLocation(error.detail)
                    : error.message}
                </p>
                {error.kind === "syntax" ? null : (
                  <p className="mt-0.5 text-sm leading-6 text-rose-200/60">
                    The last successful Apex class is still shown on the right.
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
              {status === "generating" ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                    aria-hidden
                  />
                  Generating…
                </span>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">
              Generated Apex class
            </h2>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={downloadCls}
                disabled={!code}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} aria-hidden />
                .cls
              </button>
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
              <pre className="h-full overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-6">
                <code>{code.split("\n").map((line, index) => (
                  <span key={index}>
                    {renderApexLine(line)}
                    {"\n"}
                  </span>
                ))}</code>
              </pre>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                  <Braces size={22} className="text-zinc-400" aria-hidden />
                </span>
                <p className="max-w-xs text-sm leading-6 text-zinc-500">
                  {error
                    ? "Fix the JSON on the left to refresh the Apex class."
                    : "Paste JSON on the left — a complete Apex wrapper class with inner classes, parse(), and serialize() appears here instantly, generated entirely in your browser."}
                </p>
              </div>
            )}
          </div>

          {stats && code ? (
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
              <span className="font-mono text-xs text-zinc-500">
                Generated in {stats.durationMs} ms · {stats.outputLines} lines ·{" "}
                {stats.innerClassCount + 1}{" "}
                {stats.innerClassCount + 1 === 1 ? "class" : "classes"} ·{" "}
                {formatBytes(stats.inputBytes)} input
              </span>
              <Badge variant="info">
                {className ? `${className}.cls` : "Apex .cls"}
              </Badge>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
