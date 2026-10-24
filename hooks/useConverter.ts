"use client";

import * as React from "react";
import {
  parseCsv,
  parseExcel,
  parseJsonTable,
  parseSqlInserts,
  parseXmlTable,
} from "@/lib/converter/parsers";
import { generateExcelBase64, runConversion } from "@/lib/converter/generators";
import type { ParsedTable } from "@/lib/converter/types";
import type {
  ConverterWorkerRequest,
  ConverterWorkerResponse,
  ConverterBinary,
  GenerateRequest,
  TextParseFormat,
} from "@/lib/converter/protocol";

export type ConverterStatus = "idle" | "parsing" | "generating" | "ready" | "error";

export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const WORKER_THRESHOLD_BYTES = 1_000_000;
const WORKER_GENERATE_ROW_THRESHOLD = 20_000;
const EXCEL_EXTENSION_PATTERN = /\.(xlsx|xls|xlsm)$/i;

type PendingTask = {
  resolve: (response: ConverterWorkerResponse) => void;
  reject: (error: Error) => void;
};

function decodeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.startsWith("Malformed CSV")) {
    return `${raw} — check for an unclosed quote or an unexpected delimiter on that line.`;
  }
  if (raw.startsWith("Corrupted or unsupported Excel")) {
    return "Corrupted Excel sheet — the workbook could not be opened. Re-save it as .xlsx or .csv and try again.";
  }
  if (raw.startsWith("The pasted CSV")) return raw;
  if (raw.startsWith("File exceeds")) {
    return `${raw} Split the file into smaller chunks and convert them one at a time.`;
  }
  return `Conversion failed: ${raw}`;
}

