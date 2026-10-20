"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import type { CodeSnippet } from "@/lib/cron/seo";
import { cn } from "@/lib/utils";

type TokenKind = "plain" | "string" | "comment" | "keyword" | "number" | "schedule";

type Token = { text: string; kind: TokenKind };

const TOKEN_STYLES: Record<TokenKind, string> = {
  plain: "text-zinc-200",
  string: "text-emerald-300",
  comment: "text-zinc-500 italic",
  keyword: "text-sky-300",
  number: "text-amber-300",
  schedule: "font-semibold text-emerald-400",
};

const KEYWORDS: Record<CodeSnippet["language"], ReadonlySet<string>> = {
  js: new Set(["import", "from", "const", "let", "var", "new", "return", "export", "default", "function"]),
  ts: new Set(["import", "from", "const", "let", "var", "new", "return", "export", "default", "function", "this"]),
  python: new Set(["from", "import", "def", "return", "None", "True", "False", "class"]),
  yaml: new Set(["on", "schedule", "cron", "jobs", "steps", "runs-on", "name"]),
  bash: new Set(["echo"]),
};

const STRING_PATTERNS: Record<CodeSnippet["language"], string> = {
  js: "'(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"",
  ts: "'(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"",
  python: "'(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"",
  yaml: "'(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"",
  bash: "'(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"",
};

const COMMENT_PATTERNS: Record<CodeSnippet["language"], string> = {
  js: "//[^\\n]*",
  ts: "//[^\\n]*",
  python: "#[^\\n]*",
  yaml: "#[^\\n]*",
  bash: "#[^\\n]*",
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classify(text: string, language: CodeSnippet["language"], schedule?: string): TokenKind {
  if (schedule && text === schedule) return "schedule";
  if (/^['"]/.test(text)) return "string";
  if (text.startsWith("//") || text.startsWith("#")) return "comment";
  if (/^\d/.test(text)) return "number";
  if (KEYWORDS[language].has(text)) return "keyword";
  return "plain";
}

function tokenize(code: string, language: CodeSnippet["language"], schedule?: string): Token[] {
  const sources: string[] = [];
  if (schedule) sources.push(escapeRegExp(schedule));
  sources.push(
    STRING_PATTERNS[language],
    COMMENT_PATTERNS[language],
    "[A-Za-z_$][\\w$.-]*",
    "\\d+(?:\\.\\d+)?"
  );
  const regex = new RegExp(`(${sources.join("|")})`, "g");
  const tokens: Token[] = [];
  let lastIndex = 0;
  for (const match of code.matchAll(regex)) {
    const index = match.index ?? 0;
    const text = match[0] ?? "";
    if (index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, index), kind: "plain" });
    }
    tokens.push({ text, kind: classify(text, language, schedule) });
    lastIndex = index + text.length;
  }
  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), kind: "plain" });
  }
  return tokens;
}

export function CodeSnippets({ snippets }: { snippets: CodeSnippet[] }) {
  const toast = useToast();
  const [activeId, setActiveId] = React.useState(snippets[0]?.id ?? "");
  const [copied, setCopied] = React.useState(false);

  const active = snippets.find((snippet) => snippet.id === activeId) ?? snippets[0];

  if (!active) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({
        title: `Copied ${active.label} snippet`,
        description: active.scheduleLiteral ?? undefined,
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by your browser.",
        variant: "error",
      });
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={snippets.map((snippet) => ({ value: snippet.id, label: snippet.label }))}
          value={active.id}
          onValueChange={setActiveId}
          idPrefix="snippet"
          aria-label="Code snippet language"
        />
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy snippet"}
        </button>
      </div>

      {snippets.map((snippet) => (
        <TabPanel
          key={snippet.id}
          value={snippet.id}
          activeValue={active.id}
          idPrefix="snippet"
          className="mt-4 p-0"
        >
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-6">
            <code>
              {tokenize(snippet.code, snippet.language, snippet.scheduleLiteral).map(
                (token, index) => (
                  <span key={index} className={cn(TOKEN_STYLES[token.kind])}>
                    {token.text}
                  </span>
                )
              )}
            </code>
          </pre>
          {snippet.note ? (
            <p className="mt-3 text-xs leading-5 text-zinc-500">{snippet.note}</p>
          ) : null}
        </TabPanel>
      ))}
    </Card>
  );
}
