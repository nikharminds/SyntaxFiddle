import { analyzeDebugLog } from "../lib/salesforce-log/parser";
import type {
  LogAnalyzerWorkerRequest,
  LogAnalyzerWorkerResponse,
} from "../lib/salesforce-log/protocol";

/**
 * Salesforce debug-log parser worker — the performance isolation boundary.
 *
 * Memory & responsiveness contract (20 MB logs):
 *  - The raw string arrives once via postMessage (structured clone). It is
 *    scanned by the parser in a single regex pass and never copied into an
 *    array of lines; intermediate state is Maps + capped arrays.
 *  - Every detail collection is hard-capped (see parser constants), so the
 *    response payload stays bounded no matter how pathological the log is.
 *  - The worker is terminated by the main thread after each parse
 *    (`parseLogViaWorker`), releasing the entire heap at once.
 *  - This worker performs no network access of any kind — the log can never
 *    leave the browser through this code path.
 *
 * A char guard slightly above the 20 MB product cap is defense-in-depth:
 * if a caller bypassed the UI guard, we fail fast with a typed error
 * instead of risking an OOM mid-parse.
 */
const MAX_SUPPORTED_CHARS = 25 * 1024 * 1024;

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<LogAnalyzerWorkerRequest>) => void) | null;
  postMessage(message: LogAnalyzerWorkerResponse): void;
};

ctx.onmessage = (event: MessageEvent<LogAnalyzerWorkerRequest>) => {
  const message = event.data;
  try {
    if (message.text.length > MAX_SUPPORTED_CHARS) {
      ctx.postMessage({
        id: message.id,
        ok: false,
        error: `Log exceeds the ${Math.round(MAX_SUPPORTED_CHARS / (1024 * 1024))} MB worker guard — reduce the capture window and try again.`,
      });
      return;
    }

    // UTF-8 byte size is computed here (TextEncoder is available in worker
    // scope) so the main thread never has to re-encode the 20 MB string.
    const byteSize = new TextEncoder().encode(message.text).length;
    const result = analyzeDebugLog(message.text, { byteSize });

    ctx.postMessage({ id: message.id, ok: true, result });
  } catch (error) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
