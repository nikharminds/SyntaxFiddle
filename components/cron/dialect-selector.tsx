"use client";

import * as React from "react";
import type { CronDialect } from "@/lib/cron/dialects";
import { cn } from "@/lib/utils";

const OPTIONS: { id: CronDialect; label: string }[] = [
  { id: "unix", label: "Unix (Standard)" },
  { id: "aws", label: "AWS EventBridge" },
  { id: "quartz", label: "Quartz / Spring" },
  { id: "cloudflare", label: "Cloudflare Triggers" },
];

export type DialectSelectorProps = {
  value: CronDialect;
  onChange: (dialect: CronDialect) => void;
};

export function DialectSelector({ value, onChange }: DialectSelectorProps) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = OPTIONS.findIndex((option) => option.id === value);
    let target: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        target = (index + 1) % OPTIONS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        target = (index - 1 + OPTIONS.length) % OPTIONS.length;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = OPTIONS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = OPTIONS[target];
    if (next) {
      onChange(next.id);
      refs.current[next.id]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Cron dialect"
      onKeyDown={onKeyDown}
      className="grid w-full grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 sm:grid-cols-4"
    >
      {OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            ref={(node) => {
              refs.current[option.id] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
