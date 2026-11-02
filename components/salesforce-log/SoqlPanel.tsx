"use client";

import * as React from "react";
import { Database, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { CoverageNote, DataTable, type DataTableColumn } from "./DataTable";
import { ExpandableCodeCell } from "./ExpandableCodeCell";
import { formatCount, formatUsToMs } from "@/lib/salesforce-log/format";
import type {
  DebugLogAnalysis,
  SoqlExecution,
  SoqlQueryStat,
} from "@/lib/salesforce-log/types";

type SoqlView = "query" | "statement";

function QueryColumns(): DataTableColumn<SoqlQueryStat>[] {
  return [
    {
      key: "query",
      header: "Query",
      className: "min-w-[320px]",
      sortValue: (row) => row.query,
      render: (row) => <ExpandableCodeCell text={row.query} />,
    },
    {
      key: "plan",
      header: "Plan",
      sortValue: (row) => (row.nonSelective ? 1 : 0) + (row.nPlusOne ? 2 : 0),
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.nonSelective ? <Badge variant="warning">Table scan</Badge> : null}
          {row.nPlusOne ? <Badge variant="warning">N+1</Badge> : null}
          {!row.nonSelective && !row.nPlusOne ? (
            <span className="text-xs text-zinc-600">Indexed</span>
          ) : null}
        </span>
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
          {row.rowsKnown ? formatCount(row.totalRows) : "—"}
        </span>
      ),
    },
    {
      key: "aggregations",
      header: "Agg",
      align: "right",
      sortValue: (row) => row.aggregations,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-400 tabular-nums">
          {row.aggregations > 0 ? formatCount(row.aggregations) : "—"}
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
          <span className="block text-[11px] text-zinc-600">line {formatCount(row.firstLogLine)}</span>
        </span>
      ),
    },
  ];
}

function StatementColumns(): DataTableColumn<SoqlExecution>[] {
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
      key: "query",
      header: "Query",
      className: "min-w-[320px]",
      sortValue: (row) => row.query,
      render: (row) => <ExpandableCodeCell text={row.query} />,
    },
    {
      key: "rows",
      header: "Rows",
      align: "right",
      sortValue: (row) => row.rows ?? -1,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-200 tabular-nums">
          {row.rows !== null ? formatCount(row.rows) : "—"}
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

export function SoqlPanel({ analysis }: { analysis: DebugLogAnalysis }) {
  const [view, setView] = React.useState<SoqlView>("query");

  const { soql, sosl, counts } = analysis;
  const totalAggregations = soql.reduce((total, stat) => total + stat.aggregations, 0);
  const tableScans = soql.filter((stat) => stat.nonSelective).length;

  if (soql.length === 0 && sosl.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Database size={22} className="text-zinc-600" aria-hidden />
        <p className="text-sm text-zinc-400">No SOQL or SOSL queries were executed in this log.</p>
        <p className="max-w-md text-xs leading-5 text-zinc-500">
          Queries appear as SOQL_EXECUTE_BEGIN / SOQL_EXECUTE_END event pairs. None were
          captured — either the transaction did not touch the database or the SOQL trace level
          was NONE.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">
          {formatCount(counts.soqlQueries)} SOQL {counts.soqlQueries === 1 ? "query" : "queries"}
        </Badge>
        <Badge variant="info">{formatCount(counts.soqlRows)} rows returned</Badge>
        {totalAggregations > 0 ? (
          <Badge variant="outline">{formatCount(totalAggregations)} aggregate functions</Badge>
        ) : null}
        {tableScans > 0 ? (
          <Badge variant="warning">
            {formatCount(tableScans)} {tableScans === 1 ? "query" : "queries"} scanning without an index
          </Badge>
        ) : null}
        {analysis.nPlusOne.length > 0 ? (
          <Badge variant="warning">
            {formatCount(analysis.nPlusOne.length)} potential N+1{" "}
            {analysis.nPlusOne.length === 1 ? "pattern" : "patterns"}
          </Badge>
        ) : null}
      </div>

      {soql.length > 0 ? (
        <>
          <Tabs
            idPrefix="sfdla-soql-view"
            aria-label="SOQL grouping"
            value={view}
            onValueChange={(value) => setView(value as SoqlView)}
            tabs={[
              { value: "query", label: `By query (${formatCount(soql.length)})` },
              {
                value: "statement",
                label: `By statement (${formatCount(counts.soqlQueries)})`,
              },
            ]}
          />
          {view === "query" ? (
            <>
              <DataTable
                caption="SOQL queries grouped by normalized text, sortable and paginated"
                columns={QueryColumns()}
                rows={soql}
                rowKey={(row) => row.query}
                initialSortKey="rows"
                initialSortDirection="desc"
              />
              {analysis.coverage.queryGroupsTruncated ? (
                <CoverageNote>
                  Query grouping stopped at {formatCount(soql.length)} distinct queries — the
                  log exceeded the safety cap. Totals remain complete.
                </CoverageNote>
              ) : null}
            </>
          ) : (
            <>
              <DataTable
                caption="SOQL statements in execution order, sortable and paginated"
                columns={StatementColumns()}
                rows={analysis.soqlExecutions}
                rowKey={(_row, index) => `soql-exec-${index}`}
                initialSortKey="started"
                initialSortDirection="asc"
              />
              {analysis.coverage.soqlDetailsTruncated ? (
                <CoverageNote>
                  Only the first {formatCount(analysis.soqlExecutions.length)} statements are
                  listed — the detail list is capped to keep the browser responsive. Totals
                  remain complete.
                </CoverageNote>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {sosl.length > 0 ? (
        <section aria-label="SOSL queries" className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Search size={14} className="text-zinc-500" aria-hidden />
            SOSL {sosl.length === 1 ? "query" : "queries"}
          </h3>
          <ul className="space-y-3">
            {sosl.map((stat, index) => (
              <li
                key={`${stat.query}-${index}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3.5 py-3"
              >
                <code className="min-w-0 flex-1 break-all font-mono text-[13px] leading-6 text-zinc-200">
                  {stat.query}
                </code>
                <Badge variant={stat.rows !== null ? "success" : "outline"}>
                  {stat.rows !== null ? `${formatCount(stat.rows)} rows` : "rows unknown"}
                </Badge>
                {stat.durationUs !== null ? (
                  <span className="font-mono text-[11px] text-zinc-500">
                    {formatUsToMs(stat.durationUs)}
                  </span>
                ) : null}
                <span className="font-mono text-[11px] text-zinc-600">
                  line {formatCount(stat.logLine)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
