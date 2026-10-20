import { parseCsv, parseExcel } from "../lib/converter/parsers";
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
    ctx.postMessage({ id: message.id, ok: true, kind: "generate", output });
  } catch (error) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