export function useConverter() {
  const [status, setStatus] = React.useState<ConverterStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [table, setTable] = React.useState<ParsedTable | null>(null);
  const [output, setOutput] = React.useState<string | null>(null);
  const [binary, setBinary] = React.useState<ConverterBinary | null>(null);

  const workerRef = React.useRef<Worker | null>(null);
  const workerFailedRef = React.useRef(false);
  const pendingRef = React.useRef(new Map<number, PendingTask>());
  const idRef = React.useRef(0);
  const runRef = React.useRef(0);
  const workerTableIdRef = React.useRef<number | null>(null);
  const tableRef = React.useRef<ParsedTable | null>(null);

  const ensureWorker = React.useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (workerFailedRef.current) return null;
    try {
      const worker = new Worker(
        new URL("../workers/converter.worker.ts", import.meta.url),
      );
      worker.onmessage = (event: MessageEvent<ConverterWorkerResponse>) => {
        const response = event.data;
        const pending = pendingRef.current.get(response.id);
        pendingRef.current.delete(response.id);
        if (!pending) return;
        if (response.ok) {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.error));
        }
      };
      worker.onerror = () => {
        workerFailedRef.current = true;
        const failure = new Error("The background worker crashed");
        pendingRef.current.forEach((task) => task.reject(failure));
        pendingRef.current.clear();
        worker.terminate();
        workerRef.current = null;
      };
      workerRef.current = worker;
      return worker;
    } catch {
      workerFailedRef.current = true;
      return null;
    }
  }, []);

  React.useEffect(() => {
    const worker = workerRef;
    const pending = pendingRef;
    return () => {
      runRef.current += 1;
      pending.current.forEach((task) => task.reject(new Error("cancelled")));
      pending.current.clear();
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  const callWorker = React.useCallback(
    (build: (id: number) => ConverterWorkerRequest, transfer?: Transferable[]) => {
      const worker = ensureWorker();
      if (!worker) return Promise.reject(new Error("worker-unavailable"));
      const id = ++idRef.current;
      const request = build(id);
      return new Promise<ConverterWorkerResponse>((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject });
        worker.postMessage(request, transfer ?? []);
        window.setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error("Background processing timed out"));
          }
        }, 60_000);
      });
    },
    [ensureWorker],
  );

  const runWithWorkerFallback = React.useCallback(
    async <T,>(workerRequest: () => Promise<T>, main: () => T | Promise<T>): Promise<T> => {
      try {
        return await workerRequest();
      } catch (workerError) {
        const unavailable =
          workerError instanceof Error && workerError.message === "worker-unavailable";
        if (!workerFailedRef.current && !unavailable) throw workerError;
        return await main();
      }
    },
    [],
  );

  const fail = React.useCallback((message: string) => {
    setStatus("error");
    setError(decodeError(new Error(message)));
    setOutput(null);
    setBinary(null);
  }, []);

  const applyTable = React.useCallback((parsed: ParsedTable, workerTableId: number | null) => {
    workerTableIdRef.current = workerTableId;
    tableRef.current = parsed;
    setTable(parsed);
    setOutput(null);
    setBinary(null);
  }, []);

  const parseText = React.useCallback(
    async (
      text: string,
      fileName?: string,
      options?: { silent?: boolean; format?: TextParseFormat },
    ) => {
      const run = ++runRef.current;
      const trimmed = text.trim();
      const format = options?.format ?? "csv";
      if (trimmed.length === 0) {
        if (!options?.silent) {
          fail("The pasted input appears to be empty — paste some content first.");
        }
        return;
      }
      if (text.length > MAX_INPUT_BYTES) {
        if (!options?.silent) {
          fail("File exceeds the 15MB client-side processing cap.");
        }
        return;
      }
      setStatus("parsing");
      setError(null);

      const parseMain = (): ParsedTable | Promise<ParsedTable> => {
        if (format === "json") return parseJsonTable(text);
        if (format === "sql") return parseSqlInserts(text);
        if (format === "xml") return parseXmlTable(text);
        return parseCsv(text);
      };
      const workerType =
        format === "json"
          ? "parse-json"
          : format === "sql"
            ? "parse-sql"
            : format === "xml"
              ? "parse-xml"
              : "parse-csv";

      const useWorker = text.length > WORKER_THRESHOLD_BYTES;
      try {
        let parsed: ParsedTable;
        let workerTableId: number | null = null;
        if (useWorker) {
          const result = await runWithWorkerFallback(
            () =>
              callWorker((id) => ({ id, type: workerType as "parse-csv", text, fileName })) as Promise<
                ConverterWorkerResponse & { ok: true; kind: "parse" }
              >,
            async () => ({
              id: -1,
              ok: true as const,
              kind: "parse" as const,
              table: await parseMain(),
              tableId: null as number | null,
            }),
          );
          parsed = result.table;
          workerTableId = result.tableId ?? null;
        } else {
          parsed = await parseMain();
          parsed.fileName = fileName;
        }
        if (run !== runRef.current) return;
        applyTable(parsed, workerTableId);
      } catch (error) {
        if (run !== runRef.current) return;
        if (options?.silent) {
          setStatus(tableRef.current ? "ready" : "idle");
          return;
        }
        setStatus("error");
        setError(decodeError(error));
      }
    },
    [applyTable, callWorker, fail, runWithWorkerFallback],
  );

  const parseFile = React.useCallback(
    async (file: File) => {
      if (file.size > MAX_INPUT_BYTES) {
        fail("File exceeds the 15MB client-side processing cap.");
        return;
      }
      const isExcel =
        EXCEL_EXTENSION_PATTERN.test(file.name) ||
        file.type.includes("spreadsheet") ||
        file.type.includes("excel");
      if (!isExcel) {
        const text = await file.text();
        await parseText(text, file.name);
        return;
      }
      const run = ++runRef.current;
      setStatus("parsing");
      setError(null);
      const buffer = await file.arrayBuffer();
      const useWorker = file.size > WORKER_THRESHOLD_BYTES;
      try {
        let parsed: ParsedTable;
        let workerTableId: number | null = null;
        if (useWorker) {
          const result = await runWithWorkerFallback(
            () =>
              callWorker(
                (id) => ({ id, type: "parse-excel", buffer, fileName: file.name }),
                [buffer],
              ) as Promise<ConverterWorkerResponse & { ok: true; kind: "parse" }>,
            async () => ({
              id: -1,
              ok: true as const,
              kind: "parse" as const,
              table: await parseExcel(buffer),
              tableId: null as number | null,
            }),
          );
          parsed = result.table;
          workerTableId = result.tableId ?? null;
        } else {
          parsed = await parseExcel(buffer);
          parsed.fileName = file.name;
        }
        if (run !== runRef.current) return;
        applyTable(parsed, workerTableId);
      } catch (error) {
        if (run !== runRef.current) return;
        setStatus("error");
        setError(decodeError(error));
      }
    },
    [applyTable, callWorker, fail, parseText, runWithWorkerFallback],
  );

  const generate = React.useCallback(
    async (request: GenerateRequest) => {
      const currentTable = tableRef.current;
      if (!currentTable) return;
      const run = ++runRef.current;
      setBinary(null);
      setStatus("generating");
      setError(null);
      const useWorker =
        workerTableIdRef.current !== null ||
        currentTable.rows.length > WORKER_GENERATE_ROW_THRESHOLD;
      try {
        let generated: string;
        let workerBinary: ConverterBinary | null = null;
        if (useWorker) {
          const workerTableId = workerTableIdRef.current;
          const result = await runWithWorkerFallback(
            () =>
              callWorker((id) => ({
                id,
                type: "generate",
                tableId: workerTableId,
                table: workerTableId === null ? currentTable : undefined,
                request,
              })) as Promise<ConverterWorkerResponse & { ok: true; kind: "generate" }>,
            async () => ({
              id: -1,
              ok: true as const,
              kind: "generate" as const,
              output: runConversion(currentTable, request),
              binary: undefined,
            }),
          );
          generated = result.output;
          workerBinary = result.binary ?? null;
        } else {
          generated = runConversion(currentTable, request);
        }
        if (run !== runRef.current) return;
        setOutput(generated);
        setBinary(
          request.target === "excel"
            ? workerBinary ?? {
                mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                base64: generateExcelBase64(currentTable),
                filename: "syntaxfiddle-output.xlsx",
              }
            : workerBinary,
        );
        setStatus("ready");
      } catch (error) {
        if (run !== runRef.current) return;
        setStatus("error");
        setError(decodeError(error));
      }
    },
    [callWorker, runWithWorkerFallback],
  );

  const clear = React.useCallback(() => {
    runRef.current += 1;
    workerTableIdRef.current = null;
    tableRef.current = null;
    setStatus("idle");
    setError(null);
    setTable(null);
    setOutput(null);
    setBinary(null);
  }, []);

  return {
    status,
    error,
    table,
    output,
    binary,
    parseText,
    parseFile,
    generate,
    clear,
    fail,
  };
}
