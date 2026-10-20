"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type TabsProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onKeyDown"> & {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  idPrefix?: string;
};

export function Tabs({ tabs, value, onValueChange, idPrefix = "dt", className, ...props }: TabsProps) {
  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const enabled = tabs.filter((tab) => !tab.disabled);
    if (enabled.length === 0) return;

    const currentIndex = enabled.findIndex((tab) => tab.value === value);
    let target: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        target = (currentIndex + 1) % enabled.length;
        break;
      case "ArrowLeft":
        target = (currentIndex - 1 + enabled.length) % enabled.length;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = enabled.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = enabled[target];
    if (next) {
      onValueChange(next.value);
      buttonRefs.current[next.value]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1",
        className
      )}
      {...props}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              buttonRefs.current[tab.value] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.value}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.value}`}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "inline-flex h-7 items-center rounded-md px-3 text-sm font-medium transition-colors",
              selected
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200",
              tab.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type TabPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  activeValue: string;
  idPrefix?: string;
};

export function TabPanel({ value, activeValue, idPrefix = "dt", className, children, ...props }: TabPanelProps) {
  const inactive = value !== activeValue;

  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={inactive ? -1 : 0}
      hidden={inactive}
      className={cn(
        "mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
