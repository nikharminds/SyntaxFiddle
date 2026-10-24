"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  Eraser,
  Lock,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useCurlConverter } from "@/hooks/useCurlConverter";
import type { TranspileTarget } from "@/lib/curl";
import { cn } from "@/lib/utils";

const COPY_FEEDBACK_MS = 2000;

const JSON_SCHEMA_CTA: Partial<Record<TranspileTarget, { href: string; label: string }>> = {
  fetch: { href: "/json-to-zod/", label: "Zod schema" },
  axios: { href: "/json-to-typescript/", label: "TypeScript interface" },
  python: { href: "/json-to-pydantic/", label: "Pydantic model" },
  go: { href: "/json-to-go-struct/", label: "Go struct" },
  apex: { href: "/json-to-zod/", label: "Zod schema" },
};

const TARGETS: Array<{ value: TranspileTarget; label: string }> = [
  { value: "fetch", label: "Fetch" },
  { value: "axios", label: "Axios" },
  { value: "python", label: "Python" },
  { value: "php", label: "PHP" },
  { value: "go", label: "Go" },
  { value: "csharp", label: "C#" },
  { value: "java", label: "Java" },
  { value: "powershell", label: "PowerShell" },
  { value: "httpie", label: "HTTPie" },
  { value: "apex", label: "Apex" },
];

const TARGET_LABELS: Record<TranspileTarget, string> = {
  fetch: "fetch()",
  axios: "axios",
  python: "Python requests",
  php: "PHP Guzzle",
  go: "Go net/http",
  csharp: "C# HttpClient",
  java: "Java OkHttp",
  apex: "Salesforce Apex",
  powershell: "PowerShell Invoke-RestMethod",
  httpie: "HTTPie",
};

type OutputTokenKind = "plain" | "string" | "comment" | "keyword" | "number";

const OUTPUT_TOKEN_STYLES: Record<OutputTokenKind, string> = {
  plain: "text-zinc-200",
  string: "text-emerald-300",
  comment: "text-zinc-500 italic",
  keyword: "text-sky-300",
  number: "text-amber-300",
};

const JS_KEYWORDS = new Set([
  "import", "export", "from", "const", "let", "var", "function", "async", "await",
  "new", "return", "if", "else", "for", "while", "try", "catch", "throw", "class",
  "typeof", "of", "in", "default", "true", "false", "null", "undefined",
]);

const PYTHON_KEYWORDS = new Set([
  "import", "from", "as", "def", "return", "if", "elif", "else", "for", "while",
  "in", "is", "not", "and", "or", "class", "with", "try", "except", "raise",
  "lambda", "pass", "print", "True", "False", "None",
]);

const PHP_KEYWORDS = new Set([
  "use", "new", "function", "return", "if", "else", "elseif", "foreach", "for",
  "while", "as", "echo", "print", "class", "public", "private", "protected",
  "static", "const", "try", "catch", "throw", "array", "true", "false", "null",
]);

const GO_KEYWORDS = new Set([
  "package", "import", "func", "var", "const", "type", "struct", "map", "chan",
  "interface", "return", "if", "else", "for", "range", "switch", "case",
  "default", "defer", "go", "make", "new", "nil", "true", "false", "string",
  "int", "byte", "error",
]);

const C_LIKE_KEYWORDS = new Set([
  "using", "import", "new", "public", "private", "protected", "static", "final",
  "void", "class", "return", "if", "else", "for", "foreach", "while", "switch",
  "case", "try", "catch", "finally", "throw", "throws", "const", "var", "async",
  "await", "true", "false", "null", "string", "int", "bool", "boolean",
]);

const APEX_KEYWORDS = new Set([
  ...C_LIKE_KEYWORDS,
  "global", "override", "virtual", "extends", "implements", "instanceof",
  "HttpRequest", "HttpResponse", "Http", "System", "EncodingUtil", "Blob",
  "String", "Integer", "Boolean", "List", "Map", "Set",
]);

const POWERSHELL_KEYWORDS = new Set([
  "param", "if", "else", "elseif", "foreach", "for", "while", "switch",
  "try", "catch", "finally", "throw", "return", "function", "filter",
  "Invoke-RestMethod", "Invoke-WebRequest", "ConvertTo-Json",
  "ConvertFrom-Json", "Write-Host", "Write-Output", "new-object",
  "true", "false", "null",
]);

const TARGET_KEYWORDS: Record<TranspileTarget, ReadonlySet<string>> = {
  fetch: JS_KEYWORDS,
  axios: JS_KEYWORDS,
  python: PYTHON_KEYWORDS,
  php: PHP_KEYWORDS,
  go: GO_KEYWORDS,
  csharp: C_LIKE_KEYWORDS,
  java: C_LIKE_KEYWORDS,
  apex: APEX_KEYWORDS,
  powershell: POWERSHELL_KEYWORDS,
  httpie: new Set<string>(["http", "--raw", "--auth", "--check-status"]),
};

const OUTPUT_TOKEN_PATTERN =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(-?\d+(?:\.\d+)?)|([A-Za-z_$][A-Za-z0-9_$]*)/g;

