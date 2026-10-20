import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "info" | "outline";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "border-zinc-700 bg-zinc-800 text-zinc-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  outline: "border-zinc-700 bg-transparent text-zinc-400",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-4",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
