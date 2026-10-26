"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

type ZonedParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  weekday: string;
};

function getFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = FORMATTERS.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    FORMATTERS.set(timezone, formatter);
  }
  return formatter;
}

function zonedParts(date: Date, timezone: string): ZonedParts {
  const map: Record<string, string> = {};
  for (const part of getFormatter(timezone).formatToParts(date)) {
    map[part.type] = part.value;
  }
  return {
    year: map.year ?? "1970",
    month: map.month ?? "01",
    day: map.day ?? "01",
    hour: map.hour ?? "00",
    minute: map.minute ?? "00",
    second: map.second ?? "00",
    weekday: map.weekday ?? "",
  };
}

export function formatTimestamp(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function dayKey(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatRelative(date: Date, timezone: string, now: number): string {
  const diffMinutes = Math.round((date.getTime() - now) / 60000);
  if (diffMinutes < 1) return "in moments";
  if (diffMinutes < 60) return `in ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`;
  if (dayKey(new Date(now + 86_400_000), timezone) === dayKey(date, timezone)) {
    const parts = zonedParts(date, timezone);
    return `tomorrow at ${parts.hour}:${parts.minute}`;
  }
  if (diffMinutes < 48 * 60) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const minuteSuffix = minutes > 0 ? ` ${minutes} min` : "";
    return `in ${hours} h${minuteSuffix}`;
  }
  const days = Math.floor(diffMinutes / (24 * 60));
  const hours = Math.floor((diffMinutes % (24 * 60)) / 60);
  const hourSuffix = hours > 0 ? ` ${hours} h` : "";
  return `in ${days} day${days === 1 ? "" : "s"}${hourSuffix}`;
}

type DayBucket = {
  key: string;
  weekday: string;
  hours: Date[][];
};

export type VisualTimelineProps = {
  runs: Date[];
  timezone: string;
  ready: boolean;
};

const SKELETON_HOURS = Array.from({ length: 24 }, (_, index) => index);

export function VisualTimeline({ runs, timezone, ready }: VisualTimelineProps) {
  const [dayIndex, setDayIndex] = React.useState(0);

  const days = React.useMemo<DayBucket[]>(() => {
    if (!ready) return [];
    const map = new Map<string, DayBucket>();
    for (const run of runs) {
      const parts = zonedParts(run, timezone);
      const key = `${parts.year}-${parts.month}-${parts.day}`;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = {
          key,
          weekday: parts.weekday,
          hours: Array.from({ length: 24 }, () => [] as Date[]),
        };
        map.set(key, bucket);
      }
      const hour = Number(parts.hour);
      if (hour >= 0 && hour <= 23) {
        bucket.hours[hour]?.push(run);
      }
    }
    return [...map.values()];
  }, [runs, timezone, ready]);

  const activeIndex = days.length === 0 ? 0 : Math.min(dayIndex, days.length - 1);
  const activeDay = days[activeIndex];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <CalendarDays size={15} className="text-emerald-400" />
          24-hour view
          {ready && activeDay ? (
            <span className="font-normal text-zinc-400">
              · {activeDay.weekday}, {activeDay.key}
            </span>
          ) : null}
        </div>
        {ready && days.length > 1 && activeDay ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              day {activeIndex + 1} of {days.length}
            </span>
            <button
              type="button"
              onClick={() => setDayIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex <= 0}
              aria-label="Previous day with runs"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setDayIndex(Math.min(days.length - 1, activeIndex + 1))}
              disabled={activeIndex >= days.length - 1}
              aria-label="Next day with runs"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : null}
      </div>

      <div
        role="img"
        aria-label={
          ready && activeDay
            ? `Runs on ${activeDay.key}: hours illuminated where the schedule fires`
            : "24-hour run timeline"
        }
        className="mt-4 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1"
      >
        {(ready && activeDay ? activeDay.hours : SKELETON_HOURS.map((hour) => [] as Date[])).map(
          (hourRuns, hour) => {
            const count = hourRuns.length;
            const active = count > 0;
            const preview = hourRuns
              .slice(0, 3)
              .map((run) => formatTimestamp(run, timezone).slice(11));
            const extra = count - preview.length;
            return (
              <div key={hour} className="group relative flex flex-col items-center gap-1">
                <div
                  tabIndex={active ? 0 : -1}
                  aria-label={
                    active ? `${count} run${count === 1 ? "" : "s"} at hour ${hour}` : undefined
                  }
                  className={cn(
                    "flex h-14 w-full items-center justify-center rounded-md border text-center transition-colors",
                    active
                      ? "border-emerald-500/40 bg-emerald-500/15 focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                      : "border-zinc-800/80 bg-zinc-900/40"
                  )}
                >
                  {active ? (
                    count <= 4 ? (
                      <span className="flex flex-wrap items-center justify-center gap-0.5 px-1">
                        {hourRuns.slice(0, 4).map((run) => (
                          <span key={run.toISOString()} className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        ))}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-semibold text-emerald-300">×{count}</span>
                    )
                  ) : null}

                  {active ? (
                    <div
                      className={cn(
                        "pointer-events-none absolute bottom-full z-20 mb-2 hidden w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-left shadow-xl shadow-black/50 group-hover:block group-focus-within:block",
                        hour <= 2 ? "left-0" : hour >= 21 ? "right-0" : "left-1/2 -translate-x-1/2"
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        {String(hour).padStart(2, "0")}:00–{String(hour).padStart(2, "0")}:59 ·{" "}
                        {count} run{count === 1 ? "" : "s"}
                      </p>
                      <ul className="mt-1 list-none space-y-0.5 font-mono text-[11px] text-zinc-200">
                        {preview.map((stamp) => (
                          <li key={stamp}>{stamp}</li>
                        ))}
                        {extra > 0 ? <li className="text-zinc-400">+{extra} more</li> : null}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    active ? "text-emerald-300" : "text-zinc-600"
                  )}
                >
                  {String(hour).padStart(2, "0")}
                </span>
              </div>
            );
          }
        )}
      </div>

      {ready && days.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">
          No upcoming runs to visualize. Adjust the expression or the timezone.
        </p>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">
          Hover a highlighted hour for precise timestamps. Showing the next{" "}
          {Math.min(runs.length, 50)} executions.
        </p>
      )}
    </Card>
  );
}

export function UpcomingRunsTable({ runs, timezone, ready }: VisualTimelineProps) {
  const shown = ready ? runs.slice(0, 10) : [];
  const now = ready ? Date.now() : 0;

  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Clock size={15} className="text-emerald-400" />
          Upcoming runs
        </h3>
        {ready ? <Badge variant="outline">{timezone}</Badge> : null}
      </div>

      {ready && shown.length > 0 ? (
        <table className="w-full">
          <caption className="sr-only">Next 10 scheduled executions in {timezone}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Relative time</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((run) => (
              <tr key={run.toISOString()} className="border-b border-zinc-800/60 last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-200">
                  {formatTimestamp(run, timezone)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Badge variant="success">{formatRelative(run, timezone, now)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : ready ? (
        <p className="px-4 py-6 text-sm text-zinc-400">No upcoming runs to display.</p>
      ) : (
        <div className="space-y-1 p-3">
          {SKELETON_HOURS.slice(0, 10).map((row) => (
            <div key={row} className="h-8 rounded-md bg-zinc-900/60" />
          ))}
        </div>
      )}
    </Card>
  );
}
