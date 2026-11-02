import type { DebugLogAnalysis } from "./types";

/**
 * Message contract between the debug-log analyzer workspace and
 * `workers/logParser.worker.ts`. Mirrors the regex/converter/SOQL worker
 * protocols: every request is answered with a matching `{ id, ok }` response.
 */
export interface LogAnalyzerWorkerRequest {
  id: number;
  /** Raw debug-log text. The log never leaves the browser — no API route exists. */
  text: string;
  fileName?: string;
}

export type LogAnalyzerWorkerResponse =
  | { id: number; ok: true; result: DebugLogAnalysis }
  | { id: number; ok: false; error: string };
