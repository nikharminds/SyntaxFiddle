"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "UTC", value: "UTC" },
  { label: "IST", value: "Asia/Kolkata" },
  { label: "EST", value: "America/New_York" },
  { label: "PST", value: "America/Los_Angeles" },
];

const FALLBACK_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const REGION_LABELS: Record<string, string> = {
  Africa: "Africa",
  America: "Americas",
  Antarctica: "Antarctica",
  Arctic: "Arctic",
  Asia: "Asia",
  Atlantic: "Atlantic",
  Australia: "Australia",
  Europe: "Europe",
  Indian: "Indian",
  Pacific: "Pacific",
  Etc: "Other",
  UTC: "UTC",
};

export type TimezonePickerProps = {
  value: string;
  onChange: (timezone: string) => void;
  ready: boolean;
};

export function TimezonePicker({ value, onChange, ready }: TimezonePickerProps) {
  const groups = React.useMemo(() => {
    if (!ready) return [];
    let zones: string[];
    try {
      zones = Intl.supportedValuesOf("timeZone");
    } catch {
      zones = FALLBACK_ZONES;
    }
    if (!zones.includes("UTC")) {
      zones = ["UTC", ...zones];
    }
    const map = new Map<string, string[]>();
    for (const zone of zones) {
      const region = zone.includes("/") ? (zone.split("/")[0] ?? zone) : zone;
      const list = map.get(region) ?? [];
      list.push(zone);
      map.set(region, list);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([region, list]) => ({
        region,
        label: REGION_LABELS[region] ?? region,
        zones: [...list].sort((a, b) => a.localeCompare(b)),
      }));
  }, [ready]);

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <Globe size={15} className="text-emerald-400" />
        Timezone
      </h3>

      <label htmlFor="timezone-select" className="sr-only">
        Timezone
      </label>
      <select
        id="timezone-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
      >
        {ready
          ? groups.map((group) => (
              <optgroup key={group.region} label={group.label}>
                {group.zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </optgroup>
            ))
          : <option value={value}>{value}</option>}
      </select>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Timezone presets">
        {PRESETS.map((preset) => {
          const active = value === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-pressed={active}
              title={preset.value}
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                active
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <p className="mt-auto text-xs leading-5 text-zinc-500">
        Runs are simulated in the selected IANA timezone. Auto-detected from your
        browser on first load.
      </p>
    </div>
  );
}
