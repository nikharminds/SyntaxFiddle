"use client";

import * as React from "react";
import { AlertCircle, Eraser, FlaskConical, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { useMounted } from "@/hooks/use-mounted";
import { useJwt } from "@/hooks/useJwt";
import { isJWTError } from "@/lib/jwt/engine";
import { cn } from "@/lib/utils";

const EDITOR_METRICS = "whitespace-pre-wrap break-all p-4 font-mono text-[13px] leading-6";

const BEARER_PREFIX = /^Bearer\s+/i;

const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTk2OTAzOTAyMn0.tEBcZf3kGvJuqUG1C0vBjFt1Ax4GMd0gPf1Q4Rz-VvM";

type TokenSegment = { text: string; className: string };

function buildTokenSegments(token: string, valid: boolean): TokenSegment[] {
  if (!valid) {
    return [{ text: token, className: "text-zinc-300" }];
  }
  const trimmedStart = token.length - token.trimStart().length;
  const trimmed = token.trim();
  const core = trimmed.replace(BEARER_PREFIX, "");
  const prefixLength = trimmedStart + (trimmed.length - core.length);
  const segments: TokenSegment[] = [];
  if (prefixLength > 0) {
    segments.push({ text: token.slice(0, prefixLength), className: "text-zinc-500" });
  }
  const [header, payload, signature] = core.split(".");
  segments.push(
    { text: header ?? "", className: "rounded-sm bg-red-500/15 text-red-300" },
    { text: ".", className: "text-zinc-600" },
    { text: payload ?? "", className: "rounded-sm bg-purple-500/15 text-purple-300" },
    { text: ".", className: "text-zinc-600" },
    { text: signature ?? "", className: "rounded-sm bg-blue-500/15 text-blue-300" },
  );
  const suffixStart = prefixLength + core.length;
  if (suffixStart < token.length) {
    segments.push({ text: token.slice(suffixStart), className: "text-zinc-500" });
  }
  return segments;
}

function JsonValue({ value, depth }: { value: unknown; depth: number }): React.ReactNode {
  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);
  if (value === null) {
    return <span className="text-rose-400">null</span>;
  }
  if (typeof value === "string") {
    return <span className="text-emerald-300">{JSON.stringify(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-amber-300">{String(value)}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-sky-300">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-zinc-500">[]</span>;
    }
    return (
      <>
        <span className="text-zinc-500">[{"\n"}</span>
        {value.map((item, index) => (
          <React.Fragment key={index}>
            {childIndent}
            <JsonValue value={item} depth={depth + 1} />
            {index < value.length - 1 ? <span className="text-zinc-500">,{"\n"}</span> : null}
          </React.Fragment>
        ))}
        {"\n"}
        {indent}
        <span className="text-zinc-500">]</span>
      </>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-zinc-500">{"{}"}</span>;
    }
    return (
      <>
        <span className="text-zinc-500">{"{"}
          {"\n"}
        </span>
        {entries.map(([key, child], index) => (
          <React.Fragment key={key}>
            {childIndent}
            <span className="text-sky-300">{JSON.stringify(key)}</span>
            <span className="text-zinc-500">: </span>
            <JsonValue value={child} depth={depth + 1} />
            {index < entries.length - 1 ? <span className="text-zinc-500">,{"\n"}</span> : null}
          </React.Fragment>
        ))}
        {"\n"}
        {indent}
        <span className="text-zinc-500">{"}"}</span>
      </>
    );
  }
  return <span className="text-zinc-300">{String(value)}</span>;
}

function JsonBlock({ value }: { value: Record<string, unknown> }) {
  return (
    <pre
      aria-readonly="true"
      className="max-h-[18rem] overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-[13px] leading-6 text-zinc-200"
    >
      <JsonValue value={value} depth={0} />
    </pre>
  );
}

function formatDuration(seconds: number): string {
  const units: [number, string][] = [
    [31_536_000, "year"],
    [2_592_000, "month"],
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size);
      return `${count.toLocaleString("en-US")} ${label}${count === 1 ? "" : "s"}`;
    }
  }
  return "less than a minute";
}

