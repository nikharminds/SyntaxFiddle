"use client";

import * as React from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatUsToMs } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis, LogErrorEvent, LogErrorSeverity } from "@/lib/salesforce-log/types";

const SEVERITY_STYLES: Record<LogErrorSeverity, string> = {
  fatal: "border-red-500/40 bg-red-500/10 text-red-300",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const SEVERITY_LABELS: Record<LogErrorSeverity, string> = {
  fatal: "Fatal",
  error: "Error",
  warning: "Warning",
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Legacy fallback for non-secure contexts where the async clipboard API
    // is unavailable (e.g. plain-HTTP self-hosting).
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");
  const timerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const onCopy = async () => {
    const ok = await copyText(text);
    setState(ok ? "copied" : "failed");
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState("idle"), 2_000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void onCopy()}
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px] font-medium transition-colors",
          state === "copied"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
        )}
      >
        {state === "copied" ? (
          <Check size={12} aria-hidden />
        ) : (
          <Copy size={12} aria-hidden />
        )}
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? "Error details copied to clipboard"
          : state === "failed"
            ? "Copy to clipboard failed"
            : ""}
      </span>
    </>
  );
}

function ErrorCard({ event, index }: { event: LogErrorEvent; index: number }) {
  const copyPayload =
    event.stack.length > 0
      ? `${event.message}\n\n${event.stack.join("\n")}`
      : event.message;

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn("font-semibold", SEVERITY_STYLES[event.severity])}
          aria-label={`Severity: ${SEVERITY_LABELS[event.severity]}`}
        >
          {SEVERITY_LABELS[event.severity]}
        </Badge>
        <span className="font-mono text-xs text-zinc-500">{event.kind}</span>
        {event.elapsedUs !== null ? (
          <span className="font-mono text-[11px] text-zinc-600">
            t+{formatUsToMs(event.elapsedUs)}
          </span>
        ) : null}
        {event.apexLine !== null ? (
          <span className="font-mono text-[11px] text-zinc-600">
            Apex line {event.apexLine}
          </span>
        ) : null}
        {event.logLine !== null ? (
          <span className="font-mono text-[11px] text-zinc-600">
            log line {event.logLine}
          </span>
        ) : null}
        <span className="ml-auto">
          <CopyButton text={copyPayload} />
        </span>
      </div>

      <p className="mt-2 break-all font-mono text-[13px] leading-6 text-zinc-200">
        {event.message}
      </p>

      {event.stack.length > 0 ? (
        <pre className="mt-2.5 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-zinc-800 bg-black/40 p-3 font-mono text-xs leading-5 text-zinc-400">
          {event.stack.join("\n")}
        </pre>
      ) : null}
      <span className="sr-only">Error {index + 1} of the captured list.</span>
    </li>
  );
}

/** Errors tab: exceptions, fatal errors, and error-level debugs, isolated. */
export function ErrorsPanel({ analysis }: { analysis: DebugLogAnalysis }) {
  const { errors } = analysis;

  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 size={22} className="text-emerald-400" aria-hidden />
        <p className="text-sm text-zinc-300">No exceptions or fatal errors were detected.</p>
        <p className="max-w-md text-xs leading-5 text-zinc-500">
          This tab collects FATAL_ERROR and EXCEPTION_THROWN events, USER_DEBUG output at
          ERROR and WARN level, and anonymous-Apex compile failures.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Captured errors">
      {errors.map((event, index) => (
        <ErrorCard key={`${event.kind}-${index}`} event={event} index={index} />
      ))}
    </ul>
  );
}
