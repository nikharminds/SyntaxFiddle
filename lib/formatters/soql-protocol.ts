import type { FormatSOQLOptions } from "./soql";

/**
 * Message contract between the SOQL formatter workspace and
 * `workers/soql-worker.ts`. Mirrors the regex/converter worker protocols.
 */
export interface SoqlWorkerRequest {
  id: number;
  query: string;
  options?: FormatSOQLOptions;
}

export type SoqlWorkerResponse =
  | { id: number; ok: true; output: string; durationMs: number }
  | { id: number; ok: false; error: string };
