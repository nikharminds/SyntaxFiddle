"use client";

import * as React from "react";
import {
  AlertCircle,
  Eraser,
  FlaskConical,
  Languages,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useRegex, type RegexSample } from "@/hooks/useRegex";
import { REGEX_ALLOWED_FLAGS } from "@/lib/regex/engine";
import type { RegexFailure, RegexMatch } from "@/lib/regex/engine";
import { translateDialectPattern, type RegexDialectId } from "@/lib/regex/dialects";
import { cn } from "@/lib/utils";

const EDITOR_METRICS = "whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-6";

const FLAG_DESCRIPTIONS: Record<string, string> = {
  g: "Global — find every match, not just the first",
  i: "Ignore case",
  m: "Multiline — ^ and $ anchor at line boundaries",
  s: "Dotall — . also matches newlines",
  u: "Unicode — strict Unicode matching",
  y: "Sticky — anchor each match at lastIndex",
};

const MATCH_STYLES = [
  "rounded-sm bg-emerald-400/15 text-emerald-200",
  "rounded-sm bg-sky-400/15 text-sky-200",
  "rounded-sm bg-violet-400/15 text-violet-200",
  "rounded-sm bg-amber-400/15 text-amber-200",
];

const GROUP_UNDERLINES = [
  "border-b-2 border-emerald-400",
  "border-b-2 border-sky-400",
  "border-b-2 border-violet-400",
  "border-b-2 border-rose-400",
  "border-b-2 border-amber-400",
  "border-b-2 border-cyan-400",
];

const SAMPLE_PATTERN = "(?<user>[\\w.]+)@(?<domain>\\w+\\.\\w+)";
const SAMPLE_FLAGS = "g";
const SAMPLE_TEXT = `Contact: ada@example.com, grace.hopper@navy.mil
Invalid: not-an-email
Local: admin@localhost`;

function groupNames(match: RegexMatch): string[] {
  return Object.keys(match.groups);
}

function buildMatchContent(
  text: string,
  match: RegexMatch,
  matchKey: string,
): React.ReactNode[] {
  const names = groupNames(match);
  const ranges = match.groupRanges;
  if (!ranges || names.length === 0) {
    return [match.text];
  }
  const segments: React.ReactNode[] = [];
  let cursor = match.start;
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    if (!name) continue;
    const range = ranges[name];
    if (!range) continue;
    const [from, to] = range;
    if (from < cursor || from >= match.end || to > match.end || to <= from) {
      continue;
    }
    if (from > cursor) {
      segments.push(
        <span key={`${matchKey}-plain-${index}`}>{text.slice(cursor, from)}</span>,
      );
    }
    segments.push(
      <span
        key={`${matchKey}-group-${index}`}
        title={`$<${name}>`}
        className={GROUP_UNDERLINES[index % GROUP_UNDERLINES.length]}
      >
        {text.slice(from, to)}
      </span>,
    );
    cursor = to;
  }
  if (cursor < match.end) {
    segments.push(
      <span key={`${matchKey}-tail`}>{text.slice(cursor, match.end)}</span>,
    );
  }
  return segments;
}

function HighlightedText({ text, matches }: { text: string; matches: RegexMatch[] }) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match) continue;
    if (match.start < cursor) continue;
    if (match.start > cursor) {
      nodes.push(<span key={`gap-${index}`}>{text.slice(cursor, match.start)}</span>);
    }
    nodes.push(
      <span
        key={`match-${index}`}
        className={MATCH_STYLES[index % MATCH_STYLES.length]}
      >
        {buildMatchContent(text, match, `match-${index}`)}
      </span>,
    );
    cursor = match.end;
  }
  if (cursor < text.length) {
    nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  }
  return <>{nodes}</>;
}

