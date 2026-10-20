export type SourceFormat = "csv" | "excel";
export type TargetFormat = "sql" | "json" | "soql-in" | "xml";

export interface ParsedTable {
  headers: string[];
  rows: Record<string, any>[];
  rowCount: number;
  fileName?: string;
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
