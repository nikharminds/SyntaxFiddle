"use client";

import * as React from "react";
import { generateSchema } from "@/lib/json-schema";
import type { SchemaTarget } from "@/lib/json-schema";
import { diagnoseJsonSyntax } from "@/lib/json-schema/diagnostics";
import type {
  JsonInferError,
  JsonInferRequest,
  JsonInferResponse,
} from "@/lib/json-schema/protocol";
import { JSON_INFER_WATCHDOG_MS } from "@/lib/json-schema/protocol";

export type JsonInferStatus = "idle" | "inferring" | "ready" | "error";

export interface JsonInferStats {
  durationMs: number;
  inputBytes: number;
  outputLines: number;
}

const WORKER_UNAVAILABLE = "worker-unavailable";
const WATCHDOG_TIMEOUT = "watchdog-timeout";
const CANCELLED = "cancelled";

type PendingTask = {
  resolve: (response: JsonInferResponse) => void;
  reject: (error: Error) => void;
  watchdog: number;
};

export function useJsonInfer() {
  const [status, setStatus] = React.useState<JsonInferStatus>("idle");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<JsonInferError | null>(null);
  const [stats, setStats] = React.useState<JsonInferStats | null>(null);

  const workerRef = React.useRef<Worker | null>(null);
  const workerFailedRef = React.useRef(false);
  const pendingRef = React.useRef(new Map<number, PendingTask>());
  const idRef = React.useRef(0);
  const runRef = React.useRef(0);

  const ensureWorker = React.useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (workerFailedRef.current) return null;
    try {
      const worker = new Worker(
        new URL("../workers/json-infer.worker.ts", import.meta.url),
      );
      worker.onmessage = (event: MessageEvent<JsonInferResponse>) => {
        const response = event.data;
        const pending = pendingRef.current.get(response.id);
        if (!pending) return;
        pendingRef.current.delete(response.id);
        window.clearTimeout(pending.watchdog);
        pending.resolve(response);
      };
      worker.onerror = () => {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        const failure = new Error("The background worker crashed");
        pendingRef.current.forEach((task) => {
          window.clearTimeout(task.watchdog);
          task.reject(failure);
        });
        pendingRef.current.clear();
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
      pending.current.forEach((task) => {
        window.clearTimeout(task.watchdog);
        task.reject(new Error(CANCELLED));
      });
      pending.current.clear();
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  const callWorker = React.useCallback(
    (
      build: (id: number) => JsonInferRequest,
    ): Promise<JsonInferResponse> => {
      const worker = ensureWorker();
      if (!worker) return Promise.reject(new Error(WORKER_UNAVAILABLE));
      const id = ++idRef.current;
      return new Promise<JsonInferResponse>((resolve, reject) => {
        const watchdog = window.setTimeout(() => {
          pendingRef.current.delete(id);
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          pendingRef.current.forEach((task) => {
            window.clearTimeout(task.watchdog);
            task.reject(new Error(WATCHDOG_TIMEOUT));
          });
          pendingRef.current.clear();
          reject(new Error(WATCHDOG_TIMEOUT));
        }, JSON_INFER_WATCHDOG_MS);
        pendingRef.current.set(id, { resolve, reject, watchdog });
        worker.postMessage(build(id));
      });
    },
    [ensureWorker],
  );

  const infer = React.useCallback(
    async (
      json: string,
      target: SchemaTarget,
      rootName: string,
    ): Promise<void> => {
      const run = ++runRef.current;
      if (json.trim().length === 0) {
        setStatus("idle");
        setCode("");
        setError(null);
        setStats(null);
        return;
      }
      setStatus("inferring");
      setError(null);

      let response: JsonInferResponse;
      try {
        response = await callWorker((id) => ({
          id,
          type: "infer",
          json,
          target,
          rootName,
        }));
      } catch (workerError) {
        const message =
          workerError instanceof Error ? workerError.message : String(workerError);
        if (message === CANCELLED || run !== runRef.current) return;
        if (message === WATCHDOG_TIMEOUT) {
          setStatus("error");
          setError({
            kind: "runtime",
            message:
              "This JSON is too large or complex to analyze — conversion was aborted after 3 seconds to keep the tab responsive. Try a smaller payload.",
          });
          return;
        }
        if (message !== WORKER_UNAVAILABLE && !workerFailedRef.current) {
          setStatus("error");
          setError({
            kind: "runtime",
            message: `Background conversion failed: ${message}`,
          });
          return;
        }

        const started = performance.now();
        const syntax = diagnoseJsonSyntax(json);
        if (syntax) {
          setStatus("error");
          setError({ kind: "syntax", detail: syntax });
          return;
        }
        try {
          const generated = generateSchema(json, target, rootName);
          if (run !== runRef.current) return;
          setCode(generated);
          setStats({
            durationMs: Math.max(1, Math.round(performance.now() - started)),
            inputBytes: new TextEncoder().encode(json).length,
            outputLines: generated.split("\n").length,
          });
          setStatus("ready");
        } catch (fallbackError) {
          if (run !== runRef.current) return;
          setStatus("error");
          setError({
            kind: "runtime",
            message:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
        }
        return;
      }

      if (run !== runRef.current) return;
      if (response.ok) {
        setCode(response.code);
        setStats({
          durationMs: response.durationMs,
          inputBytes: response.inputBytes,
          outputLines: response.outputLines,
        });
        setStatus("ready");
      } else {
        setStatus("error");
        setError(response.error);
      }
    },
    [callWorker],
  );

  const reset = React.useCallback(() => {
    runRef.current += 1;
    setStatus("idle");
    setCode("");
    setError(null);
    setStats(null);
  }, []);

  return { status, code, error, stats, infer, reset };
}
