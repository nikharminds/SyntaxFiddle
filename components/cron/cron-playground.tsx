"use client";

import { useEffect, useMemo, useState } from "react";
import { DialectSelector } from "@/components/cron/dialect-selector";
import { ExpressionInput } from "@/components/cron/expression-input";
import { HumanReadableCard } from "@/components/cron/human-readable-card";
import { UpcomingRunsTable, VisualTimeline } from "@/components/cron/visual-timeline";
import { TimezonePicker } from "@/components/cron/timezone-picker";
import { useMounted } from "@/hooks/use-mounted";
import { convertCronExpression } from "@/lib/cron/convert";
import { DIALECTS, type CronDialect } from "@/lib/cron/dialects";
import { analyzeCronExpression } from "@/lib/cron/engine";

export const DIALECT_DEFAULTS: Record<CronDialect, string> = {
  unix: "*/15 * * * *",
  aws: "0 12 ? * MON-FRI *",
  quartz: "0 15 10 ? * 6#3",
  cloudflare: "0 */6 * * *",
};

const TIMELINE_RUN_COUNT = 50;

function buildCronQuery(expression: string, dialect: CronDialect, timezone: string): string {
  return new URLSearchParams({ expr: expression, dialect, tz: timezone }).toString();
}

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export type CronPlaygroundProps = {
  initialExpression?: string;
  initialDialect?: CronDialect;
  syncUrl?: boolean;
};

export function CronPlayground({
  initialExpression,
  initialDialect,
  syncUrl = true,
}: CronPlaygroundProps) {
  const mounted = useMounted();
  const initialDialectValue = initialDialect ?? "unix";
  const [dialect, setDialect] = useState<CronDialect>(initialDialectValue);
  const [expression, setExpression] = useState(
    initialExpression ?? DIALECT_DEFAULTS[initialDialectValue]
  );
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tzParam = params.get("tz");

    if (syncUrl) {
      const exprParam = params.get("expr")?.slice(0, 200);
      const dialectParam = params.get("dialect");
      if (exprParam && exprParam.trim().length > 0) {
        setExpression(exprParam);
      }
      if (dialectParam && dialectParam in DIALECTS) {
        setDialect(dialectParam as CronDialect);
      }
    }

    if (tzParam && isSupportedTimezone(tzParam)) {
      setTimezone(tzParam);
    } else {
      try {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      } catch {
        setTimezone("UTC");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted || !syncUrl) return;
    const query = buildCronQuery(expression, dialect, timezone);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [mounted, syncUrl, expression, dialect, timezone]);

  const analysis = useMemo(
    () => analyzeCronExpression(expression, dialect, timezone, TIMELINE_RUN_COUNT),
    [expression, dialect, timezone]
  );

  const shareUrl = mounted
    ? `${window.location.origin}${window.location.pathname}?${buildCronQuery(
        expression,
        dialect,
        timezone
      )}`
    : "";

  const handleDialectChange = (next: CronDialect) => {
    setDialect(next);
    const trimmed = expression.trim();
    if (trimmed.length === 0) {
      // Only seed a sample expression when the field is empty.
      setExpression(DIALECT_DEFAULTS[next]);
      return;
    }
    const converted = convertCronExpression(expression, dialect, next);
    if (converted) {
      setExpression(converted);
    }
    // Lossy or untranslatable expressions are kept verbatim so the dialect's
    // own validation message explains the mismatch instead of silently
    // replacing what the user typed.
  };

  const handleFormat = () => {
    setExpression(expression.trim().split(/\s+/).join(" "));
  };

  return (
    <div className="space-y-4">
      <DialectSelector value={dialect} onChange={handleDialectChange} />

      <ExpressionInput
        value={expression}
        onChange={setExpression}
        onFormat={handleFormat}
        fields={analysis.fields}
        shareUrl={shareUrl}
      />

      <HumanReadableCard
        result={analysis}
        dialectLabel={DIALECTS[dialect].label}
        timezone={timezone}
      />

      <VisualTimeline runs={analysis.nextRuns} timezone={timezone} ready={mounted} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingRunsTable runs={analysis.nextRuns} timezone={timezone} ready={mounted} />
        </div>
        <TimezonePicker value={timezone} onChange={setTimezone} ready={mounted} />
      </div>
    </div>
  );
}
