"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  Braces,
  Database,
  Eraser,
  FileCode2,
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

const SAMPLE_SPREADSHEET_ROWS: (string | number | boolean)[][] = [
  ["Id", "Name", "Industry", "Employees", "IsActive", "Website"],
  ["001xx000003DGA2AA4", "Acme Manufacturing", "Manufacturing", 1500, true, "acme.example.com"],
  ["001xx000003DGA3AA5", "Globex Corp", "Logistics", 4200, true, "globex.example.com"],
  ["001xx000003DGA4AA6", "Initech Solutions", "Technology", 85, false, ""],
  ["001xx000003DGA5AA7", "Umbrella Health", "Healthcare", 23000, true, "umbrella.example.com"],
];

const SAMPLE_JSON = JSON.stringify(
  [
    {
      Id: "001xx000003DGA2AA4",
      Name: "Acme Manufacturing",
      Industry: "Manufacturing",
      Employees: 1500,
      IsActive: true,
      Website: "acme.example.com",
    },
    {
      Id: "001xx000003DGA3AA5",
      Name: "Globex Corp",
      Industry: "Logistics",
      Employees: 4200,
      IsActive: true,
      Website: "globex.example.com",
    },
    {
      Id: "001xx000003DGA4AA6",
      Name: "Initech Solutions",
      Industry: "Technology",
      Employees: 85,
      IsActive: false,
      Website: "",
    },
  ],
  null,
  2,
);

const SAMPLE_SQL = `INSERT INTO accounts (Id, Name, Industry, Employees, IsActive, Website) VALUES
  ('001xx000003DGA2AA4', 'Acme Manufacturing', 'Manufacturing', 1500, true, 'acme.example.com'),
  ('001xx000003DGA3AA5', 'Globex Corp', 'Logistics', 4200, true, 'globex.example.com'),
  ('001xx000003DGA4AA6', 'Initech Solutions', 'Technology', 85, false, '');`;

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<accounts>
  <account>
    <Id>001xx000003DGA2AA4</Id>
    <Name>Acme Manufacturing</Name>
    <Industry>Manufacturing</Industry>
    <Employees>1500</Employees>
    <IsActive>true</IsActive>
    <Website>acme.example.com</Website>
  </account>
  <account>
    <Id>001xx000003DGA3AA5</Id>
    <Name>Globex Corp</Name>
    <Industry>Logistics</Industry>
    <Employees>4200</Employees>
    <IsActive>true</IsActive>
    <Website>globex.example.com</Website>
  </account>
