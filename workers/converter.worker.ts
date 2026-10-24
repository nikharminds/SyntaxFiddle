import {
  parseCsv,
  parseExcel,
  parseJsonTable,
  parseSqlInserts,
  parseXmlTable,
} from "../lib/converter/parsers";
import { generateExcelBase64 } from "../lib/converter/generators";
import { runConversion } from "../lib/converter/generators";
import type { ParsedTable } from "../lib/converter/types";
import type {
  ConverterWorkerRequest,
  ConverterWorkerResponse,
} from "../lib/converter/protocol";

let cacheKey: number | null = null;
let cache: ParsedTable | null = null;

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<ConverterWorkerRequest>) => void) | null;
  postMessage(message: ConverterWorkerResponse): void;
};

ctx.onmessage = async (event: MessageEvent<ConverterWorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === "parse-csv") {
      const table = await parseCsv(message.text);
      table.fileName = message.fileName;
      cache = table;
      cacheKey = message.id;
      ctx.postMessage({ id: message.id, ok: true, kind: "parse", table, tableId: message.id });
      return;
    }
    if (message.type === "parse-json") {
      const table = parseJsonTable(message.text);
      table.fileName = message.fileName;
      cache = table;
      cacheKey = message.id;
      ctx.postMessage({ id: message.id, ok: true, kind: "parse", table, tableId: message.id });
      return;
    }
    if (message.type === "parse-sql") {
      const table = parseSqlInserts(message.text);
      table.fileName = message.fileName;
      cache = table;
      cacheKey = message.id;
      ctx.postMessage({ id: message.id, ok: true, kind: "parse", table, tableId: message.id });
      return;
    }
    if (message.type === "parse-xml") {
      const table = parseXmlTable(message.text);
      table.fileName = message.fileName;
      cache = table;
      cacheKey = message.id;
      ctx.postMessage({ id: message.id, ok: true, kind: "parse", table, tableId: message.id });
      return;
    }
    if (message.type === "parse-excel") {
      const table = await parseExcel(message.buffer);
      table.fileName = message.fileName;
      cache = table;
      cacheKey = message.id;
      ctx.postMessage({ id: message.id, ok: true, kind: "parse", table, tableId: message.id });
      return;
    }
    let table: ParsedTable | null = null;
    if (message.tableId !== null && message.tableId === cacheKey) {
      table = cache;
    }
    if (!table) {
      table = message.table ?? cache;
      cache = table;
      cacheKey = message.tableId;
    }
    if (!table) {
      throw new Error("Parsed table is no longer available — run the conversion again");
    }
    const output = runConversion(table, message.request);
    const binary =
      message.request.target === "excel"
        ? {
            mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            base64: generateExcelBase64(table),
            filename: "syntaxfiddle-output.xlsx",
          }
        : undefined;
    ctx.postMessage({ id: message.id, ok: true, kind: "generate", output, binary });
  } catch (error) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