function DecodedPane({
  title,
  accent,
  section,
}: {
  title: string;
  accent: "red" | "purple";
  section: Record<string, unknown>;
}) {
  const pretty = JSON.stringify(section, null, 2);
  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-3",
          accent === "red"
            ? "border-red-500/20 bg-red-500/5"
            : "border-purple-500/20 bg-purple-500/5",
        )}
      >
        <h3
          className={cn(
            "text-sm font-semibold",
            accent === "red" ? "text-red-300" : "text-purple-300",
          )}
        >
          {title}
        </h3>
        <CopyButton value={pretty} label="Copy JSON" />
      </div>
      <JsonBlock value={section} />
    </Card>
  );
}

export function JwtLayout() {
  const { token, setToken, result, clear } = useJwt();
  const mounted = useMounted();
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const parsed = result && !isJWTError(result) ? result : null;
  const error = result && isJWTError(result) ? result : null;

  const segments = React.useMemo(
    () => buildTokenSegments(token, parsed !== null),
    [token, parsed],
  );

  const expClaim = parsed ? parsed.payload.json.exp : undefined;
  const expiresAt =
    typeof expClaim === "number" && Number.isFinite(expClaim) ? expClaim * 1000 : null;
  const expired = expiresAt !== null ? Date.now() > expiresAt : null;

  const overlayText = token === "" || token.endsWith("\n") ? `${token}\n` : token;

  const onEditorScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <section aria-label="JWT decoder workspace" className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-300">
              Invalid token
              {error.segment ? ` — ${error.segment} segment` : ""}
            </p>
            <p className="mt-0.5 text-sm leading-6 text-red-200/80">{error.message}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">Encoded token</h2>
            <ul className="flex list-none items-center gap-3 text-xs text-zinc-400" aria-label="Segment color legend">
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-red-400" />
                Header
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-purple-400" />
                Payload
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-blue-400" />
                Signature
              </li>
            </ul>
          </div>
          <div className="relative h-72">
            <div
              ref={overlayRef}
              aria-hidden
              className={cn("pointer-events-none absolute inset-0 overflow-hidden", EDITOR_METRICS)}
            >
              {segments.map((segment, index) => (
                <span key={index} className={segment.className}>
                  {segment.text}
                </span>
              ))}
            </div>
            <label htmlFor="jwt-token-input" className="sr-only">
              Encoded JWT
            </label>
            <textarea
              id="jwt-token-input"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              onScroll={onEditorScroll}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Paste a JWT (eyJhbGciOi…)"
              className={cn(
                "absolute inset-0 h-full w-full resize-none bg-transparent text-transparent caret-emerald-300 selection:bg-emerald-500/30 placeholder:text-zinc-600 focus:outline-none",
                EDITOR_METRICS,
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-4 py-3">
            <button
              type="button"
              onClick={() => setToken(SAMPLE_TOKEN)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <FlaskConical size={14} />
              Load Sample
            </button>
            <CopyButton value={token} label="Copy Token" disabled={token === ""} />
            <button
              type="button"
              onClick={clear}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <Eraser size={14} />
              Clear
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          {parsed ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">
                  <ShieldCheck size={12} />
                  Client-Side Only
                </Badge>
                <Badge variant="warning">
                  <ShieldAlert size={12} />
                  Decode-Only — Signature Not Verified
                </Badge>
                {mounted && expiresAt !== null && expired !== null ? (
                  <Badge variant={expired ? "default" : "info"}>
                    <KeyRound size={12} className={expired ? "text-red-400" : undefined} />
                    {expired
                      ? `Expired ${formatDuration((Date.now() - expiresAt) / 1000)} ago`
                      : `Active — expires in ${formatDuration((expiresAt - Date.now()) / 1000)}`}
                  </Badge>
                ) : null}
              </div>
              <DecodedPane title="Header" accent="red" section={parsed.header.json} />
              <DecodedPane title="Payload" accent="purple" section={parsed.payload.json} />
            </>
          ) : (
            <Card className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 border-dashed bg-transparent p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <KeyRound size={22} className="text-zinc-400" />
              </span>
              <p className="max-w-xs text-sm leading-6 text-zinc-500">
                {error
                  ? "Fix the token on the left to inspect its claims."
                  : "Paste a token on the left — the header and payload decode instantly, entirely in your browser. Nothing is ever transmitted."}
              </p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
