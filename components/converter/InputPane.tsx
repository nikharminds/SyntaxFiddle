"use client";

import * as React from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ParsedTable, SourceFormat } from "@/lib/converter/types";
import type { ConverterStatus } from "@/hooks/useConverter";
import { cn } from "@/lib/utils";

const CSV_ACCEPT_PATTERN = /\.(csv|tsv|txt)$/i;
const TEXT_ACCEPT_PATTERN = /\.(csv|tsv|txt|json|ndjson|sql|ddl|xml)$/i;

const PLACEHOLDERS: Record<"csv" | "json" | "sql" | "xml", string> = {
  csv: "Paste CSV or TSV text here — delimiters (, ; tab |) are detected automatically.\n\nOr drop a .csv / .tsv / .txt file onto this pane.",
  json: 'Paste JSON here — an array of objects, a single object, an array of arrays,\nor an object of column arrays. Nested objects are flattened with dot paths.\n\nExample:\n[{"name": "Ada", "role": "admin"}]',
  sql: "Paste INSERT INTO ... VALUES statements here — multi-row tuples and\nmultiple statements are merged into one table.\n\nExample:\nINSERT INTO users (id, name) VALUES (1, 'Ada'), (2, 'Grace');",
  xml: 'Paste XML here — the repeated record element (e.g. <book> inside <books>)\nbecomes the table rows, with attributes as @-prefixed columns.\n\nExample:\n<books><book id="1"><title>Ada</title></book></books>', 
};

const PASTE_ARIA: Record<"csv" | "json" | "sql" | "xml", string> = {
  csv: "CSV input",
  json: "JSON input",
  sql: "SQL input",
  xml: "XML input",
};

const SOURCE_BADGES: Record<SourceFormat, string> = {
  csv: "CSV text",
  excel: "Excel file",
  json: "JSON text",
  sql: "SQL INSERTs",
  xml: "XML document",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export type InputPaneProps = {
  source: SourceFormat;
  csvText: string;
  onCsvTextChange: (text: string) => void;
  onCsvFileDrop: (file: File) => void;
  file: File | null;
  onFileChange: (file: File) => void;
  status: ConverterStatus;
  table: ParsedTable | null;
};

export function InputPane({
  source,
  csvText,
  onCsvTextChange,
  onCsvFileDrop,
  file,
  onFileChange,
  status,
  table,
}: InputPaneProps) {
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragDepthRef = React.useRef(0);

  const busy = status === "parsing" || status === "generating";

  const readDroppedFile = (file: File) => {
    if (source !== "excel" && TEXT_ACCEPT_PATTERN.test(file.name)) {
      onCsvFileDrop(file);
    } else {
      onFileChange(file);
    }
  };

  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragging(false);
    }
  };
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) readDroppedFile(dropped);
  };

  return (
    <Card className="relative flex h-full min-h-[520px] flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Input
        </h2>
        <Badge variant="outline">{SOURCE_BADGES[source]}</Badge>
      </div>

      <div
        className="relative mt-4 flex-1"
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {source !== "excel" ? (
          <textarea
            value={csvText}
            onChange={(event) => onCsvTextChange(event.target.value)}
            spellCheck={false}
            aria-label={PASTE_ARIA[source as "csv" | "json" | "sql" | "xml"]}
            placeholder={PLACEHOLDERS[source as "csv" | "json" | "sql" | "xml"]}
            className="h-full min-h-[320px] w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              dragging
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-zinc-800 bg-zinc-950 hover:border-zinc-700",
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              {file ? (
                <FileSpreadsheet size={22} className="text-emerald-400" />
              ) : (
                <Upload size={22} className="text-zinc-500" />
              )}
            </span>
            {file ? (
              <span className="min-w-0">
                <span className="block truncate font-mono text-sm text-zinc-200">
                  {file.name}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {formatBytes(file.size)} — click to replace
                </span>
              </span>
            ) : (
              <span>
                <span className="block text-sm text-zinc-300">
                  Drop a spreadsheet here or click to browse
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Accepts .xlsx, .xls, and .csv — parsed locally, max 15MB
                </span>
              </span>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) onFileChange(selected);
            event.target.value = "";
          }}
        />

        {dragging && source !== "excel" ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-emerald-500/60 bg-zinc-950/90">
            <p className="text-sm font-medium text-emerald-300">
              Drop the file to load it into the editor
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-zinc-800/80 pt-4">
        {busy && !table ? (
          <p className="animate-pulse text-xs text-zinc-500">Parsing input…</p>
        ) : table ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{table.rowCount.toLocaleString()} rows</Badge>
              <Badge variant="info">{table.headers.length} columns</Badge>
              {table.fileName ? (
                <span className="max-w-[200px] truncate font-mono text-xs text-zinc-500">
                  {table.fileName}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Detected columns">
              {table.headers.map((header) => (
                <Badge key={header} variant="outline" className="font-mono">
                  {header}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Parsed columns and row counts appear here after conversion.
          </p>
        )}
      </div>
    </Card>
  );
}