</accounts>`;

const SAMPLE_TEXT_BY_SOURCE: Record<
  "csv" | "json" | "sql" | "xml",
  { text: string; filename: string }
> = {
  csv: { text: SAMPLE_CSV, filename: "sample-accounts.csv" },
  json: { text: SAMPLE_JSON, filename: "sample-accounts.json" },
  sql: { text: SAMPLE_SQL, filename: "sample-accounts.sql" },
  xml: { text: SAMPLE_XML, filename: "sample-accounts.xml" },
};

function buildSampleWorkbook(): File {
  const sheet = XLSX.utils.aoa_to_sheet(SAMPLE_SPREADSHEET_ROWS);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Accounts");
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new File([bytes], "sample-accounts.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

const TARGET_OPTIONS: { value: TargetFormat; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "soql-in", label: "Salesforce SOQL IN Clause" },
  { value: "xml", label: "XML" },
  { value: "csv", label: "CSV" },
  { value: "markdown", label: "Markdown Table" },
  { value: "yaml", label: "YAML" },
  { value: "excel", label: "Excel (.xlsx)" },
];

const DEFAULT_OPTIONS: ConverterOptionsState = {
  tableName: "imported_data",
  dropTable: true,
  minified: false,
  soqlColumn: "",
  soqlField: "Id",
  xmlRoot: "root",
  xmlRow: "row",
  csvDelimiter: ",",
  markdownAlign: true,
};

const PASTE_FORMAT_BY_SOURCE: Record<
  "csv" | "json" | "sql" | "xml",
  "csv" | "json" | "sql" | "xml"
> = {
  csv: "csv",
  json: "json",
  sql: "sql",
  xml: "xml",
};

const PLACEHOLDERS: Record<"csv" | "json" | "sql", string> = {
  csv: "Paste CSV or TSV text here — delimiters (, ; tab |) are detected automatically.\n\nOr drop a .csv / .tsv / .txt file onto this pane.",
  json: 'Paste JSON here — an array of objects, a single object, an array of arrays,\nor an object of column arrays. Nested objects are flattened with dot paths.\n\nExample:\n[{"name": "Ada", "role": "admin"}]',
  sql: "Paste INSERT INTO ... VALUES statements here — multi-row tuples and\nmultiple statements are merged into one table.\n\nExample:\nINSERT INTO users (id, name) VALUES (1, 'Ada'), (2, 'Grace');",
};

const SOURCE_BADGES: Record<SourceFormat, string> = {
  csv: "CSV text",
  excel: "Excel file",
  json: "JSON text",
  sql: "SQL INSERTs",
  xml: "XML document",
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
    case "csv":
      return { target, options: { delimiter: options.csvDelimiter } };
    case "markdown":
      return { target, options: { alignNumbers: options.markdownAlign } };
    case "yaml":
      return { target, options: {} };
    case "excel":
      return { target, options: {} };
  }
}

export type ConverterLayoutProps = {
  initialSource?: SourceFormat;
  initialTarget?: TargetFormat;
  initialText?: string;
  initialOptions?: Partial<ConverterOptionsState>;
};

export function ConverterLayout({
  initialSource = "csv",
  initialTarget = "json",
  initialText = "",
  initialOptions,
}: ConverterLayoutProps) {
  const converter = useConverter();
  const [source, setSource] = React.useState<SourceFormat>(initialSource);
  const [target, setTarget] = React.useState<TargetFormat>(initialTarget);
  const [csvText, setCsvText] = React.useState(initialText);
  const [file, setFile] = React.useState<File | null>(null);
  const [options, setOptions] = React.useState<ConverterOptionsState>({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  });

  const busy = converter.status === "parsing" || converter.status === "generating";
  const isPasteSource = source !== "excel";
  const canRun =
    !busy && (isPasteSource ? csvText.trim().length > 0 : file !== null);

  const onOptionsChange = React.useCallback((patch: Partial<ConverterOptionsState>) => {
    setOptions((current) => ({ ...current, ...patch }));
  }, []);

  React.useEffect(() => {
    if (source === "excel") return;
    if (csvText.trim().length === 0) return;
    const timer = window.setTimeout(() => {
      void converter.parseText(csvText, undefined, {
        silent: true,
        format: PASTE_FORMAT_BY_SOURCE[source as "csv" | "json" | "sql" | "xml"],
      });
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
    if (next !== "excel") setFile(null);
  };

  const onCsvTextChange = (text: string) => {
    setCsvText(text);
  };

  const onCsvFileDrop = async (dropped: File) => {
    const text = await dropped.text();
    setCsvText(text);
    await converter.parseText(text, dropped.name, {
      format: PASTE_FORMAT_BY_SOURCE[source as "csv" | "json" | "sql" | "xml"],
    });
  };

  const onFileChange = (selected: File) => {
    setFile(selected);
    void converter.parseFile(selected);
  };

  const onRun = () => {
    if (source !== "excel") {
      void converter.parseText(csvText, undefined, {
        format: PASTE_FORMAT_BY_SOURCE[source as "csv" | "json" | "sql" | "xml"],
      });
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
    if (source === "excel") {
      const workbook = buildSampleWorkbook();
      setFile(workbook);
      void converter.parseFile(workbook);
      return;
    }
    const sample = SAMPLE_TEXT_BY_SOURCE[source];
    setCsvText(sample.text);
    void converter.parseText(sample.text, sample.filename, {
      format: PASTE_FORMAT_BY_SOURCE[source],
    });
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
                  { value: "csv", label: "CSV", icon: FileText },
                  { value: "excel", label: "Excel", icon: FileSpreadsheet },
                  { value: "json", label: "JSON", icon: Braces },
                  { value: "sql", label: "SQL", icon: Database },
                  { value: "xml", label: "XML", icon: FileCode2 },
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
          binary={converter.binary}
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
