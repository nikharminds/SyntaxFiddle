import { limitLabel } from "./limits";
import type {
  AnalysisCoverage,
  DebugLevelSetting,
  DebugLogAnalysis,
  DebugLogCounts,
  DebugStatement,
  DmlExecution,
  DmlStatementStat,
  LimitUsageEntry,
  LogErrorEvent,
  NamespaceLimitUsage,
  NPlusOneWarning,
  SoqlExecution,
  SoqlQueryStat,
  SoslQueryStat,
} from "./types";

/* ------------------------------------------------------------------ *
 * Compiled-once patterns (module scope — never re-created per call). *
 *                                                                    *
 * Every pattern below is linear: character classes and fixed anchors *
 * only, no nested quantifiers, so backtracking is bounded and the    *
 * engine runs in effectively O(chars) per pass.                      *
 * ------------------------------------------------------------------ */

/**
 * THE master scanner. Matches every timestamped event line in a single
 * regex pass over the raw string:
 *
 *   12:31:07.0 (11598292)|SOQL_EXECUTE_BEGIN[9]|Aggregations:0|SELECT …
 *   └─ clock ─┘ └ offset ┘└── event ──┘└n┘└───── remainder ──────────┘
 *
 * `^…$` with the `m` flag anchor per line; the remainder uses `[^\n]*`
 * (a linear class) instead of `.*` to avoid any newline ambiguity. The
 * parenthesized offset is microseconds since EXECUTION_STARTED — the only
 * trustworthy timing source in the log.
 */
const EVENT_PATTERN =
  /^(\d{2}:\d{2}:\d{2}\.\d+)\s*\((\d+)\)\|([A-Z_]+)(?:\[(\d+)\])?(?:\|([^\n]*))?$/gm;

/** One limit line inside a LIMIT_USAGE_FOR_NS block. */
const LIMIT_LINE_PATTERN =
  /^\s*((?:Number of|Maximum)\b[^:]*):\s*([\d,]+)\s+out of\s+([\d,]+)/i;

/** Log header line: `60.0 APEX_CODE,DEBUG;APEX_PROFILING,NONE;…` */
const HEADER_PATTERN =
  /^(\d+(?:\.\d+)?)\s+((?:[A-Z_]+,[A-Za-z]+)(?:;[A-Z_]+,[A-Za-z]+)*)\s*$/;

/** Anonymous-Apex compile failures surface as plain `Error: Line …` lines. */
const COMPILE_ERROR_PATTERN = /^Error:\s*(Line\s+\d+,\s*Column\s+\d+.*)$/i;

const TRUNCATION_TEST = /bytes\s+of\s+detailed\s+log|MAX_LOG_SIZE_OVERRIDE/i;
const CLOSE_TO_LIMIT_TEST = /CLOSE\s+TO\s+LIMIT/i;

const DEFAULT_NAMESPACE = "(default)";

/* Bounded-collection caps. Totals (counts.*) are always complete; only the *
 * detail lists below stop growing, so a pathological 20 MB log can never   *
 * build unbounded arrays that would crush the structured-clone transfer.   */
const MAX_SOQL_DETAILS = 1_000;
const MAX_DML_DETAILS = 1_000;
const MAX_DEBUG_STATEMENTS = 2_000;
const MAX_ERROR_EVENTS = 5_000;
const MAX_QUERY_GROUPS = 20_000;
const MAX_STACK_FRAMES = 100;

/* N+1 heuristic thresholds: a structural shape (literals + value lists
 * masked) with ≥ 3 executions is flagged; ≥ 10 escalates to high severity. */
const N_PLUS_ONE_MIN_CALLS = 3;
const N_PLUS_ONE_HIGH_CALLS = 10;
const MAX_N_PLUS_ONE_WARNINGS = 50;

