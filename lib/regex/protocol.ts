import type { RegexMatch, RegexRunResult } from "./engine";

export interface RegexWorkerRequest {
  id: number;
  pattern: string;
  flags: string;
  testString: string;
}

export type RegexWorkerResponse = { id: number } & RegexRunResult;

export type { RegexMatch, RegexRunResult };
