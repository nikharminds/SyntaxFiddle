"use client";

import * as React from "react";
import { runRegex } from "@/lib/regex/engine";
import type { RegexRunResult } from "@/lib/regex/engine";
import { runRegexViaWorker } from "@/lib/regex/client";

export const REGEX_DEBOUNCE_MS = 150;

export type RegexExecutionMode = "worker" | "main-thread";

export type UseRegexOptions = {
  initialPattern?: string;
  initialFlags?: string;
  initialTestString?: string;
};

export function useRegex(options: UseRegexOptions = {}) {
  const [pattern, setPattern] = React.useState(options.initialPattern ?? "");
  const [flags, setFlags] = React.useState(options.initialFlags ?? "g");
  const [testString, setTestString] = React.useState(options.initialTestString ?? "");
  const [result, setResult] = React.useState<RegexRunResult | null>(null);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [executionMode, setExecutionMode] = React.useState<RegexExecutionMode>("worker");

  const runRef = React.useRef(0);

  React.useEffect(() => {
    if (pattern.length === 0) {
      runRef.current += 1;
      setIsEvaluating(false);
      setResult(null);
      return;
    }
    const run = ++runRef.current;
    setIsEvaluating(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        let outcome = await runRegexViaWorker(pattern, flags, testString);
        if (!outcome.ok && outcome.code === "worker-unavailable") {
          outcome = runRegex(pattern, flags, testString);
          setExecutionMode("main-thread");
        } else {
          setExecutionMode("worker");
        }
        if (runRef.current !== run) return;
        setResult(outcome);
        setIsEvaluating(false);
      })();
    }, REGEX_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [pattern, flags, testString]);

  const toggleFlag = React.useCallback((flag: string) => {
    setFlags((current) =>
      current.includes(flag) ? current.replace(flag, "") : `${current}${flag}`,
    );
  }, []);

  const clear = React.useCallback(() => {
    runRef.current += 1;
    setPattern("");
    setFlags("g");
    setTestString("");
    setIsEvaluating(false);
    setResult(null);
  }, []);

  const loadSample = React.useCallback(
    (sample: Required<UseRegexOptions>) => {
      setPattern(sample.initialPattern);
      setFlags(sample.initialFlags);
      setTestString(sample.initialTestString);
    },
    [],
  );

  return {
    pattern,
    setPattern,
    flags,
    setFlags,
    toggleFlag,
    testString,
    setTestString,
    result,
    isEvaluating,
    executionMode,
    clear,
    loadSample,
  };
}
