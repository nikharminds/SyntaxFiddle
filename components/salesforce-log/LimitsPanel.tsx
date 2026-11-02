import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UsageBar } from "./UsageBar";
import { LIMIT_CRITICAL_PCT, usageTone } from "@/lib/salesforce-log/limits";
import { formatCount } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis, NamespaceLimitUsage } from "@/lib/salesforce-log/types";

function NamespaceSection({ usage }: { usage: NamespaceLimitUsage }) {
  return (
    <section
      aria-label={`Governor limit usage for namespace ${usage.namespace}`}
      className="space-y-3"
    >
      <h3 className="text-sm font-semibold text-zinc-200">
        {usage.namespace === "(default)" ? "Your namespace" : `Namespace: ${usage.namespace}`}
      </h3>
      <ul className="space-y-3">
        {usage.entries.map((entry) => {
          const tone = usageTone(entry.percentage, entry.closeToLimit);
          return (
            <li
              key={entry.name}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200">
                  {entry.label}
                  {entry.closeToLimit || entry.percentage >= LIMIT_CRITICAL_PCT ? (
                    <Badge variant="warning" className="ml-2">
                      Close to limit
                    </Badge>
                  ) : null}
                </p>
                <p className="font-mono text-xs text-zinc-400">
                  <span
                    className={
                      tone === "critical"
                        ? "text-red-300"
                        : tone === "warn"
                          ? "text-amber-300"
                          : "text-zinc-300"
                    }
                  >
                    {formatCount(entry.current)}
                  </span>
                  {" / "}
                  {formatCount(entry.max)}
                  <span className="ml-2 text-zinc-500">{entry.percentage.toFixed(1)}%</span>
                </p>
              </div>
              <UsageBar className="mt-2.5" pct={entry.percentage} tone={tone} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LimitsPanel({ analysis }: { analysis: DebugLogAnalysis }) {
  if (analysis.limits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Gauge size={22} className="text-zinc-600" aria-hidden />
        <p className="text-sm text-zinc-400">No LIMIT_USAGE_FOR_NS blocks were found in this log.</p>
        <p className="max-w-md text-xs leading-5 text-zinc-500">
          These blocks are emitted whenever a code unit finishes. If yours is missing, the log may
          be truncated or was captured at a very low Apex debug level.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {analysis.limits.map((usage) => (
        <NamespaceSection key={usage.namespace} usage={usage} />
      ))}
    </div>
  );
}
