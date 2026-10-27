import { isIdentifier, toPascalCase } from "../json-schema/casing";

/**
 * Apex naming rules for generated wrapper classes.
 *
 * JSON keys arrive as sanitized camelCase from the shared inferrer
 * (lib/json-schema/infer.ts), which already resolves duplicate keys with
 * numeric suffixes. Here we convert to Apex PascalCase members/classes and
 * mangle anything that would collide with Apex reserved words or shadow
 * common System types (e.g. a property named `class` or `Date`).
 */

/** Apex reserved keywords (case-insensitive match, stored lowercase). */
const APEX_KEYWORDS = new Set([
  "abstract", "activate", "and", "any", "array", "as", "asc", "autonomous",
  "begin", "blob", "break", "bulk", "by", "byte", "case", "cast", "catch",
  "char", "class", "collect", "commit", "const", "continue",
  "convertcurrency", "decimal", "default", "delete", "desc", "do", "else",
  "end", "enum", "exception", "exit", "export", "extends", "false",
  "final", "finally", "float", "for", "from", "future", "global", "group",
  "having", "hint", "if", "implements", "import", "inner", "insert",
  "instanceof", "interface", "into", "int", "join", "like", "limit",
  "list", "long", "loop", "map", "merge", "new", "not", "null", "nulls",
  "number", "object", "of", "on", "or", "outer", "override", "package",
  "parallel", "pragma", "private", "protected", "public", "retrieve",
  "return", "returning", "rollback", "savepoint", "search", "select",
  "set", "short", "sort", "stat", "static", "super", "switch",
  "synchronized", "system", "testmethod", "then", "this", "throw",
  "today", "tolabel", "tomorrow", "transaction", "trigger", "true",
  "try", "type", "undelete", "update", "upsert", "using", "virtual",
  "webservice", "when", "where", "while", "yesterday",
]);

/**
 * System / built-in type names that a generated member or inner class must
 * not shadow (case-insensitive match, stored lowercase). `id` is
 * intentionally excluded — `public String Id` is idiomatic in Apex
 * wrappers and shadows nothing dangerous.
 */
const APEX_SYSTEM_TYPES = new Set([
  "schema", "test", "database", "json", "xml", "math", "date", "datetime",
  "time", "integer", "long", "double", "boolean", "string", "blob",
  "exception", "url", "sobject", "page", "apexpages", "messaging",
  "restcontext", "restrequest", "restresponse", "http", "httprequest",
  "httpresponse", "encodingutil", "crypto", "userinfo", "flexqueue",
]);

export function isApexReservedWord(name: string): boolean {
  return APEX_KEYWORDS.has(name.toLowerCase());
}

export function isApexSystemTypeName(name: string): boolean {
  return APEX_SYSTEM_TYPES.has(name.toLowerCase());
}

/**
 * PascalCase base name for a JSON key. Empty/unsafe keys (pure symbols,
 * leading digits) fall back to a `Field…` prefix so the identifier is
 * always valid Apex.
 */
function baseName(key: string): string {
  let name = toPascalCase(key);
  if (name === "") name = "Field";
  if (/^[0-9]/.test(name)) name = `Field${name}`;
  return name;
}

function mangle(name: string): string {
  if (isApexReservedWord(name) || isApexSystemTypeName(name)) {
    return `${name}X`;
  }
  return name;
}

/**
 * Apex-safe class name for a JSON key (e.g. `replicas` → `Replicas`).
 * Unlike member names, class names also avoid system type names — an
 * inner class named `Date` or `Test` shadowing System classes is
 * compile- and review-risk, and classes are never key-matched by the
 * JSON deserializer, so the X suffix costs nothing here.
 */
export function apexClassName(key: string): string {
  return mangle(baseName(key));
}

/**
 * Apex-safe member name for a JSON key.
 *
 * Two rules:
 * 1. The original key is preserved verbatim whenever it is a valid,
 *    unreserved identifier — Apex matches JSON keys to members
 *    case-insensitively, so preserved casing keeps parse() working AND
 *    serialize() lossless.
 * 2. Only true Apex *keywords* force a mangling (a member named `class`
 *    or `int` would not compile). System class names (URL, Date, Test…)
 *    are legal member names — mangling them would silently break
 *    deserialization of common fields like `attributes.url`.
 */
export function apexPropertyName(key: string): string {
  if (isIdentifier(key) && !isApexReservedWord(key)) {
    return key;
  }
  const base = baseName(key);
  return isApexReservedWord(base) ? `${base}X` : base;
}

/**
 * Returns `name`, or `name2`, `name3`, … until it is unused in `used`.
 * Apex identifiers are case-insensitive, so collisions are detected on the
 * lowercased form; `used` stores lowercased names and the original casing
 * is returned untouched.
 */
export function uniqueApexName(name: string, used: Set<string>): string {
  const lower = name.toLowerCase();
  if (!used.has(lower)) {
    used.add(lower);
    return name;
  }
  let suffix = 2;
  while (used.has(`${lower}${suffix}`)) suffix++;
  used.add(`${lower}${suffix}`);
  return `${name}${suffix}`;
}
