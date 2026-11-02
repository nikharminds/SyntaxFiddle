"use client";

import * as React from "react";
import { analyzeDebugLog } from "@/lib/salesforce-log/parser";
import { parseLogViaWorker } from "@/lib/salesforce-log/client";
import { SAMPLE_LOG, SAMPLE_LOG_FILE_NAME } from "@/lib/salesforce-log/sample";
import type { DebugLogAnalysis } from "@/lib/salesforce-log/types";

/** Matches Salesforce's own maximum debug-log size (Setup → Debug Logs). */
export const MAX_LOG_BYTES = 20 * 1024 * 1024;
export const MAX_LOG_LABEL = "20 MB";

const LOG_FILE_EXTENSION_PATTERN = /\.(txt|log)$/i;

export type LogAnalyzerStatus = "idle" | "reading" | "parsing" | "ready" | "error";
export type LogExecutionMode = "worker" | "main-thread";

export type LogSourceInfo = {
  fileName: string | null;
  bytes: number;
  chars: number;
};

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Orchestrates the analyzer workspace state. Files are read with the local
 * File API and parsed inside a dedicated Web Worker; if workers are
 * unavailable the parser runs on the main thread as a last resort. Either
 * way, the log never leaves the browser — there is no API route to call.
 */
export function useLogAnalyzer() {
  const [status, setStatus] = React.useState<LogAnalyzerStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<DebugLogAnalysis | null>(null);
  const [source, setSource] = React.useState<LogSourceInfo | null>(null);
  const [executionMode, setExecutionMode] = React.useState<LogExecutionMode>("worker");
  const runRef = React.useRef(0);

  const analyzeText = React.useCallback(async (text: string, fileName: string | null) => {
    const run = runRef.current + 1;
    runRef.current = run;

    if (text.trim().length === 0) {
      setStatus("error");
      setError(
        "The log appears to be empty — drop a Salesforce debug log file or paste its contents first.",
      );
      return;
    }
    if (text.length > MAX_LOG_BYTES) {
      setStatus("error");
      setError(
        `This log is roughly ${formatMb(text.length)} of text — the client-side cap is ${MAX_LOG_LABEL}. Capture a narrower time window or lower the trace-flag levels, then export again.`,
      );
      return;
    }

    setStatus("parsing");
    setError(null);

    const outcome = await parseLogViaWorker(text, fileName ?? undefined);
    if (run !== runRef.current) return;

    if (outcome.ok) {
      setAnalysis(outcome.result);
      setSource({
        fileName,
        bytes: outcome.result.byteSize,
        chars: text.length,
      });
      setExecutionMode("worker");
      setStatus("ready");
      return;
    }

    if (outcome.code === "worker-unavailable") {
      // Graceful degradation: parse locally, still zero network calls.
      try {
        const result = analyzeDebugLog(text);
        if (run !== runRef.current) return;
        setAnalysis(result);
        setSource({ fileName, bytes: result.byteSize, chars: text.length });
        setExecutionMode("main-thread");
        setStatus("ready");
      } catch (fallbackError) {
        setStatus("error");
        setError(
          fallbackError instanceof Error
            ? fallbackError.message
            : "The log could not be parsed.",
        );
      }
      return;
    }

    setStatus("error");
    setError(outcome.message);
  }, []);

  const analyzeFile = React.useCallback(
    async (file: File) => {
      runRef.current += 1;
      if (!LOG_FILE_EXTENSION_PATTERN.test(file.name) && file.type !== "text/plain") {
        setStatus("error");
        setError(
          `"${file.name}" is not a .txt or .log file. Export the debug log from Setup → Debug Logs or the Developer Console and try again.`,
        );
        return;
      }
      if (file.size > MAX_LOG_BYTES) {
        setStatus("error");
        setError(
          `"${file.name}" is ${formatMb(file.size)} — the client-side cap is ${MAX_LOG_LABEL} (the same ceiling Salesforce applies to debug logs).`,
        );
        return;
      }
      setStatus("reading");
      setError(null);
      try {
        const text = await file.text();
        await analyzeText(text, file.name);
      } catch {
        setStatus("error");
        setError(
          `"${file.name}" could not be read as text. If it uses an exotic encoding, re-save it as UTF-8 .txt and try again.`,
        );
      }
    },
    [analyzeText],
  );

  const loadSample = React.useCallback(() => {
    void analyzeText(SAMPLE_LOG, SAMPLE_LOG_FILE_NAME);
  }, [analyzeText]);

  const clear = React.useCallback(() => {
    runRef.current += 1;
    setStatus("idle");
    setError(null);
    setAnalysis(null);
    setSource(null);
  }, []);

  return {
    status,
    error,
    analysis,
    source,
    executionMode,
    analyzeFile,
    analyzeText,
    loadSample,
    clear,
  };
}
