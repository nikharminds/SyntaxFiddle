"use client";

import { FileText, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLogAnalyzer, type LogExecutionMode, type LogSourceInfo } from "@/hooks/useLogAnalyzer";
import { formatBytes, formatCount } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis } from "@/lib/salesforce-log/types";
import { AnalyzerTabs } from "./AnalyzerTabs";
import { DropZone } from "./DropZone";

function ResultHeader({
  analysis,
  source,
  executionMode,
  onReset,
}: {
  analysis: DebugLogAnalysis;
  source: LogSourceInfo | null;
  executionMode: LogExecutionMode;
  onReset: () => void;
}) {
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
        <FileText size={18} className="text-emerald-400" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">
          {source?.fileName ?? "Pasted debug log"}
        </p>
        <p className="mt-0.5 font-mono text-xs text-zinc-500">
          {formatBytes(analysis.byteSize)} · {formatCount(analysis.lineCount)} lines · parsed in{" "}
          {analysis.durationMs.toFixed(0)} ms
        </p>
      </div>
      <Badge variant="info" className="font-normal">
        {executionMode === "worker" ? "Web Worker" : "Main thread fallback"}
      </Badge>
      <Badge variant="success" className="font-normal">
        Zero uploads
      </Badge>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
      >
        <RotateCcw size={14} />
        New log
      </button>
    </Card>
  );
}

/**
 * Top-level client shell for the analyzer workspace: upload/paste DropZone
 * before parsing, result header + tabbed analysis after. All parsing happens
 * through the useLogAnalyzer hook — never on a server.
 */
export function LogAnalyzerLayout() {
  const {
    status,
    error,
    analysis,
    source,
    executionMode,
    analyzeFile,
    analyzeText,
    loadSample,
    clear,
  } = useLogAnalyzer();

  const hasResult = status === "ready" && analysis !== null;

  return (
    <section aria-label="Debug log analyzer workspace" className="space-y-6">
      {hasResult && analysis ? (
        <>
          <ResultHeader
            analysis={analysis}
            source={source}
            executionMode={executionMode}
            onReset={clear}
          />
          <AnalyzerTabs analysis={analysis} />
        </>
      ) : (
        <DropZone
          status={status}
          error={error}
          onFile={analyzeFile}
          onAnalyzeText={(text) => void analyzeText(text, null)}
          onLoadSample={loadSample}
        />
      )}
    </section>
  );
}
