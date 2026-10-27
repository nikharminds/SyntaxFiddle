import type { JsonInferError } from "../json-schema/protocol";

/**
 * Wire protocol for the Apex generator, served by the shared
 * workers/json-infer.worker.ts alongside the schema inference messages.
 */

export interface ApexGenerateOptions {
  rootName: string;
  auraEnabled: boolean;
  includeParse: boolean;
  includeSerialize: boolean;
  /** parse() ships @AuraEnabled(cacheable=true) — callable from @wire. */
  cacheableParse: boolean;
  /** Emit static fromHttpResponse(HttpResponse) delegating to parse(). */
  includeCalloutHelper: boolean;
}

export interface ApexGenerateRequest {
  id: number;
  type: "generate-apex";
  json: string;
  options: ApexGenerateOptions;
}

export type ApexGenerateResponse =
  | {
      id: number;
      ok: true;
      apex: string;
      className: string;
      innerClassCount: number;
      durationMs: number;
      inputBytes: number;
      outputLines: number;
    }
  | {
      id: number;
      ok: false;
      error: JsonInferError;
    };

export const APEX_GENERATE_WATCHDOG_MS = 3_000;
export const APEX_GENERATE_DEBOUNCE_MS = 300;
