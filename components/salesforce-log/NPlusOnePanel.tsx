import { CheckCircle2, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoverageNote } from "./DataTable";
import { ExpandableCodeCell } from "./ExpandableCodeCell";
import { formatCount, formatUsToMs } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis, NPlusOneSeverity, NPlusOneWarning } from "@/lib/salesforce-log/types";

function SeverityBadge({ severity }: { severity: NPlusOneSeverity }) {
  return severity === "high" ? (
    <Badge className="border-red-500/40 bg-red-500/10 font-semibold text-red-300">High</Badge>
  ) : (
    <Badge className="border-amber-500/30 bg-amber-500/10 font-semibold text-amber-300">
      Medium
    </Badge>
  );
}

function WarningCard({ warning, index }: { warning: NPlusOneWarning; index: number }) {
  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={warning.severity} />
        <span className="font-mono text-xs text-zinc-500">shape #{index + 1}</span>
        <Badge variant="info">
          {warning.variants === 1
            ? "1 exact query"
            : `${formatCount(warning.variants)} query variants`}
        </Badge>
        <Badge variant="outline">{formatCount(warning.calls)} executions</Badge>
        <Badge variant="outline">{formatCount(warning.totalRows)} rows via loops</Badge>
        {warning.maxDurationUs > 0 ? (
          <span className="font-mono text-[11px] text-zinc-600">
            slowest {formatUsToMs(warning.maxDurationUs)}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5">
        <ExpandableCodeCell text={warning.representativeQuery} />
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">
        The same statement shape ran{" "}
        <span className="font-mono text-zinc-300">{formatCount(warning.calls)}×</span>{" "}
        — the classic signature of a SOQL inside a loop. Collect the varying filter
        values first, then execute one query with{" "}
        <code className="break-all font-mono text-zinc-400">IN :keys</code> and index the
        results by key.
      </p>
    </li>
  );
}

/** N+1 tab: queries flagged as running repeatedly with an identical structure. */
export function NPlusOnePanel({ analysis }: { analysis: DebugLogAnalysis }) {
  const warnings = analysis.nPlusOne;

  if (warnings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 size={22} className="text-emerald-400" aria-hidden />
        <p className="text-sm text-zinc-300">No N+1 query patterns were detected.</p>
        <p className="max-w-md text-xs leading-5 text-zinc-500">
          The analyzer flags queries that share one normalized structure — literals and
          value lists masked — and executed 3+ times, the typical footprint of a SOQL
          statement inside a loop. Nothing in this log matches.
        </p>
      </div>
    );
  }

  const totalCalls = warnings.reduce((total, warning) => total + warning.calls, 0);
  const totalRows = warnings.reduce((total, warning) => total + warning.totalRows, 0);
  const highCount = warnings.filter((warning) => warning.severity === "high").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={highCount > 0 ? "warning" : "info"}>
          {formatCount(warnings.length)} {warnings.length === 1 ? "pattern" : "patterns"} flagged
        </Badge>
        <Badge variant="outline">{formatCount(totalCalls)} loop executions</Badge>
        <Badge variant="outline">{formatCount(totalRows)} rows via loops</Badge>
      </div>

      <ul className="space-y-3" aria-label="Potential N+1 query patterns">
        {warnings.map((warning, index) => (
          <WarningCard key={warning.structuralKey} warning={warning} index={index} />
        ))}
      </ul>

      {analysis.coverage.nPlusOneTruncated ? (
        <CoverageNote>
          Detection stopped at {formatCount(warnings.length)} shapes — the log exceeded the
          warning cap. Query totals remain complete.
        </CoverageNote>
      ) : null}

      <p className="text-xs leading-5 text-zinc-600">
        Heuristic: queries grouped by structure (string/numeric literals and IN-list values
        masked) with at least 3 executions. In trigger context, repeated identical queries
        usually fire once per record — review each flagged statement before shipping a fix.
      </p>
    </div>
  );
}
