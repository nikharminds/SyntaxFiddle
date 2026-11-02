import {
  AlertTriangle,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Send,
  ShieldAlert,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UsageBar } from "./UsageBar";
import { LIMIT_CRITICAL_PCT, usageTone } from "@/lib/salesforce-log/limits";
import { formatBytes, formatCount, formatUsToMs } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis, LimitUsageEntry } from "@/lib/salesforce-log/types";

const DEFAULT_NAMESPACE = "(default)";

const KEY_LIMIT_NAMES = [
  "Number of SOQL queries",
  "Number of query rows",
  "Number of DML statements",
  "Number of DML rows",
  "Maximum CPU time",
  "Maximum heap size",
] as const;

function findLimit(analysis: DebugLogAnalysis, name: string): LimitUsageEntry | null {
  const namespace = analysis.limits.find((entry) => entry.namespace === DEFAULT_NAMESPACE);
  return namespace?.entries.find((entry) => entry.name === name) ?? null;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5 transition-colors hover:border-zinc-700/80">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Icon size={13} className="shrink-0 text-zinc-600" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1.5">
        <span className="block truncate text-lg font-semibold tracking-tight text-zinc-100" title={value}>
          {value}
        </span>
        {hint ? (
          <span className="mt-0.5 block truncate font-mono text-[11px] leading-4 text-zinc-500">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function WarningRow({ message, critical }: { message: string; critical: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      {critical ? (
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-red-400" aria-hidden />
      ) : (
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
      )}
      <span
        className={
          critical ? "text-sm leading-6 text-red-300" : "text-sm leading-6 text-amber-200/90"
        }
      >
        {message}
      </span>
    </li>
  );
}

export function SummaryPanel({ analysis }: { analysis: DebugLogAnalysis }) {
  const { counts } = analysis;

  const cpuLimit = findLimit(analysis, "Maximum CPU time");
  const heapLimit = findLimit(analysis, "Maximum heap size");
  const keyLimits = KEY_LIMIT_NAMES.map((name) => findLimit(analysis, name)).filter(
    (entry): entry is LimitUsageEntry => entry !== null,
  );

  const closeToLimitCount = analysis.limits.reduce(
    (total, namespace) =>
      total +
      namespace.entries.filter(
        (entry) => entry.closeToLimit || entry.percentage >= LIMIT_CRITICAL_PCT,
      ).length,
    0,
  );
  const tableScans = analysis.soql.filter((stat) => stat.nonSelective).length;

  const warnings: { message: string; critical: boolean }[] = [];
  if (counts.fatalErrors > 0) {
    warnings.push({
      message: `${formatCount(counts.fatalErrors)} fatal ${counts.fatalErrors === 1 ? "error" : "errors"} terminated ${counts.fatalErrors === 1 ? "an execution" : "executions"} — see the Errors tab.`,
      critical: true,
    });
  }
  if (analysis.truncated) {
    warnings.push({
      message: `Salesforce truncated this capture on its servers before download (${analysis.truncationNotes.length === 1 ? analysis.truncationNotes[0] : `${analysis.truncationNotes.length} truncation markers`}). Those events were never recorded — every count on this page is a lower bound.`,
      critical: false,
    });
  }
  if (closeToLimitCount > 0) {
    warnings.push({
      message: `${formatCount(closeToLimitCount)} governor ${closeToLimitCount === 1 ? "limit is at" : "limits are at"} the close-to-limit threshold — see the Limits tab.`,
      critical: true,
    });
  }
  if (counts.exceptions > 0) {
    warnings.push({
      message: `${formatCount(counts.exceptions)} ${counts.exceptions === 1 ? "exception was" : "exceptions were"} thrown and may have been swallowed by try/catch.`,
      critical: false,
    });
  }
  if (tableScans > 0) {
    warnings.push({
      message: `${formatCount(tableScans)} SOQL ${tableScans === 1 ? "query ran" : "queries ran"} a table scan (no indexed filter) — check the SOQL tab.`,
      critical: false,
    });
  }
  if (analysis.nPlusOne.length > 0) {
    const highNPlusOne = analysis.nPlusOne.some((warning) => warning.severity === "high");
    warnings.push({
      message: `${formatCount(analysis.nPlusOne.length)} SOQL ${analysis.nPlusOne.length === 1 ? "pattern looks" : "patterns look"} like N+1 loops (same query shape executed repeatedly) — see the N+1 tab.`,
      critical: highNPlusOne,
    });
  }

  return (
    <div className="space-y-6">
      {/* KPI cards — semantic definition list, one term/value pair per card. */}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={HardDrive}
          label="Log size"
          value={formatBytes(analysis.byteSize)}
          hint={`${formatCount(analysis.lineCount)} lines`}
        />
        <KpiCard
          icon={Timer}
          label="Time covered"
          value={formatUsToMs(analysis.elapsedUs)}
          hint={
            analysis.wallClockStart && analysis.wallClockEnd
              ? `${analysis.wallClockStart} → ${analysis.wallClockEnd}`
              : undefined
          }
        />
        <KpiCard
          icon={Database}
          label="SOQL queries"
          value={formatCount(counts.soqlQueries)}
          hint={`${formatCount(counts.soqlRows)} rows returned`}
        />
        <KpiCard
          icon={Layers}
          label="DML statements"
          value={formatCount(counts.dmlStatements)}
          hint={`${formatCount(counts.dmlRows)} rows affected`}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Errors"
          value={formatCount(analysis.errors.length)}
          hint={`${formatCount(counts.exceptions)} exceptions · ${formatCount(counts.fatalErrors)} fatal`}
        />
        <KpiCard
          icon={Cpu}
          label="CPU time"
          value={cpuLimit ? `${formatCount(cpuLimit.current)} ms` : "—"}
          hint={cpuLimit ? `of ${formatCount(cpuLimit.max)} ms · ${cpuLimit.percentage.toFixed(1)}%` : "no limit block"}
        />
        <KpiCard
          icon={Gauge}
          label="Heap size"
          value={heapLimit ? formatBytes(heapLimit.current) : "—"}
          hint={heapLimit ? `of ${formatBytes(heapLimit.max)} · ${heapLimit.percentage.toFixed(1)}%` : "no limit block"}
        />
        <KpiCard
          icon={Send}
          label="Callouts"
          value={formatCount(counts.callouts)}
          hint={`${formatCount(counts.userDebugLines)} System.debug lines`}
        />
      </dl>

      {keyLimits.length > 0 ? (
        <section aria-labelledby="sfdla-summary-limits" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="sfdla-summary-limits" className="text-sm font-semibold text-zinc-200">
              Governor usage at a glance
            </h3>
            {/* Threshold legend — mirrored as text so it is not color-only. */}
            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-1.5 w-4 rounded-full bg-emerald-500" />
                under 70%
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-1.5 w-4 rounded-full bg-amber-500" />
                70–90%
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-1.5 w-4 rounded-full bg-red-500" />
                over 90%
              </span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {keyLimits.map((entry) => {
              const tone = usageTone(entry.percentage, entry.closeToLimit);
              return (
                <li
                  key={entry.name}
                  className="grid items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(140px,200px)_1fr_auto]"
                >
                  <p className="truncate text-sm text-zinc-300" title={entry.label}>
                    {entry.label}
                  </p>
                  <UsageBar pct={entry.percentage} tone={tone} />
                  <p className="font-mono text-xs leading-4 text-zinc-500 sm:min-w-36 sm:text-right">
                    <span
                      className={
                        tone === "critical"
                          ? "text-red-300"
                          : tone === "warn"
                            ? "text-amber-300"
                            : "text-zinc-200"
                      }
                    >
                      {formatCount(entry.current)}
                    </span>
                    {" / "}
                    {formatCount(entry.max)}
                    <span className="ml-1.5 text-zinc-600">
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {warnings.length > 0 ? (
        <section
          aria-labelledby="sfdla-summary-warnings"
          className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4"
        >
          <h3 id="sfdla-summary-warnings" className="text-sm font-semibold text-amber-200">
            Attention needed
          </h3>
          <ul className="mt-2.5 space-y-2">
            {warnings.map((warning) => (
              <WarningRow
                key={warning.message}
                message={warning.message}
                critical={warning.critical}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="sfdla-summary-capture" className="space-y-3">
        <h3 id="sfdla-summary-capture" className="text-sm font-semibold text-zinc-200">
          Capture settings
        </h3>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
          <div className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            <p className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-zinc-500">Executed by</span>
              <span className="truncate font-mono text-zinc-300" title={analysis.executedBy ?? undefined}>
                {analysis.executedBy ?? "—"}
              </span>
            </p>
            <p className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-zinc-500">Entry point</span>
              <span className="truncate font-mono text-zinc-300" title={analysis.entryPoint ?? undefined}>
                {analysis.entryPoint ?? "—"}
              </span>
            </p>
            <p className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-zinc-500">Code units</span>
              <span className="font-mono text-zinc-300">{formatCount(counts.codeUnits)}</span>
            </p>
            <p className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-zinc-500">Namespaces</span>
              <span className="truncate font-mono text-zinc-300">
                {analysis.namespaces.length > 0 ? analysis.namespaces.join(", ") : "(default)"}
              </span>
            </p>
          </div>
          {analysis.debugLevels.length > 0 ? (
            <>
              <ul
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label="Trace-flag debug levels"
              >
                {analysis.debugLevels.map((setting) => (
                  <li
                    key={setting.category}
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] leading-4"
                  >
                    <span className="text-zinc-500">{setting.category}</span>
                    <span className="text-zinc-600">:</span>{" "}
                    <span className="text-zinc-300">{setting.level}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              No debug-level header was found — this log may have been exported without its
              header line.
            </p>
          )}
          {analysis.logVersion ? (
            <div className="mt-3">
              <Badge variant="outline" className="font-mono">
                API v{analysis.logVersion}
              </Badge>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
