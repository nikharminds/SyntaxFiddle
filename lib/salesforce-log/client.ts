import type { DebugLogAnalysis } from "./types";
import type { LogAnalyzerWorkerRequest, LogAnalyzerWorkerResponse } from "./protocol";

export const LOG_PARSE_TIMEOUT_MS = 30_000;

export type LogParseFailureCode = "worker-unavailable" | "timeout" | "worker-error";

export type LogParseResult =
  | { ok: true; result: DebugLogAnalysis }
  | { ok: false; code: LogParseFailureCode; message: string };

export interface LogParseOptions {
  timeoutMs?: number;
}

let requestCounter = 0;

/**
 * Ships raw log text to a dedicated Web Worker and resolves with the parsed
 * analysis. A fresh worker is created per parse and terminated on settle, so
 * multi-megabyte logs never leak memory between runs and the main thread
 * never blocks. Follows the `runRegexViaWorker` house pattern.
 */
export function parseLogViaWorker(
  text: string,
  fileName?: string,
  options: LogParseOptions = {},
): Promise<LogParseResult> {
  if (typeof Worker === "undefined") {
    return Promise.resolve({
      ok: false,
      code: "worker-unavailable",
      message:
        "Web Workers are unavailable in this environment — the log will be parsed on the main thread instead.",
    });
  }

  const timeoutMs = options.timeoutMs ?? LOG_PARSE_TIMEOUT_MS;

  return new Promise<LogParseResult>((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("../../workers/logParser.worker.ts", import.meta.url));
    } catch {
      resolve({
        ok: false,
        code: "worker-unavailable",
        message:
          "Web Workers are unavailable in this environment — the log will be parsed on the main thread instead.",
      });
      return;
    }

    const id = ++requestCounter;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: LogParseResult) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    timer = setTimeout(() => {
      finish({
        ok: false,
        code: "timeout",
        message: `Parsing exceeded ${Math.round(timeoutMs / 1000)} seconds and the worker was terminated. The log may be malformed or unusually large — try capturing a narrower window.`,
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<LogAnalyzerWorkerResponse>) => {
      const response = event.data;
      if (response.id !== id) return;
      if (response.ok) {
        finish({ ok: true, result: response.result });
      } else {
        finish({ ok: false, code: "worker-error", message: response.error });
      }
    };

    worker.onerror = () => {
      finish({
        ok: false,
        code: "worker-error",
        message: "The log parser worker crashed while reading this file.",
      });
    };

    const request: LogAnalyzerWorkerRequest = { id, text, fileName };
    worker.postMessage(request);
  });
}
