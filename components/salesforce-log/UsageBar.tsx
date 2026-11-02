import { cn } from "@/lib/utils";
import type { UsageTone } from "@/lib/salesforce-log/limits";

const TONE_BAR: Record<UsageTone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  critical: "bg-red-500",
};

export type UsageBarProps = {
  /** 0–100. Values above 100 are clamped; a 1.5% floor keeps marks visible. */
  pct: number;
  tone: UsageTone;
  className?: string;
};

/** Horizontal governor-usage meter shared by the Summary and Limits tabs. */
export function UsageBar({ pct, tone, className }: UsageBarProps) {
  const width = Math.min(100, Math.max(pct, 1.5));
  return (
    <div
      role="presentation"
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-zinc-800", className)}
    >
      <div className={cn("h-full rounded-full", TONE_BAR[tone])} style={{ width: `${width}%` }} />
    </div>
  );
}
