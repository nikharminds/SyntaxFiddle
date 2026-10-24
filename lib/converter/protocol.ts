import type { CsvOptions, MarkdownOptions, ParsedTable, SoqlOptions, SqlOptions, TargetFormat, XmlOptions } from "./types";

export type GenerateRequest =
  | { target: "sql"; options: SqlOptions }
  | { target: "json"; options: { minified?: boolean } }
  | { target: "soql-in"; options: SoqlOptions }
  | { target: "xml"; options: XmlOptions }
  | { target: "csv"; options: CsvOptions }
  | { target: "markdown"; options: MarkdownOptions }
  | { target: "yaml"; options: Record<string, never> }
  | { target: "excel"; options: Record<string, never> };

export type TextParseFormat = "csv" | "json" | "sql" | "xml";

export interface ConverterBinary {
  mime: string;
  base64: string;
  filename: string;
}

export type ConverterWorkerRequest =
  | { id: number; type: "parse-csv"; text: string; fileName?: string }
  | { id: number; type: "parse-json"; text: string; fileName?: string }
  | { id: number; type: "parse-sql"; text: string; fileName?: string }
  | { id: number; type: "parse-xml"; text: string; fileName?: string }
  | { id: number; type: "parse-excel"; buffer: ArrayBuffer; fileName?: string }
  | {
      id: number;
      type: "generate";
      tableId: number | null;
      table?: ParsedTable;
      request: GenerateRequest;
    };

export type ConverterWorkerResponse =
  | { id: number; ok: true; kind: "parse"; table: ParsedTable; tableId: number }
  | { id: number; ok: true; kind: "generate"; output: string; binary?: ConverterBinary }
  | { id: number; ok: false; error: string };

export type { ParsedTable, SoqlOptions, SqlOptions, TargetFormat, XmlOptions, CsvOptions, MarkdownOptions };
