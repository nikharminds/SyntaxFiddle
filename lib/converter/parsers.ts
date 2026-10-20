import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ConverterError } from "./errors";
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
