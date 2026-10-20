"use client";

import * as React from "react";
import {
  AlertCircle,
  Eraser,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Loader2,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { InputPane } from "./InputPane";
import { OutputPane, type ConverterOptionsState } from "./OutputPane";
import { useConverter } from "@/hooks/useConverter";
import type { GenerateRequest } from "@/lib/converter/protocol";
import type { ParsedTable, SourceFormat, TargetFormat } from "@/lib/converter/types";
import { cn } from "@/lib/utils";

const SAMPLE_CSV = `Id,Name,Industry,Employees,IsActive,Website
001xx000003DGA2AA4,Acme Manufacturing,Manufacturing,1500,true,acme.example.com
001xx000003DGA3AA5,"Globex Corp",Logistics,4200,true,globex.example.com
001xx000003DGA4AA6,Initech Solutions,Technology,85,false,
001xx000003DGA5AA7,"O'Reilly Media",Publishing,610,true,oreilly.example.com
001xx000003DGA6AA8,Umbrella Health,Healthcare,23000,true,umbrella.example.com
001xx000003DGA7AA9,"Wonka Industries, Ltd.",Food and Beverage,512,false,wonka.example.com
001xx000003DGA8AA,"Hooli Cloud",Technology,975,true,hooli.example.com
001xx000003DGA9AB,Strickland Propane,Energy,44,false,strickland.example.com`;

const TARGET_OPTIONS: { value: TargetFormat; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "soql-in", label: "Salesforce SOQL IN Clause" },
  { value: "xml", label: "XML" },
];

const DEFAULT_OPTIONS: ConverterOptionsState = {
  tableName: "imported_data",
  dropTable: true,
  minified: false,
  soqlColumn: "",
  soqlField: "Id",
  xmlRoot: "root",
  xmlRow: "row",
};

function buildRequest(
  target: TargetFormat,
  options: ConverterOptionsState,
  table: ParsedTable | null,
): GenerateRequest {
  switch (target) {
    case "sql":
      return {
        target,
        options: {
          tableName: options.tableName.trim() || "imported_data",
          dropTable: options.dropTable,
        },
      };
    case "json":
      return { target, options: { minified: options.minified } };
    case "soql-in":
      return {
        target,
        options: {
          selectedColumn: options.soqlColumn || table?.headers[0] || "",
          targetField: options.soqlField.trim() || "Id",
        },
      };
    case "xml":
      return {
        target,
        options: {
          rootElement: options.xmlRoot.trim() || "root",
          rowElement: options.xmlRow.trim() || "row",
        },
      };
  }
}

export type ConverterLayoutProps = {
  initialSource?: SourceFormat;
  initialTarget?: TargetFormat;
};

export function ConverterLayout({
  initialSource = "csv",
  initialTarget = "json",
}: ConverterLayoutProps) {
  const converter = useConverter();
  const [source, setSource] = React.useState<SourceFormat>(initialSource);
  const [target, setTarget] = React.useState<TargetFormat>(initialTarget);
  const [csvText, setCsvText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [options, setOptions] = React.useState<ConverterOptionsState>(DEFAULT_OPTIONS);

  const busy = converter.status === "parsing" || converter.status === "generating";
  const canRun =
    !busy && (source === "csv" ? csvText.trim().length > 0 : file !== null);

  const onOptionsChange = React.useCallback((patch: Partial<ConverterOptionsState>) => {
    setOptions((current) => ({ ...current, ...patch }));
  }, []);

  React.useEffect(() => {
    if (source !== "csv") return;
    if (csvText.trim().length === 0) return;
    const timer = window.setTimeout(() => {
      void converter.parseText(csvText, undefined, { silent: true });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [csvText, source, converter.parseText]);

  React.useEffect(() => {
    const table = converter.table;
    if (!table) return;
    setOptions((current) => {
      if (table.headers.includes(current.soqlColumn)) return current;
      const fallback = table.headers.includes("Id")
        ? "Id"
        : (table.headers[0] ?? "");
      return { ...current, soqlColumn: fallback };
    });
  }, [converter.table]);

  React.useEffect(() => {
    if (!converter.table) return;
    const timer = window.setTimeout(() => {
      void converter.generate(buildRequest(target, options, converter.table));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [converter.table, converter.generate, target, options]);

  const onSourceChange = (next: SourceFormat) => {
    if (next === source) return;
    setSource(next);
    converter.clear();
    if (next === "csv") setFile(null);
  };

  const onCsvTextChange = (text: string) => {
    setCsvText(text);
  };

  const onCsvFileDrop = async (dropped: File) => {
    const text = await dropped.text();
    setCsvText(text);
    await converter.parseText(text, dropped.name);
  };

  const onFileChange = (selected: File) => {
    setFile(selected);
    void converter.parseFile(selected);
  };

  const onRun = () => {
    if (source === "csv") {
      void converter.parseText(csvText);
    } else if (file) {
      void converter.parseFile(file);
    }
  };

  const onClear = () => {
    setCsvText("");
    setFile(null);
    setOptions(DEFAULT_OPTIONS);
    converter.clear();
  };

  const onLoadSample = () => {
    setSource("csv");
    setCsvText(SAMPLE_CSV);
    void converter.parseText(SAMPLE_CSV, "sample-accounts.csv");
  };

  return (
    <section aria-label="Conversion studio" className="space-y-6">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Source
            </span>
            <div
              role="group"
              aria-label="Input source"
              className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5"
            >
              {(
                [
                  { value: "csv", label: "CSV (Paste / Drop)", icon: FileText },
                  { value: "excel", label: "Excel (.xlsx, .xls)", icon: FileSpreadsheet },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={source === value}
                  onClick={() => onSourceChange(value)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
                    source === value
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Target
            </span>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value as TargetFormat)}
              aria-label="Output format"
              className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs font-medium text-zinc-200 focus:border-emerald-500/50 focus:outline-none"
            >
              {TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <Eraser size={14} />
              Clear
            </button>
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <FlaskConical size={14} />
              Load Sample Data
            </button>
            <button
              type="button"
              onClick={onRun}
              disabled={!canRun}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {busy
                ? converter.status === "parsing"
                  ? "Parsing…"
                  : "Generating…"
                : "Run Conversion"}
            </button>
          </div>
        </div>
      </Card>

      {converter.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-300">Conversion error</p>
            <p className="mt-0.5 text-sm leading-6 text-red-200/80">
              {converter.error}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <InputPane
          source={source}
          csvText={csvText}
          onCsvTextChange={onCsvTextChange}
          onCsvFileDrop={(dropped) => void onCsvFileDrop(dropped)}
          file={file}
          onFileChange={onFileChange}
          status={converter.status}
          table={converter.table}
        />
        <OutputPane
          target={target}
          status={converter.status}
          output={converter.output}
          table={converter.table}
          options={options}
          onOptionsChange={onOptionsChange}
        />
      </div>
    </section>
  );
}
