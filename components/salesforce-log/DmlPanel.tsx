"use client";

import * as React from "react";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { CoverageNote, DataTable, type DataTableColumn } from "./DataTable";
import { formatCount, formatUsToMs } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis, DmlExecution, DmlStatementStat } from "@/lib/salesforce-log/types";

type DmlView = "object" | "statement";

function ObjectColumns(): DataTableColumn<DmlStatementStat>[] {
  return [
    {
      key: "op",
      header: "Operation",
      sortValue: (row) => row.op,
      render: (row) => (
        <span className="font-mono text-[13px] text-emerald-300">{row.op}</span>
      ),
    },
    {
      key: "type",
      header: "Object",
      className: "min-w-[180px]",
      sortValue: (row) => row.type,
      render: (row) => (
        <span className="break-all font-mono text-[13px] text-zinc-300">{row.type}</span>
      ),
    },
    {
      key: "calls",
      header: "Calls",
      align: "right",
      sortValue: (row) => row.calls,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-300 tabular-nums">
          {formatCount(row.calls)}
        </span>
      ),
    },
    {
      key: "rows",
      header: "Rows",
      align: "right",
      sortValue: (row) => row.totalRows,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-200 tabular-nums">
          {formatCount(row.totalRows)}
        </span>
      ),
    },
    {
      key: "slowest",
      header: "Slowest",
      align: "right",
      sortValue: (row) => row.maxDurationUs,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-400">
          {row.measuredCalls > 0 ? formatUsToMs(row.maxDurationUs) : "—"}
        </span>
      ),
    },
    {
      key: "totalTime",
      header: "Total time",
      align: "right",
      sortValue: (row) => row.totalDurationUs,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-400">
          {row.measuredCalls > 0 ? formatUsToMs(row.totalDurationUs) : "—"}
        </span>
      ),
    },
    {
      key: "first",
      header: "First at",
      align: "right",
      sortValue: (row) => row.firstElapsedUs,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500">
          {formatUsToMs(row.firstElapsedUs)}
          <span className="block text-[11px] text-zinc-600">
            line {formatCount(row.firstLogLine)}
          </span>
        </span>
      ),
    },
  ];
}

function StatementColumns(): DataTableColumn<DmlExecution>[] {
  return [
    {
      key: "number",
      header: "#",
      align: "right",
      sortValue: (row) => row.statementNumber,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-600 tabular-nums">
          {row.statementNumber}
        </span>
      ),
    },
    {
      key: "op",
      header: "Operation",
      sortValue: (row) => row.op,
      render: (row) => (
        <span className="font-mono text-[13px] text-emerald-300">{row.op}</span>
      ),
    },
    {
      key: "type",
      header: "Object",
      className: "min-w-[180px]",
      sortValue: (row) => row.type,
      render: (row) => (
        <span className="break-all font-mono text-[13px] text-zinc-300">{row.type}</span>
      ),
    },
    {
      key: "rows",
      header: "Rows",
      align: "right",
      sortValue: (row) => row.rows,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-200 tabular-nums">
          {formatCount(row.rows)}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      sortValue: (row) => row.durationUs ?? -1,
      render: (row) => (
        <span
          className={
            row.durationUs !== null
              ? "font-mono text-xs text-zinc-300"
              : "font-mono text-xs text-amber-300/70"
          }
        >
          {row.durationUs !== null ? formatUsToMs(row.durationUs) : "no END"}
        </span>
      ),
    },
    {
      key: "started",
      header: "Started",
      align: "right",
      sortValue: (row) => row.startedAtUs,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500">{formatUsToMs(row.startedAtUs)}</span>
      ),
    },
    {
      key: "logLine",
      header: "Log line",
      align: "right",
      sortValue: (row) => row.logLine,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500 tabular-nums">
          {formatCount(row.logLine)}
        </span>
      ),
    },
  ];
}

export function DmlPanel({ analysis }: { analysis: DebugLogAnalysis }) {
  const [view, setView] = React.useState<DmlView>("object");
  const { dml, counts } = analysis;

  if (dml.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Database size={22} className="text-zinc-600" aria-hidden />
        <p className="text-sm text-zinc-400">No DML statements were executed in this log.</p>
        <p className="max-w-md text-xs leading-5 text-zinc-500">
          Inserts, updates, upserts, deletes, and merges appear here as DML_BEGIN events
          grouped by operation and object.
        </p>
      </div>
    );
  }

  const opTotals = [...dml.reduce((map, stat) => {
    const existing = map.get(stat.op);
    if (existing) {
      existing.calls += stat.calls;
      existing.rows += stat.totalRows;
    } else {
      map.set(stat.op, { calls: stat.calls, rows: stat.totalRows });
    }
    return map;
  }, new Map<string, { calls: number; rows: number }>())];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">
          {formatCount(counts.dmlStatements)} DML {counts.dmlStatements === 1 ? "statement" : "statements"}
        </Badge>
        <Badge variant="info">{formatCount(counts.dmlRows)} rows affected</Badge>
        <Badge variant="outline">sync Apex caps: 150 statements / 10,000 rows</Badge>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="Rows by operation">
        {opTotals.map(([op, totals]) => (
          <li key={op}>
            <span className="inline-flex items-baseline gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs">
              <span className="text-zinc-200">{op}</span>
              <span className="text-zinc-500">
                {totals.calls}× · {formatCount(totals.rows)} rows
              </span>
            </span>
          </li>
        ))}
      </ul>

      <Tabs
        idPrefix="sfdla-dml-view"
        aria-label="DML grouping"
        value={view}
        onValueChange={(value) => setView(value as DmlView)}
        tabs={[
          { value: "object", label: `By object (${formatCount(dml.length)})` },
          { value: "statement", label: `By statement (${formatCount(counts.dmlStatements)})` },
        ]}
      />

      {view === "object" ? (
        <DataTable
          caption="DML statements grouped by operation and object, sortable and paginated"
          columns={ObjectColumns()}
          rows={dml}
          rowKey={(row) => `${row.op}-${row.type}`}
          initialSortKey="rows"
          initialSortDirection="desc"
        />
      ) : (
        <>
          <DataTable
            caption="DML statements in execution order, sortable and paginated"
            columns={StatementColumns()}
            rows={analysis.dmlExecutions}
            rowKey={(_row, index) => `dml-exec-${index}`}
            initialSortKey="started"
            initialSortDirection="asc"
          />
          {analysis.coverage.dmlDetailsTruncated ? (
            <CoverageNote>
              Only the first {formatCount(analysis.dmlExecutions.length)} statements are
              listed — the detail list is capped to keep the browser responsive. Totals
              remain complete.
            </CoverageNote>
          ) : null}
        </>
      )}
    </div>
  );
}
