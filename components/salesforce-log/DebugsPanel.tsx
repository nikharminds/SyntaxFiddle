import { Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoverageNote, DataTable, type DataTableColumn } from "./DataTable";
import { ExpandableCodeCell } from "./ExpandableCodeCell";
import { formatCount, formatUsToMs } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis, DebugStatement } from "@/lib/salesforce-log/types";

const LEVEL_STYLES: Record<string, string> = {
  ERROR: "border-red-500/30 bg-red-500/10 text-red-300",
  WARN: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  INFO: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  DEBUG: "border-zinc-700 bg-zinc-800 text-zinc-300",
};

function LevelBadge({ level }: { level: string }) {
  const style = LEVEL_STYLES[level] ?? "border-zinc-800 bg-zinc-950 text-zinc-500";
  return <Badge className={style}>{level}</Badge>;
}

/** Debugs tab: every USER_DEBUG statement captured by the worker. */
export function DebugsPanel({ analysis }: { analysis: DebugLogAnalysis }) {
  const { debugStatements } = analysis;

  const columns: DataTableColumn<DebugStatement>[] = [
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
    {
      key: "level",
      header: "Level",
      sortValue: (row) => row.level,
      render: (row) => <LevelBadge level={row.level} />,
    },
    {
      key: "message",
      header: "Message",
      className: "min-w-[280px]",
      sortValue: (row) => row.message,
      render: (row) => <ExpandableCodeCell text={row.message} />,
    },
    {
      key: "apexLine",
      header: "Apex line",
      align: "right",
      sortValue: (row) => row.apexLine ?? -1,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500 tabular-nums">
          {row.apexLine !== null ? row.apexLine : "—"}
        </span>
      ),
    },
    {
      key: "elapsed",
      header: "At",
      align: "right",
      sortValue: (row) => row.elapsedUs,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500">
          {formatUsToMs(row.elapsedUs)}
        </span>
      ),
    },
  ];

  if (debugStatements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Terminal size={22} className="text-zinc-600" aria-hidden />
        <p className="text-sm text-zinc-400">No System.debug output was captured.</p>
        <p className="max-w-md text-xs leading-5 text-zinc-500">
          USER_DEBUG events appear when the Apex Code trace level is DEBUG or higher.
          ERROR and WARN output is additionally listed in the Errors tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">{formatCount(analysis.counts.userDebugLines)} debug lines</Badge>
        <Badge variant="info">{formatCount(debugStatements.length)} captured</Badge>
      </div>
      <DataTable
        caption="System.debug statements, sortable and paginated"
        columns={columns}
        rows={debugStatements}
        rowKey={(_row, index) => `debug-${index}`}
        initialSortKey="logLine"
        initialSortDirection="asc"
      />
      {analysis.coverage.debugStatementsTruncated ? (
        <CoverageNote>
          Only the first {formatCount(debugStatements.length)} statements are listed — the
          detail list is capped to keep the browser responsive. Totals are complete.
        </CoverageNote>
      ) : null}
    </div>
  );
}
