"use client";

import * as React from "react";
import {
  AlertCircle,
  FlaskConical,
  Loader2,
  Play,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LogAnalyzerStatus } from "@/hooks/useLogAnalyzer";

const MAX_LOG_LABEL = "20 MB";

export type DropZoneProps = {
  status: LogAnalyzerStatus;
  error: string | null;
  onFile: (file: File) => void;
  onAnalyzeText: (text: string) => void;
  onLoadSample: () => void;
};

const BUSY_MESSAGES: Record<"reading" | "parsing", { title: string; body: string }> = {
  reading: {
    title: "Reading file locally…",
    body: "The log is being loaded into browser memory — nothing is uploaded.",
  },
  parsing: {
    title: "Parsing in a dedicated Web Worker…",
    body: "Multi-megabyte logs are analyzed off the main thread, so this page stays responsive.",
  },
};

export function DropZone({ status, error, onFile, onAnalyzeText, onLoadSample }: DropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const [pasted, setPasted] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragDepthRef = React.useRef(0);

  const busy = status === "reading" || status === "parsing";
  const busyMessage = busy ? BUSY_MESSAGES[status as "reading" | "parsing"] : null;

  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragging(false);
    }
  };
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped && !busy) onFile(dropped);
  };

  const submitPasted = () => {
    if (busy || pasted.trim().length === 0) return;
    onAnalyzeText(pasted);
  };

  return (
    <Card aria-busy={busy} className="relative overflow-hidden">
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2">
        <div
          onDragEnter={onDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className={cn(
              "flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              dragging
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-zinc-800 bg-zinc-950 hover:border-zinc-700",
              busy && "cursor-wait opacity-60",
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <UploadCloud
                size={22}
                className={dragging ? "text-emerald-400" : "text-zinc-500"}
                aria-hidden
              />
            </span>
            <span>
              <span className="block text-sm font-medium text-zinc-200">
                {dragging ? "Drop the debug log to analyze it" : "Drop your Salesforce debug log here"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                or click to browse — .txt and .log files up to {MAX_LOG_LABEL}
              </span>
              <span className="mt-2 block font-mono text-[11px] leading-5 text-zinc-600">
                SOQL_EXECUTE_BEGIN · LIMIT_USAGE_FOR_NS · FATAL_ERROR …
              </span>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log,text/plain"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected && !busy) onFile(selected);
              event.target.value = "";
            }}
          />
        </div>

        <div className="flex min-h-[240px] flex-col">
          <label htmlFor="sfdla-paste" className="text-sm font-medium text-zinc-200">
            Or paste raw log text
          </label>
          <textarea
            id="sfdla-paste"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            disabled={busy}
            placeholder={
              "12:31:07.0 (11266095)|EXECUTION_STARTED\n12:31:07.0 (11598292)|SOQL_EXECUTE_BEGIN[9]|Aggregations:0|SELECT Id FROM Account\n12:31:07.0 (12391154)|SOQL_EXECUTE_END[9]|Rows:42\n…"
            }
            className="mt-2 min-h-[150px] flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none disabled:opacity-60"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submitPasted}
              disabled={busy || pasted.trim().length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play size={13} />
              Analyze pasted log
            </button>
            <button
              type="button"
              onClick={onLoadSample}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FlaskConical size={14} />
              Load sample log
            </button>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-2 border-t border-zinc-800/80 px-4 py-3 text-xs text-zinc-500 sm:px-6">
        <ShieldCheck size={14} className="shrink-0 text-emerald-400/80" aria-hidden />
        Zero uploads — parsing runs in a page-local Web Worker. No network request is ever made
        with your log.
      </p>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 border-t border-red-500/20 bg-red-500/5 px-4 py-3 sm:px-6"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" aria-hidden />
          <p className="text-sm leading-6 text-red-300">{error}</p>
        </div>
      ) : null}

      {busyMessage ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/85 p-6 backdrop-blur-sm">
          <div className="flex max-w-sm flex-col items-center gap-2 text-center">
            <Loader2 size={26} className="animate-spin text-emerald-400" aria-hidden />
            <p className="text-sm font-semibold text-zinc-100">{busyMessage.title}</p>
            <p className="text-xs leading-5 text-zinc-400">{busyMessage.body}</p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
