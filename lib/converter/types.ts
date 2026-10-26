export type SourceFormat = "csv" | "excel" | "json" | "sql" | "xml";
export type TargetFormat = "sql" | "json" | "soql-in" | "xml" | "csv" | "markdown" | "yaml" | "excel";

export interface ParsedTable {
  headers: string[];
  rows: Record<string, any>[];
  rowCount: number;
  fileName?: string;
  /**
   * The original parsed JSON value, set only when the input shape preserves
   * object structure (an array of objects or a single object). Tree-aware
   * targets such as YAML use it to keep nesting intact instead of flattening
   * to dot-path columns; tabular shapes (arrays of arrays, objects of column
   * arrays, CSV, Excel, SQL, XML) never set it.
   */
  sourceJson?: unknown;
}

export interface SqlOptions {
  tableName: string;
  dropTable: boolean;
  batchSize?: number;
}

export interface SoqlOptions {
  targetField: string;
  selectedColumn: string;
  chunkSize?: number;
}

export interface XmlOptions {
  rootElement: string;
  rowElement: string;
}

export type CsvDelimiter = "," | ";" | "\t" | "|";

export interface CsvOptions {
  delimiter: CsvDelimiter;
}

export interface MarkdownOptions {
  alignNumbers: boolean;
}