function FailureAlert({ failure }: { failure: RegexFailure }) {
  const catastrophic = failure.code === "timeout";
  const amber = catastrophic || failure.code === "match-limit" || failure.code === "input-too-large";
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        amber
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-red-500/30 bg-red-500/10",
      )}
    >
      {amber ? (
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />
      ) : (
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <div>
        <p className={cn("text-sm font-semibold", amber ? "text-amber-300" : "text-red-300")}>
          {catastrophic
            ? "Catastrophic backtracking detected"
            : failure.code === "invalid-pattern"
              ? "Invalid pattern"
              : failure.code === "invalid-flags"
                ? "Unsupported flag"
                : failure.code === "match-limit"
                  ? "Too many matches"
                  : failure.code === "input-too-large"
                    ? "Test string too large"
                    : "Evaluation failed"}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm leading-6",
            amber ? "text-amber-200/80" : "text-red-200/80",
          )}
        >
          {failure.message}
          {catastrophic
            ? " The worker was terminated after 2,000 ms — your browser stayed responsive."
            : null}
        </p>
      </div>
    </div>
  );
}

function TranslationBanner({
  dialect,
  pattern,
  flags,
  notices,
}: {
  dialect: RegexDialectId;
  pattern: string;
  flags: string;
  notices: string[];
}) {
  const dialectLabel: Record<RegexDialectId, string> = {
    mysql: "MySQL",
    python: "Python",
    php: "PHP (PCRE)",
    java: "Java",
    dotnet: ".NET",
  };
  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
      <div className="flex items-start gap-3">
        <Languages size={18} className="mt-0.5 shrink-0 text-sky-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sky-200">
            {dialectLabel[dialect]} pattern translated for live evaluation
          </p>
          <p className="mt-1 break-all font-mono text-xs leading-6 text-sky-200/80">
            /{pattern}/{flags}
          </p>
          {notices.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-4">
              {notices.slice(0, 4).map((notice) => (
                <li key={notice} className="text-xs leading-5 text-sky-100/80">
                  {notice}
                </li>
              ))}
              {notices.length > 4 ? (
                <li className="text-xs text-sky-100/60">
                  +{notices.length - 4} more translation notes
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs leading-5 text-sky-100/70">
              No rewrites were needed — this pattern is valid JavaScript RegExp as written.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DialectBlockedAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
    >
      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />
      <div>
        <p className="text-sm font-semibold text-amber-300">
          Not translatable to the evaluation engine
        </p>
        <p className="mt-0.5 text-sm leading-6 text-amber-200/80">{message}</p>
      </div>
    </div>
  );
}

export type RegexLayoutProps = {
  dialect?: RegexDialectId;
  sample?: RegexSample;
};

export function RegexLayout({ dialect, sample }: RegexLayoutProps) {
  const defaultSample: RegexSample = {
    initialPattern: SAMPLE_PATTERN,
    initialFlags: SAMPLE_FLAGS,
    initialTestString: SAMPLE_TEXT,
  };
  const effectiveSample = sample ?? defaultSample;

  const transform = React.useMemo(
    () =>
      dialect
        ? (pattern: string, flags: string) =>
            translateDialectPattern(dialect, pattern, flags)
        : undefined,
    [dialect],
  );

  const {
    pattern,
    setPattern,
    flags,
    toggleFlag,
    testString,
    setTestString,
    result,
    translation,
    isEvaluating,
    executionMode,
    clear,
    loadSample,
  } = useRegex({
    initialPattern: effectiveSample.initialPattern,
    initialFlags: effectiveSample.initialFlags,
    initialTestString: effectiveSample.initialTestString,
    transform,
  });

  const overlayRef = React.useRef<HTMLDivElement>(null);

  const matches = result && result.ok ? result.matches : [];
  const failure = result && !result.ok ? result : null;
  const invalidPattern = failure?.code === "invalid-pattern";

  const overlayText =
    testString.endsWith("\n") || testString === "" ? `${testString}\n` : testString;

  const onEditorScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  const onLoadSample = () => {
    loadSample(effectiveSample);
  };

  return (
    <section aria-label="Regex tester workspace" className="space-y-6">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-0 rounded-lg border bg-zinc-950 px-3 transition-colors",
              invalidPattern
                ? "border-red-500/50"
                : "border-zinc-800 focus-within:border-emerald-500/50",
            )}
          >
            <span aria-hidden className="shrink-0 font-mono text-lg text-zinc-500">
              /
            </span>
            <label htmlFor="regex-pattern" className="sr-only">
              Regular expression pattern
            </label>
            <input
              id="regex-pattern"
              type="text"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="your.*pattern"
              className="h-12 min-w-0 flex-1 bg-transparent px-2 font-mono text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <span
              aria-hidden
              className="shrink-0 font-mono text-lg text-zinc-500"
            >
              /{flags}
            </span>
          </div>

          <div
            role="group"
            aria-label="Regex flags"
            className="flex flex-wrap items-center gap-1.5"
          >
            {REGEX_ALLOWED_FLAGS.map((flag) => {
              const active = flags.includes(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  aria-pressed={active}
                  title={FLAG_DESCRIPTIONS[flag]}
                  onClick={() => toggleFlag(flag)}
                  className={cn(
                    "h-9 w-9 rounded-md border font-mono text-sm font-semibold transition-colors",
                    active
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
                  )}
                >
                  {flag}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 xl:ml-2">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <FlaskConical size={14} />
              Sample
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <Eraser size={14} />
              Clear
            </button>
          </div>
        </div>
      </Card>

      {failure ? <FailureAlert failure={failure} /> : null}
      {translation && !translation.ok ? (
        <DialectBlockedAlert message={translation.message} />
      ) : null}
      {dialect && translation && translation.ok && translation.notices.length > 0 ? (
        <TranslationBanner
          dialect={dialect}
          pattern={translation.jsPattern}
          flags={translation.jsFlags}
          notices={translation.notices}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">Test string</h2>
            <p aria-live="polite" className="text-xs text-zinc-500">
              {isEvaluating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Evaluating…
                </span>
              ) : result && result.ok ? (
                `${result.matchCount} ${result.matchCount === 1 ? "match" : "matches"} · ${result.durationMs.toFixed(2)} ms`
              ) : (
                "Matches highlight as you type"
              )}
            </p>
          </div>
          <div className="relative h-[24rem]">
            <div
              ref={overlayRef}
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden text-zinc-300",
                EDITOR_METRICS,
              )}
            >
              <HighlightedText text={overlayText} matches={matches} />
            </div>
            <label htmlFor="regex-test-string" className="sr-only">
              Test string
            </label>
            <textarea
              id="regex-test-string"
              value={testString}
              onChange={(event) => setTestString(event.target.value)}
              onScroll={onEditorScroll}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Paste the text to test against…"
              className={cn(
                "absolute inset-0 h-full w-full resize-none bg-transparent text-transparent caret-emerald-300 selection:bg-emerald-500/30 placeholder:text-zinc-600 focus:outline-none",
                EDITOR_METRICS,
              )}
            />
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">Match results</h2>
            <Badge variant="info" className="font-normal">
              {executionMode === "worker"
                ? "Sandboxed Web Worker"
                : "Main thread fallback"}
            </Badge>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: "24rem" }}>
            {matches.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">
                {failure
                  ? "Fix the pattern to see matches."
                  : result && result.ok
                    ? "No matches found."
                    : "Type a pattern to see live matches."}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800/70">
                {matches.map((match, index) => (
                  <li key={index} className="px-4 py-3">
                    <div className="flex items-baseline gap-3">
                      <span
                        className={cn(
                          "shrink-0 rounded-sm px-1 font-mono text-xs",
                          MATCH_STYLES[index % MATCH_STYLES.length],
                        )}
                      >
                        #{index + 1}
                      </span>
                      <code
                        title={match.text}
                        className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-200"
                      >
                        {match.text === "" ? "∅ (empty match)" : match.text}
                      </code>
                      <span className="shrink-0 font-mono text-xs text-zinc-500">
                        [{match.start}, {match.end})
                      </span>
                    </div>
                    {groupNames(match).length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {groupNames(match).map((name, groupIndex) => (
                          <li
                            key={name}
                            className={cn(
                              "inline-flex items-baseline gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs",
                              GROUP_UNDERLINES[groupIndex % GROUP_UNDERLINES.length],
                            )}
                            title={`$<${name}>`}
                          >
                            <span className="text-zinc-400">{name}</span>
                            <span className="text-zinc-200">
                              {match.groups[name] === "" ? "—" : match.groups[name]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
