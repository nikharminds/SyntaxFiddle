import type { SchemaTarget } from "./index";

export interface JsonSyntaxDiagnosticDetail {
  message: string;
  line: number | null;
  column: number | null;
}

export type JsonInferError =
  | { kind: "syntax"; detail: JsonSyntaxDiagnosticDetail }
  | { kind: "runtime"; message: string };

export interface JsonInferRequest {
  id: number;
  type: "infer";
  json: string;
  target: SchemaTarget;
  rootName: string;
}

export type JsonInferResponse =
  | {
      id: number;
      ok: true;
      code: string;
      durationMs: number;
      inputBytes: number;
      outputLines: number;
    }
  | {
      id: number;
      ok: false;
      error: JsonInferError;
    };

export const JSON_INFER_WATCHDOG_MS = 3_000;
export const JSON_INFER_DEBOUNCE_MS = 300;
