"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function CopyButton({ value, label = "Copy", className, disabled = false }: CopyButtonProps) {
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: value,
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by your browser.",
        variant: "error",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </button>
  );
}