function renderOutputLine(line: string, target: TranspileTarget): React.ReactNode[] {
  const keywords = TARGET_KEYWORDS[target];
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
    else if (match[3]) kind = "number";
    else if (match[4] && keywords.has(token)) kind = "keyword";
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

const EXAMPLES = [
  {
    label: "GET with Bearer Token",
    command: [
      "curl 'https://api.example.com/users?role=admin&limit=5' \\",
      "  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' \\",
      "  -H 'Accept: application/json'",
    ].join("\n"),
  },
  {
    label: "POST JSON with Headers",
    command: [
      "curl -X POST https://api.example.com/todos \\",
      "  -H 'Content-Type: application/json' \\",
      "  -H 'X-Request-Id: demo-42' \\",
      "  --data-raw '{\"title\": \"Ship the converter\", \"tags\": [\"curl\", \"fetch\"], \"done\": false}'",
    ].join("\n"),
  },
  {
    label: "Basic Auth Request",
    command: "curl -u 'admin:s3cr3t-p4ss' https://api.example.com/admin/stats --data-urlencode 'query=uptime'",
  },
];

const PLACEHOLDER = [
  "curl -X POST https://api.example.com/todos \\",
  "  -H 'Content-Type: application/json' \\",
  "  -d '{\"title\": \"Hello from SyntaxFiddle\"}'",
].join("\n");

const EDITOR_METRICS = "h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6";

export type CurlConverterWorkspaceProps = {
  initialTarget?: TranspileTarget;
};

export function CurlConverterWorkspace({ initialTarget = "fetch" }: CurlConverterWorkspaceProps) {
  const toast = useToast();
  const {
    command,
    setCommand,
    target,
    setTarget,
    output,
    error,
    request,
    clear,
    loadCommand,
  } = useCurlConverter({ initialTarget });

  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<number | null>(null);
  const schemaCta = JSON_SCHEMA_CTA[target];

  React.useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const copyOutput = React.useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      toast({
        title: "Copied to clipboard",
        description: `${TARGET_LABELS[target]} snippet`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by your browser.",
        variant: "error",
      });
    }
  }, [output, target, toast]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void copyOutput();
    }
  };

  const statusText = error
    ? `Parse error: ${error}`
    : request
      ? `${request.method} ${request.url} converted to ${TARGET_LABELS[target]}`
      : command.trim()
        ? "Converting…"
        : "Paste a cURL command to convert";

  return (
    <section
      aria-label="cURL to code converter workspace"
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
              onClick={() => loadCommand(example.command)}
              className="inline-flex h-8 items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            >
              {example.label}
            </button>
          ))}
        </div>
        <Badge variant="success" className="self-start sm:self-auto">
          <Lock size={12} aria-hidden />
          100% Client-Side: Tokens &amp; credentials never leave your browser.
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">cURL command</h2>
            <button
              type="button"
              onClick={clear}
              disabled={command === ""}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser size={14} aria-hidden />
              Clear
            </button>
          </div>

          <div className="min-h-0 flex-1">
            <label htmlFor="curl-command-input" className="sr-only">
              Raw cURL command
            </label>
            <textarea
              id="curl-command-input"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "curl-command-error" : undefined}
              placeholder={PLACEHOLDER}
              className={cn(
                EDITOR_METRICS,
                "text-zinc-100 caret-emerald-300 placeholder:text-zinc-600 focus:outline-none",
                error && "text-amber-100/90",
              )}
            />
          </div>

          {error ? (
            <div
              id="curl-command-error"
              role="alert"
              className="flex items-start gap-3 border-t border-amber-500/30 bg-amber-500/10 px-4 py-3"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Could not parse this cURL command
                </p>
                <p className="mt-0.5 text-sm leading-6 text-amber-200/80">
                  {error} The last successful conversion is still shown on the right.
                </p>
              </div>
            </div>
          ) : request ? (
            <div className="flex items-center gap-2 overflow-hidden border-t border-zinc-800 px-4 py-2.5">
              <Badge variant="info" className="font-mono">
                {request.method}
              </Badge>
              {request.isJson ? <Badge variant="warning">JSON body</Badge> : null}
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">
                {request.url}
              </span>
            </div>
          ) : null}
        </Card>

        <Card className="flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <Tabs
              idPrefix="curl-target"
              className="h-auto max-w-full flex-wrap"
              tabs={TARGETS.map((entry) => ({
                value: entry.value,
                label: entry.label,
              }))}
              value={target}
              onValueChange={(value) => setTarget(value as TranspileTarget)}
            />
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
                disabled={!output}
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

          {TARGETS.map((entry) => {
            const active = entry.value === target;
            return (
              <div
                key={entry.value}
                role="tabpanel"
                id={`curl-target-panel-${entry.value}`}
                aria-labelledby={`curl-target-tab-${entry.value}`}
                hidden={!active}
                className="min-h-0 flex-1"
              >
                {active && output ? (
                  <pre className="h-full overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-6 text-zinc-200">
                    <code>
                      {output.split("\n").map((line, index, lines) => (
                        <React.Fragment key={index}>
                          {renderOutputLine(line, entry.value)}
                          {index < lines.length - 1 ? "\n" : null}
                        </React.Fragment>
                      ))}
                    </code>
                  </pre>
                ) : null}
                {active && !output ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                      <Terminal size={22} className="text-zinc-400" aria-hidden />
                    </span>
                    <p className="max-w-xs text-sm leading-6 text-zinc-500">
                      {error
                        ? "Fix the cURL command on the left to refresh the output."
                        : "Paste a cURL command — idiomatic code appears here instantly, converted entirely in your browser."}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}

          {output && schemaCta ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 px-4 py-3">
              <p className="text-sm text-zinc-400">
                Got a JSON response from this API?
              </p>
              <Link
                href={schemaCta.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Generate a {schemaCta.label} offline
                <ArrowUpRight size={14} aria-hidden />
              </Link>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
