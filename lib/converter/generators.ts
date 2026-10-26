import * as XLSX from "xlsx";
import type { GenerateRequest } from "./protocol";
import type {
  CsvOptions,
  MarkdownOptions,
  ParsedTable,
  SoqlOptions,
  SqlOptions,
  XmlOptions,
} from "./types";

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const INTEGER_PATTERN = /^-?\d+$/;
const NUMERIC_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const BOOLEAN_PATTERN = /^(?:true|false)$/i;

type SqlColumnType = "INTEGER" | "NUMERIC" | "BOOLEAN" | "VARCHAR(255)";

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function sqlIdentifier(name: string): string {
  return IDENTIFIER_PATTERN.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

function inferColumnType(values: unknown[]): SqlColumnType {
  const texts = values.map(text).filter((value) => value.length > 0);
  if (texts.length === 0) return "VARCHAR(255)";
  if (texts.every((value) => INTEGER_PATTERN.test(value))) return "INTEGER";
  if (texts.every((value) => NUMERIC_PATTERN.test(value))) return "NUMERIC";
  if (texts.every((value) => BOOLEAN_PATTERN.test(value))) return "BOOLEAN";
  return "VARCHAR(255)";
}

function sqlValue(value: unknown, columnType: SqlColumnType): string {
  const raw = text(value);
  if (raw.length === 0) return "NULL";
  if (columnType === "INTEGER" || columnType === "NUMERIC") return raw;
  if (columnType === "BOOLEAN") return raw.toLowerCase();
  return `'${raw.replace(/'/g, "''")}'`;
}

function escapeSalesforceString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function generateJson(
  table: ParsedTable,
  options?: { minified?: boolean },
): string {
  return options?.minified
    ? JSON.stringify(table.rows)
    : JSON.stringify(table.rows, null, 2);
}

export function generateSql(table: ParsedTable, options: SqlOptions): string {
  const tableRef = sqlIdentifier(options.tableName);
  const batchSize = options.batchSize ?? 500;
  const columnTypes = table.headers.map((header) =>
    inferColumnType(table.rows.map((row) => row[header])),
  );

  const lines: string[] = [];
  if (options.dropTable) {
    lines.push(`DROP TABLE IF EXISTS ${tableRef};`, "");
  }
  lines.push(`CREATE TABLE ${tableRef} (`);
  lines.push(
    table.headers
      .map((header, index) => `  ${sqlIdentifier(header)} ${columnTypes[index]}`)
      .join(",\n"),
  );
  lines.push(");");

  if (table.rows.length > 0) {
    const columnList = table.headers.map(sqlIdentifier).join(", ");
    for (let start = 0; start < table.rows.length; start += batchSize) {
      const chunk = table.rows.slice(start, start + batchSize);
      const valueRows = chunk.map(
        (row) =>
          `  (${table.headers
            .map((header, index) => sqlValue(row[header], columnTypes[index]!))
            .join(", ")})`,
      );
      lines.push("", `INSERT INTO ${tableRef} (${columnList}) VALUES`);
      lines.push(`${valueRows.join(",\n")};`);
    }
  }

  return lines.join("\n");
}

export function generateSoqlIn(table: ParsedTable, options: SoqlOptions): string {
  const chunkSize = options.chunkSize ?? 200;
  const uniqueValues = [
    ...new Set(
      table.rows
        .map((row) => text(row[options.selectedColumn]))
        .filter((value) => value.length > 0),
    ),
  ];

  if (uniqueValues.length === 0) {
    return `// Column "${options.selectedColumn}" contains no non-empty values`;
  }

  const quoted = uniqueValues.map((value) => `'${escapeSalesforceString(value)}'`);
  if (uniqueValues.length <= chunkSize) {
    return `${options.targetField} IN (${quoted.join(", ")})`;
  }

  const chunks: string[][] = [];
  for (let start = 0; start < quoted.length; start += chunkSize) {
    chunks.push(quoted.slice(start, start + chunkSize));
  }

  const parts: string[] = [
    `// ${uniqueValues.length} unique values split into ${chunks.length} chunks of <= ${chunkSize} (Salesforce IN-clause best practice)`,
  ];
  chunks.forEach((chunk, index) => {
    parts.push("", `// Chunk ${index + 1} of ${chunks.length}`);
    parts.push(
      `${index === 0 ? "" : "OR "}${options.targetField} IN (${chunk.join(", ")})`,
    );
  });
  return parts.join("\n");
}

export function generateCsv(table: ParsedTable, options?: CsvOptions): string {
  const delimiter = options?.delimiter ?? ",";
  const quote = (value: unknown): string => {
    const text =
      value === null || value === undefined ? "" : String(value);
    if (
      text.includes(delimiter) ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r") ||
      text !== text.trim()
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [table.headers.map(quote).join(delimiter)];
  for (const row of table.rows) {
    lines.push(table.headers.map((header) => quote(row[header])).join(delimiter));
  }
  return lines.join("\n");
}

function isNumericText(value: string): boolean {
  return /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value);
}

export function generateMarkdown(table: ParsedTable, options?: MarkdownOptions): string {
  const alignNumbers = options?.alignNumbers ?? true;
  const escapeCell = (value: unknown): string => {
    const text = value === null || value === undefined ? "" : String(value);
    return text.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  };

  const alignments = table.headers.map((header) => {
    if (!alignNumbers) return "left";
    const values = table.rows
      .map((row) => String(row[header] ?? ""))
      .filter((value) => value.length > 0);
    if (values.length === 0) return "left";
    return values.every(isNumericText) ? "right" : "left";
  });

  const lines: string[] = [
    `| ${table.headers.map(escapeCell).join(" | ")} |`,
    `| ${alignments.map((align) => (align === "right" ? "---:" : "---")).join(" | ")} |`,
  ];
  for (const row of table.rows) {
    lines.push(`| ${table.headers.map((header) => escapeCell(row[header])).join(" | ")} |`);
  }
  return lines.join("\n");
}

const YAML_PLAIN_SAFE = /^[A-Za-z_][A-Za-z0-9_.\-/ ]*$/;
const YAML_AMBIGUOUS =
  /^(?:true|false|yes|no|on|off|null|~|-|\?|:|\d|\+|\.|'|"|[[{]&|.*[:#][\s&*!|>%@`]|.*\s$|.*^\s)/s;

function yamlStringScalar(text: string): string {
  if (text === "") return '""';
  return YAML_AMBIGUOUS.test(text) || !YAML_PLAIN_SAFE.test(text)
    ? JSON.stringify(text)
    : text;
}

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined || String(value) === "") return '""';
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return yamlStringScalar(String(value));
}

/** Quotes mapping keys that YAML would misread as indicators or scalars. */
function yamlKey(key: string): string {
  return YAML_AMBIGUOUS.test(key) || !YAML_PLAIN_SAFE.test(key)
    ? JSON.stringify(key)
    : key;
}

/**
 * Scalar rendering for values that already carry JSON semantics: null stays
 * null (the honest translation) instead of collapsing into "".
 */
function yamlJsonScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return yamlStringScalar(value);
  return JSON.stringify(value);
}

