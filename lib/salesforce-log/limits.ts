/**
 * Presentation metadata for Salesforce governor limits: friendly labels for
 * the raw `Number of …` / `Maximum …` names emitted inside LIMIT_USAGE_FOR_NS
 * blocks, plus the usage thresholds the UI colors against.
 *
 * Salesforce doubles several caps for asynchronous Apex (100 → 200 SOQL
 * queries, 150 → 200 DML statements, 10s → 60s CPU). The analyzer always
 * reports the `out of` maximum the log itself declares, so no hardcoded
 * limits are used for computation — only for labeling.
 */

export const LIMIT_WARN_PCT = 70;
export const LIMIT_CRITICAL_PCT = 90;

const LIMIT_LABELS: Record<string, string> = {
  "Number of SOQL queries": "SOQL queries",
  "Number of query rows": "SOQL query rows",
  "Number of SOSL queries": "SOSL queries",
  "Number of DML statements": "DML statements",
  "Number of DML rows": "DML rows",
  "Maximum CPU time": "CPU time (ms)",
  "Maximum heap size": "Heap size (bytes)",
  "Number of callouts": "Callouts (HTTP requests)",
  "Number of Email Invocations": "Email invocations",
  "Number of future calls": "Future calls",
  "Number of queueable jobs added": "Queueable jobs added",
  "Number of Mobile Apex push calls": "Mobile Apex push calls",
  "Number of mobile Apex push calls": "Mobile Apex push calls",
  "Number of push notification operations": "Push notification operations",
  "Number of DML rows processed via bulk API": "DML rows via bulk API",
};

/** Short display label for a raw limit name, with a sane fallback. */
export function limitLabel(name: string): string {
  const known = LIMIT_LABELS[name];
  if (known) return known;
  return name.replace(/^Number of\s+/i, "").trim();
}

export type UsageTone = "ok" | "warn" | "critical";

export function usageTone(pct: number, closeToLimit = false): UsageTone {
  if (closeToLimit || pct >= LIMIT_CRITICAL_PCT) return "critical";
  if (pct >= LIMIT_WARN_PCT) return "warn";
  return "ok";
}
