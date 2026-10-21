"use client";

import * as React from "react";
import {
  isCurlParseError,
  parseCurl,
  transpileCurl,
  type ParsedCurlRequest,
  type TranspileTarget,
} from "@/lib/curl";

const DEFAULT_DEBOUNCE_MS = 100;

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export type UseCurlConverterOptions = {
  initialCommand?: string;
  initialTarget?: TranspileTarget;
  debounceMs?: number;
};

export function useCurlConverter({
  initialCommand = "",
  initialTarget = "fetch",
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCurlConverterOptions = {}) {
  const [command, setCommand] = React.useState(initialCommand);
  const [target, setTarget] = React.useState<TranspileTarget>(initialTarget);
  const debouncedCommand = useDebouncedValue(command, debounceMs);

  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [request, setRequest] = React.useState<ParsedCurlRequest | null>(null);

  React.useEffect(() => {
    const trimmed = debouncedCommand.trim();
    if (!trimmed) {
      setOutput("");
      setError(null);
      setRequest(null);
      return;
    }
    try {
      setOutput(transpileCurl(trimmed, target));
      setRequest(parseCurl(trimmed));
      setError(null);
    } catch (caught) {
      setError(
        isCurlParseError(caught)
          ? caught.message
          : `Unexpected error: ${caught instanceof Error ? caught.message : String(caught)}`,
      );
    }
  }, [debouncedCommand, target]);

  const clear = React.useCallback(() => {
    setCommand("");
  }, []);

  const loadCommand = React.useCallback((next: string) => {
    setCommand(next);
  }, []);

  return {
    command,
    setCommand,
    target,
    setTarget,
    output,
    error,
    request,
    clear,
    loadCommand,
  };
}
