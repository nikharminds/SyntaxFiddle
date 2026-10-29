/**
 * Code-generation options shared by every schema target.
 *
 * `keyCasing` controls how JSON keys that are not valid (or not idiomatic)
 * identifiers are emitted. The default, "preserve", keeps the original wire
 * keys verbatim — "client-name": string — so generated types describe exactly
 * what JSON.parse / res.json() returns at runtime. The opt-in "camel" mode
 * renames keys to camelCase and preserves the original mapping (KeyMap const
 * in TypeScript, .transform() in Zod).
 */
export type KeyCasing = "preserve" | "camel";

export interface SchemaOptions {
  keyCasing?: KeyCasing;
}

export const DEFAULT_KEY_CASING: KeyCasing = "preserve";

export function resolveKeyCasing(options?: SchemaOptions): KeyCasing {
  return options?.keyCasing ?? DEFAULT_KEY_CASING;
}
