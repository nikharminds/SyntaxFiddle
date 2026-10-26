"use client";

import * as React from "react";
import { formatSOQL } from "@/lib/formatters/soql";
import type { FormatSOQLOptions } from "@/lib/formatters/soql";
import type {
  SoqlWorkerRequest,
  SoqlWorkerResponse,
} from "@/lib/formatters/soql-protocol";

export const SOQL_FORMAT_DEBOUNCE_MS = 120;
const SOQL_WORKER_TIMEOUT_MS = 30_000;

export type SoqlExecutionMode = "worker" | "main-thread";

export type SoqlIndent = "spaces-2" | "spaces-4" | "tab";

export const SOQL_INDENT_OPTIONS: Array<{
  value: SoqlIndent;
  label: string;
  indent: string;
}> = [
  { value: "spaces-2", label: "2 Spaces", indent: "  " },
  { value: "spaces-4", label: "4 Spaces", indent: "    " },
  { value: "tab", label: "Tab", indent: "\t" },
];

type PendingTask = {
  resolve: (response: SoqlWorkerResponse) => void;
  reject: (error: Error) => void;
};

/**
 * Debounced SOQL formatting pipeline. A single persistent Web Worker handles
 * every keystroke so even massive pasted queries never block the UI thread;
 * if Workers are unavailable (or crash), formatting silently falls back to
 * the main thread.
 */
export function useSoqlFormatter(initial: { initialQuery?: string; initialIndent?: SoqlIndent } = {}) {
  const [query, setQuery] = React.useState(initial.initialQuery ?? "");
  const [indent, setIndent] = React.useState<SoqlIndent>(initial.initialIndent ?? "spaces-4");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isFormatting, setIsFormatting] = React.useState(false);
  const [executionMode, setExecutionMode] = React.useState<SoqlExecutionMode>("worker");
  const [durationMs, setDurationMs] = React.useState<number | null>(null);

  const workerRef = React.useRef<Worker | null>(null);
  const workerFailedRef = React.useRef(false);
  const pendingRef = React.useRef(new Map<number, PendingTask>());
  const idRef = React.useRef(0);
  const runRef = React.useRef(0);
  const timerRef = React.useRef<number | null>(null);

  const formatOptions = React.useMemo<FormatSOQLOptions>(() => {
    const entry = SOQL_INDENT_OPTIONS.find((option) => option.value === indent);
    return { indent: entry ? entry.indent : "    " };
  }, [indent]);

  const ensureWorker = React.useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (workerFailedRef.current) return null;
    try {
      const worker = new Worker(new URL("../workers/soql-worker.ts", import.meta.url));
      worker.onmessage = (event: MessageEvent<SoqlWorkerResponse>) => {
        const response = event.data;
        const pending = pendingRef.current.get(response.id);
        pendingRef.current.delete(response.id);
        if (!pending) return;
        if (response.ok) {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.error));
        }
      };
      worker.onerror = () => {
        workerFailedRef.current = true;
        const failure = new Error("The SOQL formatting worker crashed");
        pendingRef.current.forEach((task) => task.reject(failure));
        pendingRef.current.clear();
        worker.terminate();
        workerRef.current = null;
      };
      workerRef.current = worker;
      return worker;
    } catch {
      workerFailedRef.current = true;
      return null;
    }
  }, []);

  React.useEffect(() => {
    const worker = workerRef;
    const pending = pendingRef;
    return () => {
      runRef.current += 1;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      pending.current.forEach((task) => task.reject(new Error("cancelled")));
      pending.current.clear();
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  const formatViaWorker = React.useCallback(
    (text: string, options: FormatSOQLOptions): Promise<SoqlWorkerResponse> => {
      const worker = ensureWorker();
      if (!worker) return Promise.reject(new Error("worker-unavailable"));
      const id = ++idRef.current;
      const request: SoqlWorkerRequest = { id, query: text, options };
      return new Promise<SoqlWorkerResponse>((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject });
        worker.postMessage(request);
        window.setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error("The SOQL formatting worker timed out"));
          }
        }, SOQL_WORKER_TIMEOUT_MS);
      });
    },
    [ensureWorker],
  );

  React.useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      runRef.current += 1;
      setOutput("");
      setError(null);
      setDurationMs(null);
      setIsFormatting(false);
      return;
    }
    const run = ++runRef.current;
    setIsFormatting(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void (async () => {
        let response: SoqlWorkerResponse;
        try {
          response = await formatViaWorker(query, formatOptions);
          setExecutionMode("worker");
        } catch (workerError) {
          const canFallback =
            workerFailedRef.current ||
            (workerError instanceof Error && workerError.message === "worker-unavailable");
          if (!canFallback) {
            if (runRef.current !== run) return;
            setError(workerError instanceof Error ? workerError.message : String(workerError));
            setIsFormatting(false);
            return;
          }
          setExecutionMode("main-thread");
          const started = performance.now();
          try {
            const mainOutput = formatSOQL(query, formatOptions);
            response = {
              id: -1,
              ok: true,
              output: mainOutput,
              durationMs: performance.now() - started,
            };
          } catch (mainError) {
            response = {
              id: -1,
              ok: false,
              error: mainError instanceof Error ? mainError.message : String(mainError),
            };
          }
        }
        if (runRef.current !== run) return;
        if (response.ok) {
          setOutput(response.output);
          setError(null);
          setDurationMs(response.durationMs);
        } else {
          setError(response.error);
        }
        setIsFormatting(false);
      })();
    }, SOQL_FORMAT_DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [query, formatOptions, formatViaWorker]);

  const clear = React.useCallback(() => {
    runRef.current += 1;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setQuery("");
    setOutput("");
    setError(null);
    setDurationMs(null);
    setIsFormatting(false);
  }, []);

  return {
    query,
    setQuery,
    indent,
    setIndent,
    output,
    error,
    isFormatting,
    executionMode,
    durationMs,
    clear,
  };
}
