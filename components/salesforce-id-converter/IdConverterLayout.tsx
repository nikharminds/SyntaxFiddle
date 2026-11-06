"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Eraser, FlaskConical, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { useSalesforceIdConverter } from "@/hooks/useSalesforceIdConverter";

const SAMPLE_SINGLE = "0033000001QyXb5";

const SAMPLE_BULK = [
  "0013000001H3sSC",
  "00530000003oJzS",
  "5003000000XkVpS",
  "00Q3000000m4YbE",
  "a0B3000000cD1u2",
  "not-a-valid-id",
].join("\n");

function ObjectChip({ prefix, objectName }: { prefix: string | null; objectName: string | null }) {
  if (!prefix) return null;
  if (objectName) {
    return (
      <Badge variant="success">
        {prefix} → {objectName}
      </Badge>
    );
  }
  return <Badge variant="outline">{prefix} → org-specific prefix</Badge>;
}

export function IdConverterLayout() {
  const { id, setId, bulk, setBulk, single, bulkResults, clearSingle, clearBulk } =
    useSalesforceIdConverter();

  const [tab, setTab] = React.useState("single");

  const validRows = bulkResults.filter((row) => row.valid);
  const invalidRows = bulkResults.filter((row) => !row.valid);
  const copyAllId18 = validRows
    .map((row) => row.id18)
    .filter((value): value is string => value !== null)
    .join("\n");

  return (
    <section aria-label="Salesforce ID converter workspace" className="space-y-4">
      <Tabs
        tabs={[
          { value: "single", label: "Single ID" },
          { value: "bulk", label: "Bulk convert" },
        ]}
        value={tab}
        onValueChange={setTab}
        idPrefix="id-converter"
        aria-label="Converter mode"
      />

      <TabPanel value="single" activeValue={tab} idPrefix="id-converter">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <label htmlFor="sf-id-input" className="sr-only">
              Salesforce record ID
            </label>
            <input
              id="sf-id-input"
              type="text"
              value={id}
              onChange={(event) => setId(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Paste a 15- or 18-character Id (e.g. 0033000001QyXb5)"
              className="h-14 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 font-mono text-base tracking-wide text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none sm:text-lg"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setId(SAMPLE_SINGLE)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                <FlaskConical size={14} />
                Load Sample
              </button>
              <button
                type="button"
                onClick={clearSingle}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                <Eraser size={14} />
                Clear
              </button>
            </div>
          </Card>

          {single && !single.valid ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-sm leading-6 text-red-200/90">{single.error}</p>
            </div>
          ) : null}

          {single && single.valid ? (
            <Card className="overflow-hidden">
              <div className="border-b border-zinc-800 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{single.format}-character input</Badge>
                  <ObjectChip prefix={single.prefix} objectName={single.objectName} />
                  {single.format === 18 ? (
                    <Badge variant={single.checksumValid ? "success" : "warning"}>
                      {single.checksumValid ? "Checksum valid" : "Suffix mismatch — verify the Id"}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="divide-y divide-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      18-character (case-safe)
                    </p>
                    <p className="mt-1 break-all font-mono text-base font-semibold text-emerald-400">
                      {single.id18}
                    </p>
                  </div>
                  <CopyButton value={single.id18 ?? ""} label="Copy 18-char" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      15-character (classic)
                    </p>
                    <p className="mt-1 break-all font-mono text-base text-zinc-200">
                      {single.id15}
                    </p>
                  </div>
                  <CopyButton value={single.id15 ?? ""} label="Copy 15-char" />
                </div>
              </div>
            </Card>
          ) : null}

          {single === null ? (
            <Card className="flex min-h-24 flex-col items-center justify-center gap-2 border-dashed bg-transparent p-6 text-center">
              <p className="text-sm text-zinc-500">
                Paste a record Id above — the 18-character form, the 15-character form, and the
                object prefix appear instantly, entirely in your browser.
              </p>
            </Card>
          ) : null}
        </div>
      </TabPanel>

      <TabPanel value="bulk" activeValue={tab} idPrefix="id-converter">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">
                Paste Ids — one per line (commas and spaces work too)
              </h2>
            </div>
            <label htmlFor="sf-id-bulk" className="sr-only">
              Bulk Salesforce IDs
            </label>
            <textarea
              id="sf-id-bulk"
              value={bulk}
              onChange={(event) => setBulk(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={"0013000001H3sSC\n00530000003oJzS\n5003000000XkVpS"}
              className="h-56 w-full resize-y bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-4 py-3">
              <button
                type="button"
                onClick={() => setBulk(SAMPLE_BULK)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                <FlaskConical size={14} />
                Load Sample
              </button>
              <button
                type="button"
                onClick={clearBulk}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                <Eraser size={14} />
                Clear
              </button>
              <CopyButton
                value={copyAllId18}
                label={`Copy ${validRows.length} as 18-char`}
                disabled={validRows.length === 0}
              />
            </div>
          </Card>

          {bulkResults.length > 0 ? (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Bulk Salesforce ID conversion results</caption>
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th scope="col" className="px-4 py-3 font-medium">Input</th>
                      <th scope="col" className="px-4 py-3 font-medium">18-character</th>
                      <th scope="col" className="px-4 py-3 font-medium">Object</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map((row, index) => (
                      <tr
                        key={`${row.input}-${index}`}
                        className="border-b border-zinc-800/60 last:border-0"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{row.input}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-emerald-400">
                          {row.id18 ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-300">
                          {row.objectName ?? (row.valid ? "org-specific" : "—")}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 size={13} />
                              Converted
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-red-400"
                              title={row.error}
                            >
                              <XCircle size={13} />
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalidRows.length > 0 ? (
                <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
                  {validRows.length} converted · {invalidRows.length} invalid (hover a red status
                  for the reason).
                </p>
              ) : (
                <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
                  {validRows.length} converted.
                </p>
              )}
            </Card>
          ) : null}
        </div>
      </TabPanel>
    </section>
  );
}
