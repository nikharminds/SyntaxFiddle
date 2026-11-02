/**
 * Domain model for the Salesforce Debug Log Analyzer.
 *
 * Produced by `lib/salesforce-log/parser.ts` — a single-pass, allocation-lean
 * engine that runs inside `workers/logParser.worker.ts` — and consumed by the
 * UI panels. Every collection in this model is hard-capped by the parser, so
 * a pathological 20 MB log can never balloon the postMessage payload or the
 * main-thread heap (see `coverage` flags).
 */

export type DebugLevelSetting = {
  /** Trace-flag category, e.g. "APEX_CODE" or "SOQL". */
  category: string;
  /** Level for the category, e.g. "DEBUG", "FINE", "NONE". */
  level: string;
};

export type LimitUsageEntry = {
  /** Canonical Salesforce limit name, e.g. "Number of SOQL queries". */
  name: string;
  /** Short display label from `limits.ts`, falling back to `name`. */
  label: string;
  /** Usage reported by the FINAL LIMIT_USAGE_FOR_NS block for this namespace. */
  current: number;
  /** The `out of` maximum declared in the same block. */
  max: number;
  /** `current / max * 100`, clamped to 0 when max is 0. */
  percentage: number;
  /** True when the final block flags the limit `******* CLOSE TO LIMIT`. */
  closeToLimit: boolean;
};

export type NamespaceLimitUsage = {
  /** Raw namespace token: "(default)" or a managed-package namespace. */
  namespace: string;
  /** Entries sorted by percentage, highest first. */
  entries: LimitUsageEntry[];
};

export type SoqlQueryStat = {
  /** Query text as first seen (whitespace-normalized for grouping). */
  query: string;
  /** Total executions of this exact query. */
  calls: number;
  /** Sum of rows returned across executions with a paired END. */
  totalRows: number;
  /** False when no SOQL_EXECUTE_END reported Rows for any execution. */
  rowsKnown: boolean;
  /** Sum of Aggregations across executions (0 when never reported). */
  aggregations: number;
  /** Earliest BEGIN, microseconds since EXECUTION_STARTED. */
  firstElapsedUs: number;
  /** Latest BEGIN, microseconds since EXECUTION_STARTED. */
  lastElapsedUs: number;
  /** Physical log line of the first BEGIN. */
  firstLogLine: number;
  /** Sum of BEGIN→END durations for paired executions. */
  totalDurationUs: number;
  /** Executions that had a matching SOQL_EXECUTE_END. */
  measuredCalls: number;
  /** Slowest single paired execution. */
  maxDurationUs: number;
  /** True when SOQL_EXECUTE_EXPLAIN reported a TableScan for any execution. */
  nonSelective: boolean;
  /** True when this query belongs to a flagged N+1 structural shape. */
  nPlusOne: boolean;
};

export type SoslQueryStat = {
  query: string;
  rows: number | null;
  elapsedUs: number;
  /** SOSL_EXECUTE_BEGIN → SOSL_EXECUTE_END duration; null when END is missing. */
  durationUs: number | null;
  logLine: number;
};

export type DmlStatementStat = {
  /** DML operation: Insert, Update, Upsert, Delete, Undelete, Merge, … */
  op: string;
  /** sObject API name, e.g. "Contact" or "npo01__Household__c". */
  type: string;
  calls: number;
  totalRows: number;
  firstElapsedUs: number;
  firstLogLine: number;
  /** Sum of DML_BEGIN→DML_END durations for paired statements. */
  totalDurationUs: number;
  /** Statements that had a matching DML_END. */
  measuredCalls: number;
  /** Slowest single paired statement. */
  maxDurationUs: number;
};

/** Per-statement SOQL detail (capped — see coverage.soqlDetailsTruncated). */
export type SoqlExecution = {
  /** The bracketed statement number from SOQL_EXECUTE_BEGIN[n]. */
  statementNumber: number;
  query: string;
  /** Rows from the paired END; null when END is missing. */
  rows: number | null;
  /** END offset − BEGIN offset in µs; null when END is missing (truncated log). */
  durationUs: number | null;
  startedAtUs: number;
  /** Physical line number of the BEGIN event. */
  logLine: number;
};

/** Per-statement DML detail (capped — see coverage.dmlDetailsTruncated). */
export type DmlExecution = {
  statementNumber: number;
  op: string;
  type: string;
  rows: number;
  durationUs: number | null;
  startedAtUs: number;
  logLine: number;
};