export type AnalyzeDebugLogOptions = {
  /** UTF-8 byte size when the caller already computed it (workers use TextEncoder). */
  byteSize?: number;
};

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function parseCount(raw: string | undefined): number {
  if (!raw) return 0;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

/** `[7]` → 7; `[EXTERNAL]`, `[]`, missing → null. */
function bracketInt(field: string | undefined): number | null {
  if (!field) return null;
  const match = field.match(/^\[(\d+)\]$/);
  return match ? Number(match[1] ?? "0") : null;
}

/**
 * Structural fingerprint for N+1 detection: masks string literals, numeric
 * literals, and value/IN-lists into placeholders, then collapses whitespace
 * and case. Two queries sharing this key differ only in their filter values
 * — i.e. the same statement re-run with different bindings (a loop).
 *
 * Literal masking runs FIRST so numbers/commas inside quoted strings never
 * fragment the shape. Runs in linear time per query and only once per
 * distinct query group — never per execution.
 */
function structuralQueryKey(query: string): string {
  return query
    .replace(/'[^']*'/g, "?")
    .replace(/\b\d+(?:\.\d+)?\b/g, "?")
    .replace(/\(\s*\?(?:\s*,\s*\?)+\s*\)/g, "(?)")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Allocation-free newline count (never materializes substrings). */
function countNewlines(chunk: string): number {
  let total = 0;
  for (let index = chunk.indexOf("\n"); index !== -1; index = chunk.indexOf("\n", index + 1)) {
    total += 1;
  }
  return total;
}

type OpenSoql = {
  statementNumber: number;
  query: string;
  aggregations: number | null;
  startedAtUs: number;
  logLine: number;
};

type OpenDml = {
  statementNumber: number;
  op: string;
  type: string;
  rows: number;
  startedAtUs: number;
  logLine: number;
};

type OpenSosl = {
  query: string;
  startedAtUs: number;
  logLine: number;
};

/**
 * Single-pass analyzer for Salesforce debug logs — engineered for 20 MB
 * inputs:
 *
 *  1. ONE regex sweep (`EVENT_PATTERN` + `matchAll`) locates every
 *     timestamped event. The text is never `split("\n")` — that would
 *     materialize ~200k transient strings for a large log.
 *  2. A one-match lookahead turns each event into (event, region) pairs,
 *     where `region` is the small slice between this event's line end and
 *     the next event's start. Regions carry exactly the continuation data
 *     the event owns: LIMIT_USAGE_FOR_NS limit lines, FATAL_ERROR stack
 *     frames, truncation markers, compile errors.
 *  3. Physical line numbers come from an incremental newline counter —
 *     each character is counted at most once.
 *
 * Defensive behavior (truncated logs / missing end tags): unterminated
 * BEGINs are finalized with `durationUs: null` when a new statement reuses
 * the number or at end-of-log; orphan ENDs still credit row totals; every
 * detail collection is capped and flagged in `coverage`.
 */
export function analyzeDebugLog(
  text: string,
  options: AnalyzeDebugLogOptions = {},
): DebugLogAnalysis {
  const startedAt = now();

  /* ------------------------- accumulator state ------------------------ */
  let logVersion: string | null = null;
  const debugLevels: DebugLevelSetting[] = [];
  let executedBy: string | null = null;
  let entryPoint: string | null = null;
  let wallClockStart: string | null = null;
  let wallClockEnd: string | null = null;
  let elapsedUs = 0;

  const counts: DebugLogCounts = {
    soqlQueries: 0,
    soqlRows: 0,
    soslQueries: 0,
    callouts: 0,
    dmlStatements: 0,
    dmlRows: 0,
    exceptions: 0,
    fatalErrors: 0,
    userDebugLines: 0,
    codeUnits: 0,
  };

  const coverage: AnalysisCoverage = {
    soqlDetailsTruncated: false,
    dmlDetailsTruncated: false,
    debugStatementsTruncated: false,
    errorsTruncated: false,
    queryGroupsTruncated: false,
    nPlusOneTruncated: false,
  };

  const soqlExecutions: SoqlExecution[] = [];
  const dmlExecutions: DmlExecution[] = [];
  const debugStatements: DebugStatement[] = [];
  const errors: LogErrorEvent[] = [];
  const truncationNotes: string[] = [];
  const namespaces = new Set<string>();
  const soslCalls: SoslQueryStat[] = [];

  const openSoql = new Map<number, OpenSoql>();
  const openDml = new Map<number, OpenDml>();
  const openSosl = new Map<number, OpenSosl>();
  const soqlGroups = new Map<string, SoqlQueryStat>();
  const groupByStatementNumber = new Map<number, SoqlQueryStat | null>();
  const dmlStats = new Map<string, DmlStatementStat>();
  /** FINAL LIMIT_USAGE_FOR_NS block per namespace (later blocks replace). */
  const finalLimits = new Map<
    string,
    Map<string, { current: number; max: number; flagged: boolean }>
  >();

  /** Index into `errors` currently collecting stack frames, else null. */
  let openStackTarget: number | null = null;
  /** Namespace whose limit block owns the current continuation region. */
  let activeLimitNamespace: string | null = null;

  const pushError = (event: LogErrorEvent): void => {
    if (errors.length < MAX_ERROR_EVENTS) {
      errors.push(event);
    } else {
      coverage.errorsTruncated = true;
    }
  };

  /* ---------------------- continuation handling ----------------------- */

  const recordLimitLine = (
    namespace: string,
    line: string,
    name: string,
    current: string | undefined,
    max: string | undefined,
  ): void => {
    let block = finalLimits.get(namespace);
    if (!block) {
      block = new Map();
      finalLimits.set(namespace, block);
    }
    block.set(name, {
      current: parseCount(current),
      max: parseCount(max),
      flagged: CLOSE_TO_LIMIT_TEST.test(line),
    });
  };

  /**
   * The region between this event's line and the next event's first line.
   * Empty regions (the overwhelmingly common case) cost one length check.
   */
  const processRegion = (event: string, region: string): void => {
    if (region.length === 0 || event === "CUMULATIVE_LIMIT_USAGE") return;
    const limitNamespace = event === "LIMIT_USAGE_FOR_NS" ? activeLimitNamespace : null;
    const lines = region.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.length === 0) continue;
      if (limitNamespace !== null) {
        const match = line.match(LIMIT_LINE_PATTERN);
        if (match) {
          recordLimitLine(
            limitNamespace,
            line,
            (match[1] ?? "").replace(/\s+/g, " ").trim(),
            match[2],
            match[3],
          );
          continue;
        }
      }
      if (TRUNCATION_TEST.test(line)) {
        truncationNotes.push(line);
        continue;
      }
      const compileError = line.match(COMPILE_ERROR_PATTERN);
      if (compileError) {
        pushError({
          severity: "error",
          kind: "Compilation error",
          message: compileError[1] ?? line,
          elapsedUs: null,
          apexLine: null,
          logLine: null,
          stack: [],
        });
        continue;
      }
      if (openStackTarget !== null) {
        const target = errors[openStackTarget];
        if (target && target.stack.length < MAX_STACK_FRAMES) {
          target.stack.push(line);
        }
      }
    }
  };

  /* ------------------------- event dispatch --------------------------- */

  const finalizeSoql = (record: OpenSoql, durationUs: number | null, rows: number | null): void => {
    if (soqlExecutions.length < MAX_SOQL_DETAILS) {
      soqlExecutions.push({
        statementNumber: record.statementNumber,
        query: record.query,
        rows,
        durationUs,
        startedAtUs: record.startedAtUs,
        logLine: record.logLine,
      });
    } else {
      coverage.soqlDetailsTruncated = true;
    }
  };

  const finalizeDml = (record: OpenDml, durationUs: number | null): void => {
    if (dmlExecutions.length < MAX_DML_DETAILS) {
      dmlExecutions.push({
        statementNumber: record.statementNumber,
        op: record.op,
        type: record.type,
        rows: record.rows,
        durationUs,
        startedAtUs: record.startedAtUs,
        logLine: record.logLine,
      });
    } else {
      coverage.dmlDetailsTruncated = true;
    }
  };

  const soqlGroupFor = (
    query: string,
    startedAtUs: number,
    logLine: number,
  ): SoqlQueryStat | null => {
    const key = query.replace(/\s+/g, " ").trim().toLowerCase();
    const existing = soqlGroups.get(key);
    if (existing) {
      existing.calls += 1;
      existing.lastElapsedUs = startedAtUs;
      return existing;
    }
    if (soqlGroups.size >= MAX_QUERY_GROUPS) {
      coverage.queryGroupsTruncated = true;
      return null;
    }
    const created: SoqlQueryStat = {
      query,
      calls: 1,
      totalRows: 0,
      rowsKnown: false,
      aggregations: 0,
      firstElapsedUs: startedAtUs,
      lastElapsedUs: startedAtUs,
      firstLogLine: logLine,
      totalDurationUs: 0,
      measuredCalls: 0,
      maxDurationUs: 0,
      nonSelective: false,
      nPlusOne: false,
    };
    soqlGroups.set(key, created);
    return created;
  };

  const dmlGroupFor = (
    op: string,
    type: string,
    rows: number,
    startedAtUs: number,
    logLine: number,
  ): DmlStatementStat => {
    const key = `${op}|${type}`;
    const existing = dmlStats.get(key);
    if (existing) {
      existing.calls += 1;
      existing.totalRows += rows;
      return existing;
    }
    const created: DmlStatementStat = {
      op,
      type,
      calls: 1,
      totalRows: rows,
      firstElapsedUs: startedAtUs,
      firstLogLine: logLine,
      totalDurationUs: 0,
      measuredCalls: 0,
      maxDurationUs: 0,
    };
    dmlStats.set(key, created);
    return created;
  };

  const processEvent = (
    event: string,
    statementNumber: number,
    remainder: string,
    offsetUs: number,
    clock: string | null,
    logLine: number,
  ): void => {
    // Any timestamped event closes limit-block scope; only the two stack
    // emitters keep the stack target open for their own frames.
    activeLimitNamespace = null;
    if (event !== "FATAL_ERROR" && event !== "STACK_FRAME_DESCRIPTION") {
      openStackTarget = null;
    }

    switch (event) {
      case "USER_INFO": {
        const username = remainder.split("|")[2];
        if (!executedBy && username && username.trim().length > 0) {
          executedBy = username.trim();
        }
        return;
      }
      case "CODE_UNIT_STARTED": {
        const fields = remainder.split("|");
        // Trigger units carry an extra id field: [EXTERNAL]|01q…|Name.
        const unitName = fields.length > 2 ? fields[2] : fields[1];
        if (unitName && unitName.trim().length > 0) {
          counts.codeUnits += 1;
          if (!entryPoint) entryPoint = unitName.trim();
        }
        return;
      }
      case "USER_DEBUG": {
        const fields = remainder.split("|");
        counts.userDebugLines += 1;
        const level = (fields[1] ?? "").trim().toUpperCase() || "DEBUG";
        const message = fields.slice(2).join("|").trim() || "(empty message)";
        const apexLine = bracketInt(fields[0]);
        if (debugStatements.length < MAX_DEBUG_STATEMENTS) {
          debugStatements.push({ level, message, elapsedUs: offsetUs, apexLine, logLine });
        } else {
          coverage.debugStatementsTruncated = true;
        }
        if (level === "ERROR" || level === "WARN") {
          pushError({
            severity: level === "ERROR" ? "error" : "warning",
            kind: "USER_DEBUG",
            message,
            elapsedUs: offsetUs,
            apexLine,
            logLine,
            stack: [],
          });
        }
        return;
      }
      case "SOQL_EXECUTE_BEGIN": {
        const fields = remainder.split("|");
        const first = fields[0] ?? "";
        const aggregations = first.startsWith("Aggregations:")
          ? parseCount(first.slice("Aggregations:".length))
          : null;
        const query = (
          aggregations === null ? fields : fields.slice(1)
        )
          .join("|")
          .trim();
        counts.soqlQueries += 1;
        const group = soqlGroupFor(query, offsetUs, logLine);
        groupByStatementNumber.set(statementNumber, group);
        if (group && aggregations !== null) group.aggregations += aggregations;
        // Defensive: statement numbers are reused across transactions. If the
        // previous holder of this number never ended, close it out unpaired.
        const stale = openSoql.get(statementNumber);
        if (stale) {
          finalizeSoql(stale, null, null);
          openSoql.delete(statementNumber);
        }
        openSoql.set(statementNumber, {
          statementNumber,
          query,
          aggregations,
          startedAtUs: offsetUs,
          logLine,
        });
        return;
      }
      case "SOQL_EXECUTE_END": {
        const rowsField = remainder
          .split("|")
          .find((field) => /^Rows:/i.test(field));
        if (!rowsField) return;
        const rows = parseCount(rowsField.slice("Rows:".length));
        counts.soqlRows += rows; // credited even for orphan ENDs (truncated head)
        const record = openSoql.get(statementNumber);
        if (!record) return;
        openSoql.delete(statementNumber);
        const durationUs = Math.max(0, offsetUs - record.startedAtUs);
        finalizeSoql(record, durationUs, rows);
        const group = soqlGroups.get(
          record.query.replace(/\s+/g, " ").trim().toLowerCase(),
        );
        if (group) {
          group.totalRows += rows;
          group.rowsKnown = true;
          group.totalDurationUs += durationUs;
          group.measuredCalls += 1;
          if (durationUs > group.maxDurationUs) group.maxDurationUs = durationUs;
        }
        return;
      }
      case "SOQL_EXECUTE_EXPLAIN": {
        if (!remainder.includes("TableScan:")) return;
        const group = groupByStatementNumber.get(statementNumber);
        if (group) group.nonSelective = true;
        return;
      }
      case "SOSL_EXECUTE_BEGIN": {
        counts.soslQueries += 1;
        const stale = openSosl.get(statementNumber);
        if (stale) openSosl.delete(statementNumber);
        openSosl.set(statementNumber, {
          query: remainder.trim(),
          startedAtUs: offsetUs,
          logLine,
        });
        return;
      }
      case "SOSL_EXECUTE_END": {
        const rowsField = remainder
          .split("|")
          .find((field) => /^Rows:/i.test(field));
        const record = openSosl.get(statementNumber);
        if (!rowsField || !record) return;
        openSosl.delete(statementNumber);
        soslCalls.push({
          query: record.query,
          rows: parseCount(rowsField.slice("Rows:".length)),
          elapsedUs: record.startedAtUs,
          durationUs: Math.max(0, offsetUs - record.startedAtUs),
          logLine: record.logLine,
        });
        return;
      }
      case "DML_BEGIN": {
        let op = "Unknown";
        let type = "Unknown";
        let rows = 0;
        for (const field of remainder.split("|")) {
          if (field.startsWith("Op:")) {
            op = field.slice("Op:".length) || op;
          } else if (field.startsWith("Type:")) {
            type = field.slice("Type:".length) || type;
          } else if (field.startsWith("rows:")) {
            rows = parseCount(field.slice("rows:".length));
          }
        }
        counts.dmlStatements += 1;
        counts.dmlRows += rows;
        dmlGroupFor(op, type, rows, offsetUs, logLine);
        const stale = openDml.get(statementNumber);
        if (stale) {
          finalizeDml(stale, null);
          openDml.delete(statementNumber);
        }
        openDml.set(statementNumber, {
          statementNumber,
          op,
          type,
          rows,
          startedAtUs: offsetUs,
          logLine,
        });
        return;
      }
      case "DML_END": {
        const record = openDml.get(statementNumber);
        if (!record) return;
        openDml.delete(statementNumber);
        const durationUs = Math.max(0, offsetUs - record.startedAtUs);
        finalizeDml(record, durationUs);
        const group = dmlStats.get(`${record.op}|${record.type}`);
        if (group) {
          group.totalDurationUs += durationUs;
          group.measuredCalls += 1;
          if (durationUs > group.maxDurationUs) group.maxDurationUs = durationUs;
        }
        return;
      }
      case "LIMIT_USAGE_FOR_NS": {
        const namespace =
          (remainder.split("|")[0] ?? DEFAULT_NAMESPACE).trim() || DEFAULT_NAMESPACE;
        activeLimitNamespace = namespace;
        if (namespace !== DEFAULT_NAMESPACE) namespaces.add(namespace);
        return;
      }
      case "ENTERING_MANAGED_PKG": {
        const namespace = remainder.trim();
        if (namespace) namespaces.add(namespace);
        return;
      }
      case "CALLOUT_REQUEST": {
        counts.callouts += 1;
        return;
      }
      case "EXCEPTION_THROWN": {
        const fields = remainder.split("|");
        counts.exceptions += 1;
        pushError({
          severity: "error",
          kind: "EXCEPTION_THROWN",
          message: fields.slice(1).join("|").trim() || "(empty message)",
          elapsedUs: offsetUs,
          apexLine: bracketInt(fields[0]),
          logLine,
          stack: [],
        });
        openStackTarget = errors.length - 1;
        return;
      }
      case "FATAL_ERROR": {
        counts.fatalErrors += 1;
        pushError({
          severity: "fatal",
          kind: "FATAL_ERROR",
          message: remainder.trim() || "(empty message)",
          elapsedUs: offsetUs,
          apexLine: null,
          logLine,
          stack: [],
        });
        openStackTarget = errors.length - 1;
        return;
      }
      case "STACK_FRAME_DESCRIPTION": {
        if (openStackTarget === null) return;
        const fields = remainder.split("|");
        const frame = fields.slice(1).join("|").trim() || (fields[0] ?? "").trim();
        const target = errors[openStackTarget];
        if (frame && target && target.stack.length < MAX_STACK_FRAMES) {
          target.stack.push(frame);
        }
        return;
      }
      default:
        return;
    }
  };

  /* ------------------------- the single pass -------------------------- */

  const lineCount =
    text.length === 0 ? 0 : countNewlines(text) + (text.endsWith("\n") ? 0 : 1);

  const matches = text.matchAll(EVENT_PATTERN);
  let current = matches.next();

  // Text before the first event: header, `Execute Anonymous:` lines,
  // compile errors, and any leading truncation markers.
  const preRegion = current.done ? text : text.slice(0, current.value.index ?? 0);
  if (preRegion.length > 0) {
    const headerLine = preRegion
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    const header = headerLine?.match(HEADER_PATTERN);
    if (header) {
      logVersion = header[1] ?? null;
      for (const pair of (header[2] ?? "").split(";")) {
        const [category, level] = pair.split(",");
        if (category && level) {
          debugLevels.push({ category: category.trim(), level: level.trim() });
        }
      }
    }
    processRegion("", preRegion);
  }

  let lineNo = 1 + countNewlines(preRegion);

  while (!current.done) {
    const match = current.value;
    const next = matches.next();
    const nextIndex = next.done ? text.length : next.value.index ?? text.length;
    const eventStart = match.index ?? 0;
    const eventEnd = eventStart + match[0].length;
    const region = text.slice(eventEnd, nextIndex);

    const clock = match[1] ?? null;
    if (clock) {
      if (wallClockStart === null) wallClockStart = clock;
      wallClockEnd = clock;
    }

    const offsetUs = Number(match[2] ?? "0");
    if (Number.isFinite(offsetUs) && offsetUs > elapsedUs) elapsedUs = offsetUs;

    const statementNumber = match[4] !== undefined ? Number(match[4]) : 0;

    processEvent(
      match[3] ?? "",
      Number.isFinite(statementNumber) ? statementNumber : 0,
      match[5] ?? "",
      offsetUs,
      clock,
      lineNo,
    );
    processRegion(match[3] ?? "", region);

    // `region` begins with the event line's own terminator (the `$` anchor
    // stops before it), so its newline count alone advances the line number —
    // one for the event line, plus one per continuation line that follows.
    lineNo += countNewlines(region);
    current = next;
  }

  // Defensive close-out: statements still open at end-of-log lost their END
  // to truncation — record them unpaired instead of silently dropping them.
  for (const record of openSoql.values()) finalizeSoql(record, null, null);
  for (const record of openDml.values()) finalizeDml(record, null);

  /* --------------------------- projection ----------------------------- */

  const limits: NamespaceLimitUsage[] = [...finalLimits.entries()]
    .map(([namespace, entries]) => {
      const mapped: LimitUsageEntry[] = [...entries.entries()].map(([name, entry]) => ({
        name,
        label: limitLabel(name),
        current: entry.current,
        max: entry.max,
        percentage:
          entry.max > 0 ? Math.min(100, (entry.current / entry.max) * 100) : 0,
        closeToLimit: entry.flagged,
      }));
      mapped.sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name));
      return { namespace, entries: mapped };
    })
    .sort((a, b) =>
      a.namespace === DEFAULT_NAMESPACE
        ? -1
        : b.namespace === DEFAULT_NAMESPACE
          ? 1
          : a.namespace.localeCompare(b.namespace),
    );

  const soql = [...soqlGroups.values()].sort(
    (a, b) => b.totalRows - a.totalRows || b.calls - a.calls || a.query.localeCompare(b.query),
  );

  /* --------------------------- N+1 detection -------------------------- *
   * One O(groups) pass re-groups query statistics by structural shape.    *
   * Shapes with ≥ N_PLUS_ONE_MIN_CALLS executions become warnings; every  *
   * member group is marked so the SOQL table can badge individual rows.   */
  const nPlusOneShapes = new Map<
    string,
    { members: SoqlQueryStat[]; calls: number; rows: number; maxDurationUs: number }
  >();
  for (const stat of soql) {
    const key = structuralQueryKey(stat.query);
    const shape = nPlusOneShapes.get(key);
    if (shape) {
      shape.members.push(stat);
      shape.calls += stat.calls;
      shape.rows += stat.totalRows;
      if (stat.maxDurationUs > shape.maxDurationUs) shape.maxDurationUs = stat.maxDurationUs;
    } else {
      nPlusOneShapes.set(key, {
        members: [stat],
        calls: stat.calls,
        rows: stat.totalRows,
        maxDurationUs: stat.maxDurationUs,
      });
    }
  }
  const nPlusOne: NPlusOneWarning[] = [];
  for (const [structuralKey, shape] of nPlusOneShapes) {
    if (shape.calls < N_PLUS_ONE_MIN_CALLS) continue;
    for (const member of shape.members) member.nPlusOne = true;
    const representative = shape.members[0];
    nPlusOne.push({
      structuralKey,
      representativeQuery: representative ? representative.query : "",
      variants: shape.members.length,
      calls: shape.calls,
      totalRows: shape.rows,
      maxDurationUs: shape.maxDurationUs,
      severity: shape.calls >= N_PLUS_ONE_HIGH_CALLS ? "high" : "medium",
    });
  }
  nPlusOne.sort((a, b) => b.calls - a.calls || b.totalRows - a.totalRows);
  if (nPlusOne.length > MAX_N_PLUS_ONE_WARNINGS) {
    nPlusOne.length = MAX_N_PLUS_ONE_WARNINGS;
    coverage.nPlusOneTruncated = true;
  }

  const dml = [...dmlStats.values()].sort(
    (a, b) => b.totalRows - a.totalRows || b.calls - a.calls || a.op.localeCompare(b.op),
  );

  const byteSize =
    options.byteSize ??
    (typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(text).length
      : text.length);

  return {
    logVersion,
    debugLevels,
    executedBy,
    entryPoint,
    lineCount,
    charCount: text.length,
    byteSize,
    elapsedUs,
    wallClockStart,
    wallClockEnd,
    truncated: truncationNotes.length > 0,
    truncationNotes,
    namespaces: [...namespaces].sort(),
    counts,
    limits,
    soql,
    nPlusOne,
    sosl: soslCalls,
    dml,
    soqlExecutions,
    dmlExecutions,
    debugStatements,
    errors,
    coverage,
    durationMs: now() - startedAt,
  };
}
