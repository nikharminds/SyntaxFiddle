import {
  CATASTROPHIC_BACKTRACKING_MESSAGE,
  REGEX_TIME_BUDGET_MS,
} from "./engine";
import type { RegexRunResult } from "./engine";
import type { RegexWorkerRequest, RegexWorkerResponse } from "./protocol";

export const REGEX_HARD_TIMEOUT_MS = REGEX_TIME_BUDGET_MS;

export interface RegexWorkerOptions {
  timeoutMs?: number;
}

let requestCounter = 0;

export function runRegexViaWorker(
  pattern: string,
  flags: string,
  testString: string,
  options: RegexWorkerOptions = {},
): Promise<RegexRunResult> {
  if (typeof Worker === "undefined") {
    return Promise.resolve({
      ok: false,
      code: "worker-unavailable",
      message:
        "Web Workers are unavailable in this environment — evaluate on the main thread instead.",
      durationMs: 0,
    });
  }
  const timeoutMs = options.timeoutMs ?? REGEX_HARD_TIMEOUT_MS;
  return new Promise<RegexRunResult>((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("../../workers/regex.worker.ts", import.meta.url));
    } catch {
      resolve({
        ok: false,
        code: "worker-unavailable",
        message:
          "Web Workers are unavailable in this environment — evaluate on the main thread instead.",
        durationMs: 0,
      });
      return;
    }
    const id = ++requestCounter;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (result: RegexRunResult) => {
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
        message: CATASTROPHIC_BACKTRACKING_MESSAGE,
        durationMs: timeoutMs,
      });
    }, timeoutMs);
    worker.onmessage = (event: MessageEvent<RegexWorkerResponse>) => {
      if (event.data.id !== id) return;
      const { id: _responseId, ...result } = event.data;
      finish(result);
    };
    worker.onerror = () => {
      finish({
        ok: false,
        code: "worker-error",
        message: "The regex worker crashed while evaluating the pattern.",
        durationMs: 0,
      });
    };
    const request: RegexWorkerRequest = { id, pattern, flags, testString };
    worker.postMessage(request);
  });
}