export type DebugStatement = {
  /** DEBUG, INFO, WARN, ERROR, FINE, FINER, FINEST. */
  level: string;
  message: string;
  elapsedUs: number;
  /** Apex source line from the `[n]` field, when present. */
  apexLine: number | null;
  logLine: number;
};

export type LogErrorSeverity = "fatal" | "error" | "warning";

export type LogErrorEvent = {
  severity: LogErrorSeverity;
  /** Originating event: FATAL_ERROR, EXCEPTION_THROWN, USER_DEBUG, or "Compilation error". */
  kind: string;
  message: string;
  /** Microseconds since execution start; null for header-level compile errors. */
  elapsedUs: number | null;
  /** Apex source line when the event carried a `[line]` field. */
  apexLine: number | null;
  /** Physical log line of the event. */
  logLine: number | null;
  /** Continuation lines captured under a FATAL_ERROR / STACK_FRAME_DESCRIPTION. */
  stack: string[];
};

export type DebugLogCounts = {
  soqlQueries: number;
  soqlRows: number;
  soslQueries: number;
  callouts: number;
  dmlStatements: number;
  dmlRows: number;
  exceptions: number;
  fatalErrors: number;
  userDebugLines: number;
  codeUnits: number;
};

/**
 * Which bounded collections hit their caps. Totals in `counts` are always
 * complete; only the detail/group lists stop growing past their caps.
 */
export type AnalysisCoverage = {
  soqlDetailsTruncated: boolean;
  dmlDetailsTruncated: boolean;
  debugStatementsTruncated: boolean;
  errorsTruncated: boolean;
  queryGroupsTruncated: boolean;
  nPlusOneTruncated: boolean;
};

export type NPlusOneSeverity = "high" | "medium";

/**
 * A group of SOQL queries sharing the same normalized structure (literals
 * and value lists masked) that executed repeatedly — the classic signature
 * of a query running inside a loop.
 */
export type NPlusOneWarning = {
  /** Masked structural shape shared by every member query. */
  structuralKey: string;
  /** First-seen concrete query, for display. */
  representativeQuery: string;
  /** Distinct query texts sharing this structure. */
  variants: number;
  /** Total executions across all variants. */
  calls: number;
  /** Total rows returned across all executions. */
  totalRows: number;
  /** Slowest single execution in the shape. */
  maxDurationUs: number;
  severity: NPlusOneSeverity;
};

export type DebugLogAnalysis = {
  /** API version from the log header line ("60.0"), when present. */
  logVersion: string | null;
  debugLevels: DebugLevelSetting[];
  /** Username from the first USER_INFO event. */
  executedBy: string | null;
  /** First CODE_UNIT_STARTED name (the log's entry point). */
  entryPoint: string | null;
  lineCount: number;
  charCount: number;
  /** UTF-8 byte size, computed by the caller (TextEncoder) or locally. */
  byteSize: number;
  /** Highest microsecond offset seen — total time covered by the log. */
  elapsedUs: number;
  wallClockStart: string | null;
  wallClockEnd: string | null;
  /** True when truncation markers (`*** Skipped N bytes …`) were found. */
  truncated: boolean;
  truncationNotes: string[];
  /** Non-default namespaces seen via ENTERING_MANAGED_PKG / LIMIT_USAGE_FOR_NS. */
  namespaces: string[];
  counts: DebugLogCounts;
  limits: NamespaceLimitUsage[];
  /** Grouped per query, sorted by total rows desc. */
  soql: SoqlQueryStat[];
  sosl: SoslQueryStat[];
  /** Grouped per op+type, sorted by rows desc. */
  dml: DmlStatementStat[];
  /** Chronological per-statement SOQL detail (capped). */
  soqlExecutions: SoqlExecution[];
  /** Chronological per-statement DML detail (capped). */
  dmlExecutions: DmlExecution[];
  /** USER_DEBUG output (capped), regardless of level. */
  debugStatements: DebugStatement[];
  /** Chronological captured error events (capped). */
  errors: LogErrorEvent[];
  /** Potential N+1 query shapes, sorted by executions desc (capped). */
  nPlusOne: NPlusOneWarning[];
  coverage: AnalysisCoverage;
  /** Wall-clock time the parse itself took. */
  durationMs: number;
};
