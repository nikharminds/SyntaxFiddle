import type { GenerateRequest } from "./protocol";
import type { ParsedTable, SoqlOptions, SqlOptions, XmlOptions } from "./types";

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
