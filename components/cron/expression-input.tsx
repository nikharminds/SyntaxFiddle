"use client";

import { AlignLeft } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import type { CronFieldDetail } from "@/lib/cron/engine";
import { cn } from "@/lib/utils";

const SHORT_NAMES: Record<string, string> = {
  Seconds: "Sec",
  Minute: "Min",
  Hour: "Hour",
  "Day of Month": "DOM",
  Month: "Month",
  "Day of Week": "DOW",
  Year: "Year",
};

export type ExpressionInputProps = {
  value: string;
  onChange: (value: string) => void;
  onFormat: () => void;
  fields: CronFieldDetail[];
  shareUrl: string;
};

export function ExpressionInput({ value, onChange, onFormat, fields, shareUrl }: ExpressionInputProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <label htmlFor="cron-expression" className="sr-only">
        Cron expression
      </label>
      <input
        id="cron-expression"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        maxLength={200}
        placeholder="*/15 * * * *"
        className="h-14 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 font-mono text-xl font-medium tracking-wider text-zinc-100 placeholder:text-zinc-600"
      />

      <ul className="mt-3 flex list-none flex-wrap gap-2" aria-label="Cron field breakdown">
        {fields.map((field) => {
          const invalid = !field.isValid;
          return (
            <li
              key={field.name}
              title={field.error ?? `Allowed: ${field.allowedRange}`}
              aria-label={`${field.name}: ${field.value === "" ? "empty" : field.value}${invalid ? " (invalid)" : ""}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                invalid
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              )}
            >
              <span className="font-semibold uppercase tracking-wide">
                {SHORT_NAMES[field.name] ?? field.name}
              </span>
              <span className="font-mono">{field.value === "" ? "—" : field.value}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onFormat}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          <AlignLeft size={14} />
          Format Spacing
        </button>
        <CopyButton value={value} label="Copy Expression" />
        <CopyButton value={shareUrl} label="Share URL" disabled={shareUrl === ""} />
      </div>
    </div>
  );
}