function isEmptyCollection(value: object): boolean {
  return Array.isArray(value)
    ? value.length === 0
    : Object.keys(value).length === 0;
}

/**
 * Renders a parsed JSON tree as block-style YAML lines at the given indent.
 * Nested objects become nested mappings, arrays become block sequences, and
 * the first child of a sequence item is folded onto the "- " line.
 */
function renderYamlNode(value: unknown, indent: number): string[] {
  const pad = " ".repeat(indent);
  if (value === null || typeof value !== "object") {
    return [`${pad}${yamlJsonScalar(value)}`];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    const lines: string[] = [];
    for (const item of value) {
      if (item === null || typeof item !== "object") {
        lines.push(`${pad}- ${yamlJsonScalar(item)}`);
        continue;
      }
      if (isEmptyCollection(item)) {
        lines.push(`${pad}- ${Array.isArray(item) ? "[]" : "{}"}`);
        continue;
      }
      const rendered = renderYamlNode(item, indent + 2);
      rendered[0] = `${pad}- ${rendered[0]!.slice(indent + 2)}`;
      lines.push(...rendered);
    }
    return lines;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return [`${pad}{}`];
  const lines: string[] = [];
  for (const [rawKey, child] of entries) {
    const key = yamlKey(rawKey);
    if (child === null || typeof child !== "object") {
      lines.push(`${pad}${key}: ${yamlJsonScalar(child)}`);
      continue;
    }
    if (isEmptyCollection(child)) {
      lines.push(`${pad}${key}: ${Array.isArray(child) ? "[]" : "{}"}`);
      continue;
    }
    lines.push(`${pad}${key}:`);
    lines.push(...renderYamlNode(child, indent + 2));
  }
  return lines;
}

/** Converts a parsed JSON value to block-style YAML, preserving structure. */
export function generateYamlFromJson(value: unknown): string {
  return renderYamlNode(value, 0).join("\n");
}

export function generateYaml(table: ParsedTable): string {
  if (table.rows.length === 0) return "[]";
  // Object-shaped JSON keeps its tree: nested maps and sequences instead of
  // dot-path flattening. Tabular shapes (array of arrays, object of column
  // arrays) carry no sourceJson and convert through the row path below.
  if (table.sourceJson !== undefined) {
    return generateYamlFromJson(table.sourceJson);
  }
  const lines: string[] = [];
  for (const row of table.rows) {
    const [firstHeader, ...restHeaders] = table.headers;
    if (firstHeader !== undefined) {
      lines.push(`- ${yamlKey(firstHeader)}: ${yamlScalar(row[firstHeader])}`);
    }
    for (const header of restHeaders) {
      lines.push(`  ${yamlKey(header)}: ${yamlScalar(row[header])}`);
    }
  }
  return lines.join("\n");
}

/**
 * Generates a real .xlsx workbook (base64-encoded) with typed cells:
 * numbers, booleans, and strings keep their types; nulls become empty cells.
 * Column widths are sized to content (capped at 40 chars).
 */
export function generateExcelBase64(table: ParsedTable): string {
  const aoa: unknown[][] = [
    table.headers,
    ...table.rows.map((row) => table.headers.map((header) => row[header] ?? null)),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = table.headers.map((header) => {
    let width = String(header).length;
    for (const row of table.rows) {
      const value = row[header];
      if (value !== null && value !== undefined) {
        width = Math.max(width, String(value).length);
      }
    }
    return { wch: Math.min(Math.max(width + 2, 8), 40) };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return XLSX.write(workbook, { bookType: "xlsx", type: "base64" }) as string;
}

export function runConversion(table: ParsedTable, request: GenerateRequest): string {
  switch (request.target) {
    case "sql":
      return generateSql(table, request.options);
    case "json":
      return generateJson(table, request.options);
    case "soql-in":
      return generateSoqlIn(table, request.options);
    case "xml":
      return generateXml(table, request.options);
    case "csv":
      return generateCsv(table, request.options);
    case "markdown":
      return generateMarkdown(table, request.options);
    case "excel":
      return generateCsv(table);
    case "yaml":
      return generateYaml(table);
  }
}

const XML_TAG_START_PATTERN = /^[A-Za-z_]/;

function xmlSafeTag(name: string): string {
  const cleaned = name.trim().replace(/[^A-Za-z0-9_.-]/g, "_");
  return XML_TAG_START_PATTERN.test(cleaned) ? cleaned : `_${cleaned}`;
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
}

export function generateXml(table: ParsedTable, options: XmlOptions): string {
  const rootTag = xmlSafeTag(options.rootElement || "root");
  const rowTag = xmlSafeTag(options.rowElement || "row");
  const tags = table.headers.map(xmlSafeTag);
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', `<${rootTag}>`];
  table.rows.forEach((row) => {
    lines.push(`  <${rowTag}>`);
    table.headers.forEach((header, index) => {
      const tag = tags[index]!;
      const value = row[header];
      if (value === null || value === undefined || String(value).length === 0) {
        lines.push(`    <${tag} />`);
      } else {
        lines.push(`    <${tag}>${escapeXmlText(String(value))}</${tag}>`);
      }
    });
    lines.push(`  </${rowTag}>`);
  });
  lines.push(`</${rootTag}>`);
  return lines.join("\n");
}
