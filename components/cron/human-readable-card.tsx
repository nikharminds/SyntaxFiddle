"use client";

import { AlertCircle, AlertTriangle, Sparkles } from "lucide-react";
import type { CronAnalysisResult } from "@/lib/cron/engine";

export type HumanReadableCardProps = {
  result: CronAnalysisResult;
  dialectLabel: string;
  timezone: string;
};

export function HumanReadableCard({ result, dialectLabel, timezone }: HumanReadableCardProps) {
  if (!result.isValid) {
    const broken = result.fields.filter((field) => !field.isValid);
    return (
      <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-1 shrink-0 text-red-400" />
          <div className="min-w-0">
            <p className="text-base font-semibold text-red-200">
              {result.errorMessage ?? "Invalid cron expression."}
            </p>
            {broken.length > 0 ? (
              <ul className="mt-3 list-none space-y-1.5">
                {broken.map((field) => (
                  <li key={field.name} className="text-sm text-red-100/90">
                    <span className="font-semibold text-red-200">{field.name}</span>
                    {field.value !== "" ? (
                      <>
                        {" "}
                        (<code className="rounded bg-zinc-950/60 px-1.5 py-0.5 font-mono text-xs">{field.value}</code>)
                      </>
                    ) : null}
                    {": "}
                    {field.error}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Sparkles size={20} className="mt-1 shrink-0 text-emerald-400" />
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-7 text-zinc-50">{result.humanReadable}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {dialectLabel} · evaluated in {timezone}
          </p>
          {result.errorMessage ? (
            <p className="mt-2 flex items-start gap-2 text-xs text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {result.errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
