import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ConverterError } from "./errors";
import { parseXml } from "../xml-schema/parser";
import type { ParsedTable } from "./types";

function normalizeValue(value: unknown): string | number | boolean {
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function toTable(matrix: unknown[][]): ParsedTable {
  const rawHeaders = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim());
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((header, index) => {
    const base = header.length > 0 ? header : `column_${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });

  const rows: Record<string, any>[] = [];
  for (const row of matrix.slice(1)) {
    const record: Record<string, any> = {};
    let isEmpty = true;
    headers.forEach((header, index) => {
      const value = normalizeValue(row[index]);
      record[header] = value;
      if (value !== "") isEmpty = false;
    });
    if (!isEmpty) rows.push(record);
  }

  return { headers, rows, rowCount: rows.length };
}

export async function parseCsv(rawText: string): Promise<ParsedTable> {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    throw new ConverterError("The pasted CSV appears to be empty");
  }
  const result = Papa.parse<string[]>(trimmed, {
    delimiter: "",
    delimitersToGuess: [",", "\t", ";", "|"],
    skipEmptyLines: "greedy",
  });
  const quotesError = result.errors.find((error) => error.type === "Quotes");
  if (quotesError) {
    throw new ConverterError(
      typeof quotesError.row === "number" && quotesError.row >= 0
        ? `Malformed CSV on line ${quotesError.row + 1}`
        : "Malformed CSV — unmatched quote detected",
    );
  }
  if (result.data.length === 0) {
    throw new ConverterError("The pasted CSV appears to be empty");
  }
  return toTable(result.data);
}

export async function parseExcel(buffer: ArrayBuffer): Promise<ParsedTable> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    throw new ConverterError("Corrupted or unsupported Excel workbook");
  }
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { headers: [], rows: [], rowCount: 0 };
  }
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    return { headers: [], rows: [], rowCount: 0 };
  }
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  return toTable(matrix);
}

function flattenRecord(
  input: Record<string, unknown>,
  prefix: string,
  out: Record<string, string | number | boolean>,
): void {
  for (const [key, value] of Object.entries(input)) {
    const name = prefix.length > 0 ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      out[name] = "";
    } else if (Array.isArray(value)) {
      out[name] = JSON.stringify(value);
    } else if (typeof value === "object") {
      flattenRecord(value as Record<string, unknown>, name, out);
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[name] = value;
    } else {
      out[name] = String(value);
    }
  }
}

/**
 * Parse JSON into a table. Accepted shapes: an array of objects (the
 * canonical form), a single object (one row), an array of arrays (positional
 * columns, first row is the header), and an object of arrays (column to
 * values). Nested objects are flattened with dot paths; arrays serialize to
 * their JSON text.
 */
export function parseJsonTable(rawText: string): ParsedTable {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    throw new ConverterError("The pasted JSON appears to be empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new ConverterError(
      `Invalid JSON — ${error instanceof Error ? error.message : "parse error"}`,
    );
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { headers: [], rows: [], rowCount: 0 };
    }
    if (parsed.every((item) => Array.isArray(item))) {
      return toTable(parsed as unknown[][]);
    }
    if (parsed.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))) {
      const headers: string[] = [];
      const seen = new Set<string>();
      const flatRows = (parsed as Record<string, unknown>[]).map((record) => {
        const flat: Record<string, string | number | boolean> = {};
        flattenRecord(record, "", flat);
        for (const key of Object.keys(flat)) {
          if (!seen.has(key)) {
            seen.add(key);
            headers.push(key);
          }
        }
        return flat;
      });
      const rows = flatRows.map((flat) => {
        const row: Record<string, unknown> = {};
        for (const header of headers) row[header] = flat[header] ?? "";
        return row;
      });
      return { headers, rows, rowCount: rows.length };
    }
    throw new ConverterError(
      "Unsupported JSON shape — expected an array of objects, an array of arrays, or a single object",
    );
  }

  if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, unknown>;
    const arrayEntries = Object.entries(record).filter(([, value]) => Array.isArray(value));
    if (arrayEntries.length > 0 && arrayEntries.length === Object.keys(record).length) {
      // Object of arrays: column -> values.
      const headers = arrayEntries.map(([key]) => key);
      const length = Math.max(...arrayEntries.map(([, value]) => (value as unknown[]).length));
      const rows: Record<string, unknown>[] = [];
      for (let index = 0; index < length; index += 1) {
        const row: Record<string, unknown> = {};
        for (const [key, value] of arrayEntries) {
          const cell = (value as unknown[])[index];
          row[key] =
            cell === null || cell === undefined
              ? ""
              : typeof cell === "object"
                ? JSON.stringify(cell)
                : cell;
        }
        rows.push(row);
      }
      return { headers, rows, rowCount: rows.length };
    }
    const flat: Record<string, string | number | boolean> = {};
    flattenRecord(record, "", flat);
    const headers = Object.keys(flat);
    return { headers, rows: [flat], rowCount: 1 };
  }

  throw new ConverterError(
    "Unsupported JSON shape — expected an array of objects, an array of arrays, or a single object",
  );
}

interface SqlInsertStatement {
  columns: string[] | null;
  rows: string[][];
}

function unquoteIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let current = "";
  for (const char of input) {
    if (inString) {
      current += char;
      if (char === "'") inString = false;
      continue;
    }
    if (char === "'") {
      inString = true;
      current += char;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

function parseSqlValue(raw: string): string | number | boolean {
  const token = raw.trim();
  if (token.length === 0) return "";
  const upper = token.toUpperCase();
  if (upper === "NULL") return "";
  if (upper === "TRUE") return true;
  if (upper === "FALSE") return false;
  if (token.startsWith("'") && token.endsWith("'")) {
    return token.slice(1, -1).replace(/''/g, "'");
  }
  if (/^-?\d+$/.test(token)) return token;
  if (/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) return token;
  return token.replace(/^"|"$/g, "");
}

function scanTuples(body: string, start: number): { rows: string[][]; end: number } | null {
  const rows: string[][] = [];
  let index = start;
  for (;;) {
    while (index < body.length && /\s/.test(body[index]!)) index += 1;
    if (body[index] !== "(") break;
    let depth = 0;
    let inString = false;
    let tuple = "";
    let closed = false;
    while (index < body.length) {
      const char = body[index]!;
      if (inString) {
        tuple += char;
        if (char === "'") inString = false;
      } else if (char === "'") {
        inString = true;
        tuple += char;
      } else if (char === "(") {
        depth += 1;
        if (depth > 1) tuple += char;
      } else if (char === ")") {
        depth -= 1;
        if (depth === 0) {
          closed = true;
          break;
        }
        tuple += char;
      } else {
        tuple += char;
      }
      index += 1;
    }
    if (!closed) break;
    rows.push(splitTopLevel(tuple).map((value) => value.trim()));
    index += 1;
    // Optional comma before the next tuple.
    while (index < body.length && /\s/.test(body[index]!)) index += 1;
    if (body[index] === ",") index += 1;
  }
  if (rows.length === 0) return null;
  return { rows, end: index };
}

/**
 * Parse SQL INSERT statements into a table. Handles multi-row VALUES lists,
 * multiple statements, '' escaping, NULL/TRUE/FALSE literals, and numeric
 * tokens. Statements without a column list inherit positional names from the
 * first row's width.
 */
function findRecordArray(value: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every(
        (item) => item !== null && typeof item === "object" && !Array.isArray(item),
      )
    ) {
      return value as Record<string, unknown>[];
    }
    for (const item of value) {
      const nested = findRecordArray(item);
      if (nested) return nested;
    }
    return null;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const nested = findRecordArray(record[key]);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Extracts tabular rows from an XML document by locating the first repeating
 * record element (depth-first). Records are flattened with dot paths, matching
 * the JSON parser's conventions. Throws when no repeating element exists.
 */
export function parseXmlTable(rawText: string): ParsedTable {
  const parsed = parseXml(rawText);
  if (!parsed.ok) {
    const location =
      parsed.detail.line !== null
        ? ` (line ${parsed.detail.line}, column ${parsed.detail.column ?? 0})`
        : "";
    throw new ConverterError(`${parsed.detail.message}${location}`);
  }
  const records = findRecordArray(parsed.value);
  if (!records) {
    throw new ConverterError(
      "No repeating record element found — the XML must contain a repeated element (such as <book> inside <books>) to form table rows.",
    );
  }
  const rows: Record<string, any>[] = [];
  const headers: string[] = [];
  for (const record of records) {
    const flat: Record<string, any> = {};
    flattenRecord(record, "", flat);
    for (const key of Object.keys(flat)) {
      if (!headers.includes(key)) headers.push(key);
    }
    rows.push(flat);
  }
  return { headers, rows, rowCount: rows.length };
}

export function parseSqlInserts(rawText: string): ParsedTable {
  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    throw new ConverterError("The pasted SQL appears to be empty");
  }
  const insertPattern =
    /insert\s+into\s+("[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$]*)\s*(\(([^()]*(?:\([^()]*\)[^()]*)*)\))?\s*values/gi;
  const statements: SqlInsertStatement[] = [];
  let match: RegExpExecArray | null;
  while ((match = insertPattern.exec(trimmed)) !== null) {
    const columns =
      match[3] !== undefined
        ? splitTopLevel(match[3]).map(unquoteIdentifier)
        : null;
    const tuples = scanTuples(trimmed, match.index + match[0].length);
    if (tuples) {
      statements.push({ columns, rows: tuples.rows });
      insertPattern.lastIndex = tuples.end;
    }
  }

  if (statements.length === 0) {
    throw new ConverterError(
      "No INSERT INTO ... VALUES statements found — the parser reads INSERT statements with literal values",
    );
  }

  let headers: string[] | null = null;
  for (const statement of statements) {
    const width = Math.max(...statement.rows.map((row) => row.length));
    const resolved =
      statement.columns ??
      Array.from({ length: width }, (_, index) => `column_${index + 1}`);
    if (headers === null) {
      headers = resolved;
    } else if (headers.join("\u0000") !== resolved.join("\u0000")) {
      throw new ConverterError(
        "Multiple INSERT statements with different column lists — split them and convert one statement at a time",
      );
    }
  }
  const finalHeaders = headers!;

  const rows: Record<string, unknown>[] = [];
  for (const statement of statements) {
    for (const tuple of statement.rows) {
      const row: Record<string, unknown> = {};
      finalHeaders.forEach((header, index) => {
        row[header] = parseSqlValue(tuple[index] ?? "NULL");
      });
      rows.push(row);
    }
  }

  return { headers: finalHeaders, rows, rowCount: rows.length };
}
