import { parseCurl } from "./parser";
import type { ParsedCurlRequest } from "./parser";
import { generateFetch } from "./generators/fetch";
import { generateAxios } from "./generators/axios";
import { generatePython } from "./generators/python";
import { generatePhp } from "./generators/php";
import { generateGo } from "./generators/go";
import { generateCsharp } from "./generators/csharp";
import { generateJava } from "./generators/java";
import { generateApex } from "./generators/apex";

export type TranspileTarget =
  | "fetch"
  | "axios"
  | "python"
  | "php"
  | "go"
  | "csharp"
  | "java"
  | "apex";

export { parseCurl, CurlParseError, isCurlParseError } from "./parser";
export type { ParsedCurlRequest } from "./parser";
export { generateFetch } from "./generators/fetch";
export { generateAxios } from "./generators/axios";
export { generatePython } from "./generators/python";
export { generatePhp } from "./generators/php";
export { generateGo } from "./generators/go";
export { generateCsharp } from "./generators/csharp";
export { generateJava } from "./generators/java";
export { generateApex } from "./generators/apex";

const GENERATORS: Record<TranspileTarget, (request: ParsedCurlRequest) => string> = {
  fetch: generateFetch,
  axios: generateAxios,
  python: generatePython,
  php: generatePhp,
  go: generateGo,
  csharp: generateCsharp,
  java: generateJava,
  apex: generateApex,
};

export function transpileCurl(curlCommand: string, target: TranspileTarget): string {
  const generator = GENERATORS[target];
  if (!generator) {
    throw new Error(
      `Unsupported transpile target "${String(target)}". Expected one of: fetch, axios, python, php, go, csharp, java, apex.`,
    );
  }
  return generator(parseCurl(curlCommand));
}
