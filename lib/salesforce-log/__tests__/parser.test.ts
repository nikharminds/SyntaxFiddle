import { describe, expect, it } from "vitest";
import { analyzeDebugLog } from "../parser";
import { SAMPLE_LOG } from "../sample";

describe("analyzeDebugLog — bundled sample log", () => {
  const analysis = analyzeDebugLog(SAMPLE_LOG);

  it("extracts header metadata", () => {
    expect(analysis.logVersion).toBe("60.0");
    expect(analysis.debugLevels).toHaveLength(6);
    const apexCode = analysis.debugLevels.find((l) => l.category === "APEX_CODE");
    expect(apexCode?.level).toBe("DEBUG");
  });

  it("captures identity and timing", () => {
    expect(analysis.executedBy).toBe("developer@syntaxfiddle.dev");
    expect(analysis.entryPoint).toBe("execute_anonymous_apex");
    expect(analysis.elapsedUs).toBe(41_335_677);
    expect(analysis.wallClockStart).toBe("12:31:07.0");
    expect(analysis.wallClockEnd).toBe("12:31:07.2");
    expect(analysis.lineCount).toBe(37);
  });

  it("counts events", () => {
    expect(analysis.counts.soqlQueries).toBe(4);
    expect(analysis.counts.soqlRows).toBe(36_042);
    expect(analysis.counts.soslQueries).toBe(1);
    expect(analysis.counts.dmlStatements).toBe(2);
    expect(analysis.counts.dmlRows).toBe(9_501);
    expect(analysis.counts.callouts).toBe(1);
    expect(analysis.counts.exceptions).toBe(1);
    expect(analysis.counts.fatalErrors).toBe(0);
    expect(analysis.counts.userDebugLines).toBe(1);
    expect(analysis.counts.codeUnits).toBe(1);
  });

  it("pairs SOQL BEGIN/END into executions with duration and physical line numbers", () => {
    expect(analysis.soqlExecutions).toHaveLength(4);

    const account = analysis.soqlExecutions.find((e) => e.statementNumber === 9);
    expect(account?.rows).toBe(42);
    expect(account?.durationUs).toBe(12_391_154 - 11_598_292);
    expect(account?.startedAtUs).toBe(11_598_292);
    expect(account?.logLine).toBe(6);

    const first = analysis.soqlExecutions.find(
      (e) => e.statementNumber === 10 && e.startedAtUs === 12_907_451,
    );
    expect(first?.durationUs).toBe(13_994_794 - 12_907_451);
    expect(first?.logLine).toBe(9);

    const third = analysis.soqlExecutions.find(
      (e) => e.statementNumber === 10 && e.startedAtUs === 15_718_390,
    );
    expect(third?.rows).toBe(12_000);
    expect(third?.logLine).toBe(13);
  });

  it("aggregates execution time into per-query statistics", () => {
    const contacts = analysis.soql.find((s) => s.query.includes("FROM Contact"));
    expect(contacts?.calls).toBe(3);
    expect(contacts?.totalRows).toBe(36_000);
    expect(contacts?.rowsKnown).toBe(true);
    expect(contacts?.measuredCalls).toBe(3);
    expect(contacts?.totalDurationUs).toBe(
      13_994_794 - 12_907_451 + 15_519_716 - 14_730_946 + 16_509_572 - 15_718_390,
    );
    expect(contacts?.maxDurationUs).toBe(13_994_794 - 12_907_451);
    expect(contacts?.firstLogLine).toBe(9);
    expect(contacts?.nonSelective).toBe(false);

    const accounts = analysis.soql.find((s) => s.query.includes("FROM Account"));
    expect(accounts?.totalRows).toBe(42);
    expect(accounts?.nonSelective).toBe(true);
  });

  it("flags the repeated contact query as a Potential N+1", () => {
    expect(analysis.nPlusOne).toHaveLength(1);
    const warning = analysis.nPlusOne[0];
    expect(warning?.variants).toBe(1);
    expect(warning?.calls).toBe(3);
    expect(warning?.totalRows).toBe(36_000);
    expect(warning?.severity).toBe("medium");
    expect(warning?.representativeQuery).toContain("FROM Contact");
    expect(warning?.structuralKey).toContain("contact");

    const contacts = analysis.soql.find((s) => s.query.includes("FROM Contact"));
    expect(contacts?.nPlusOne).toBe(true);
    const accounts = analysis.soql.find((s) => s.query.includes("FROM Account"));
    expect(accounts?.nPlusOne).toBe(false);
  });

  it("captures SOSL queries with rows and duration", () => {
    expect(analysis.sosl).toHaveLength(1);
    expect(analysis.sosl[0]?.rows).toBe(17);
    expect(analysis.sosl[0]?.durationUs).toBe(17_201_985 - 16_711_180);
    expect(analysis.sosl[0]?.logLine).toBe(15);
  });

  it("pairs DML_BEGIN/DML_END with durations and line numbers", () => {
    expect(analysis.dmlExecutions).toHaveLength(2);

    const update = analysis.dmlExecutions.find((e) => e.statementNumber === 12);
    expect(update?.op).toBe("Update");
    expect(update?.type).toBe("Contact");
    expect(update?.rows).toBe(9_500);
    expect(update?.durationUs).toBe(35_302_111 - 18_080_381);
    expect(update?.logLine).toBe(18);

    const insert = analysis.dmlExecutions.find((e) => e.statementNumber === 13);
    expect(insert?.durationUs).toBe(40_752_160 - 38_432_263);
    expect(insert?.logLine).toBe(23);

    const updateGroup = analysis.dml.find((s) => s.op === "Update");
    expect(updateGroup?.measuredCalls).toBe(1);
    expect(updateGroup?.maxDurationUs).toBe(35_302_111 - 18_080_381);
  });

  it("extracts the FINAL LIMIT_USAGE_FOR_NS block as { current, max, percentage }", () => {
    expect(analysis.limits).toHaveLength(1);
    const usage = analysis.limits[0];
    expect(usage?.namespace).toBe("(default)");
    expect(usage?.entries).toHaveLength(8);

    const dmlRows = usage?.entries.find((e) => e.name === "Number of DML rows");
    expect(dmlRows?.current).toBe(9_501);
    expect(dmlRows?.max).toBe(10_000);
    expect(dmlRows?.percentage).toBeCloseTo(95.01, 2);
    expect(dmlRows?.closeToLimit).toBe(true);

    const queryRows = usage?.entries.find((e) => e.name === "Number of query rows");
    expect(queryRows?.current).toBe(36_042);
    expect(queryRows?.max).toBe(50_000);
    expect(queryRows?.percentage).toBeCloseTo(72.084, 2);
    expect(queryRows?.closeToLimit).toBe(false);

    // Sorted by percentage, descending.
    expect(usage?.entries[0]?.name).toBe("Number of DML rows");
  });

  it("records managed-package namespaces and truncation", () => {
    expect(analysis.namespaces).toEqual(["npo01"]);
    expect(analysis.truncated).toBe(true);
    expect(analysis.truncationNotes[0]).toContain("Skipped");
  });

  it("records exceptions with the Apex line and physical log line", () => {
    expect(analysis.errors).toHaveLength(1);
    expect(analysis.errors[0]?.severity).toBe("error");
    expect(analysis.errors[0]?.kind).toBe("EXCEPTION_THROWN");
    expect(analysis.errors[0]?.apexLine).toBe(7);
    expect(analysis.errors[0]?.logLine).toBe(25);
    expect(analysis.errors[0]?.message).toContain("System.DmlException");
  });

  it("extracts USER_DEBUG statements regardless of level", () => {
    expect(analysis.debugStatements).toHaveLength(1);
    expect(analysis.debugStatements[0]?.level).toBe("DEBUG");
    expect(analysis.debugStatements[0]?.apexLine).toBe(3);
    expect(analysis.debugStatements[0]?.logLine).toBe(17);
    expect(analysis.debugStatements[0]?.message).toContain("36,042");
  });

  it("reports full coverage for the sample", () => {
    expect(analysis.coverage).toEqual({
      soqlDetailsTruncated: false,
      dmlDetailsTruncated: false,
      debugStatementsTruncated: false,
      errorsTruncated: false,
      queryGroupsTruncated: false,
      nPlusOneTruncated: false,
    });
  });
});

describe("analyzeDebugLog — N+1 detection", () => {
  const buildLoopLog = (query: string, runs: number): string => {
    const lines = ["10:00:00.0 (0)|EXECUTION_STARTED"];
    for (let i = 0; i < runs; i += 1) {
      lines.push(`10:00:00.0 (${i * 1000})|SOQL_EXECUTE_BEGIN[${i}]|${query}`);
      lines.push(`10:00:00.0 (${i * 1000 + 500})|SOQL_EXECUTE_END[${i}]|Rows:10`);
    }
    return lines.join("\n");
  };

  it("flags queries repeated 3+ times as Potential N+1", () => {
    const analysis = analyzeDebugLog(
      buildLoopLog("SELECT Id FROM Opportunity WHERE Stage = 'Open'", 3),
    );
    expect(analysis.nPlusOne).toHaveLength(1);
    expect(analysis.nPlusOne[0]?.calls).toBe(3);
    expect(analysis.nPlusOne[0]?.variants).toBe(1);
    expect(analysis.nPlusOne[0]?.totalRows).toBe(30);
    expect(analysis.nPlusOne[0]?.severity).toBe("medium");
    expect(analysis.nPlusOne[0]?.maxDurationUs).toBe(500);
    const group = analysis.soql.find((s) => s.query.includes("Opportunity"));
    expect(group?.nPlusOne).toBe(true);
  });

  it("does not flag queries executed only once or twice", () => {
    const once = analyzeDebugLog(
      buildLoopLog("SELECT Id FROM Opportunity WHERE Stage = 'Open'", 1),
    );
    expect(once.nPlusOne).toHaveLength(0);
    expect(once.soql[0]?.nPlusOne).toBe(false);

    const twice = analyzeDebugLog(
      buildLoopLog("SELECT Id FROM Opportunity WHERE Stage = 'Open'", 2),
    );
    expect(twice.nPlusOne).toHaveLength(0);
  });

  it("escalates to high severity at 10+ executions", () => {
    const analysis = analyzeDebugLog(
      buildLoopLog("SELECT Id FROM Case WHERE Status = 'New'", 10),
    );
    expect(analysis.nPlusOne[0]?.calls).toBe(10);
    expect(analysis.nPlusOne[0]?.severity).toBe("high");
  });

  it("groups structurally identical queries that differ only in literals", () => {
    const lines = ["10:00:00.0 (0)|EXECUTION_STARTED"];
    const variants = [
      "SELECT Id FROM Task WHERE WhoId = '001xx000001'",
      "SELECT Id FROM Task WHERE WhoId = '001xx000002'",
    ];
    let statement = 0;
    let clock = 0;
    for (const query of variants) {
      for (let i = 0; i < 2; i += 1) {
        lines.push(`10:00:00.0 (${clock})|SOQL_EXECUTE_BEGIN[${statement}]|${query}`);
        lines.push(`10:00:00.0 (${clock + 400})|SOQL_EXECUTE_END[${statement}]|Rows:5`);
        statement += 1;
        clock += 1000;
      }
    }
    const analysis = analyzeDebugLog(lines.join("\n"));
    expect(analysis.nPlusOne).toHaveLength(1);
    expect(analysis.nPlusOne[0]?.variants).toBe(2);
    expect(analysis.nPlusOne[0]?.calls).toBe(4);
    expect(analysis.nPlusOne[0]?.totalRows).toBe(20);
    // Both member groups are marked so the SOQL table can badge them.
    expect(analysis.soql.filter((s) => s.nPlusOne)).toHaveLength(2);
  });

  it("collapses varying IN-lists into one structural shape", () => {
    const lines = ["10:00:00.0 (0)|EXECUTION_STARTED"];
    const variants = [
      "SELECT Id FROM Contact WHERE AccountId IN ('001a', '001b', '001c')",
      "SELECT Id FROM Contact WHERE AccountId IN ('001d', '001e')",
    ];
    let statement = 0;
    let clock = 0;
    for (const query of variants) {
      for (let i = 0; i < 2; i += 1) {
        lines.push(`10:00:00.0 (${clock})|SOQL_EXECUTE_BEGIN[${statement}]|${query}`);
        lines.push(`10:00:00.0 (${clock + 400})|SOQL_EXECUTE_END[${statement}]|Rows:50`);
        statement += 1;
        clock += 1000;
      }
    }
    const analysis = analyzeDebugLog(lines.join("\n"));
    expect(analysis.nPlusOne).toHaveLength(1);
    expect(analysis.nPlusOne[0]?.variants).toBe(2);
    expect(analysis.nPlusOne[0]?.calls).toBe(4);
  });
});

describe("analyzeDebugLog — defensive edge cases", () => {
  it("captures fatal errors with stack frames from continuation lines", () => {
    const log = [
      "55.0 APEX_CODE,ERROR",
      "10:00:00.0 (1000)|EXECUTION_STARTED",
      "10:00:00.1 (99000)|FATAL_ERROR|System.NullPointerException: Attempt to de-reference a null object",
      "Class.AccountService.dedupe: line 12, column 9",
      "Trigger.ContactTrigger: line 3, column 1",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.counts.fatalErrors).toBe(1);
    expect(analysis.errors[0]?.severity).toBe("fatal");
    expect(analysis.errors[0]?.message).toContain("NullPointerException");
    expect(analysis.errors[0]?.stack).toHaveLength(2);
    expect(analysis.errors[0]?.stack[0]).toContain("Class.AccountService");
  });

  it("classifies USER_DEBUG output by level", () => {
    const log = [
      "10:00:00.0 (1000)|USER_DEBUG|[1]|ERROR|boom",
      "10:00:00.0 (2000)|USER_DEBUG|[2]|WARN|risky",
      "10:00:00.0 (3000)|USER_DEBUG|[3]|DEBUG|fine",
      "10:00:00.0 (4000)|USER_DEBUG|[4]|FINEST|trace",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.counts.userDebugLines).toBe(4);
    expect(analysis.debugStatements).toHaveLength(4);
    expect(analysis.errors).toHaveLength(2);
    expect(analysis.errors[0]?.severity).toBe("error");
    expect(analysis.errors[0]?.apexLine).toBe(1);
    expect(analysis.errors[0]?.message).toBe("boom");
    expect(analysis.errors[1]?.severity).toBe("warning");
  });

  it("captures anonymous Apex compile errors without timestamps", () => {
    const log = [
      "61.0 APEX_CODE,ERROR",
      "Error: Line 3, Column 12: unexpected token: 'x'",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.errors[0]?.kind).toBe("Compilation error");
    expect(analysis.errors[0]?.elapsedUs).toBeNull();
    expect(analysis.errors[0]?.logLine).toBeNull();
    expect(analysis.errors[0]?.message).toContain("unexpected token");
  });

  it("keeps only the FINAL limit block when snapshots repeat", () => {
    const log = [
      "10:00:00.0 (1000)|LIMIT_USAGE_FOR_NS|(default)|",
      "  Number of SOQL queries: 2 out of 100",
      "10:00:00.0 (2000)|LIMIT_USAGE_FOR_NS|(default)|",
      "  Number of SOQL queries: 3 out of 100",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    const entry = analysis.limits[0]?.entries[0];
    expect(entry?.current).toBe(3);
    expect(entry?.max).toBe(100);
    expect(entry?.percentage).toBe(3);
  });

  it("ignores CUMULATIVE_LIMIT_USAGE bodies to avoid double counting", () => {
    const log = [
      "10:00:00.0 (1000)|EXECUTION_STARTED",
      "10:00:00.0 (2000)|LIMIT_USAGE_FOR_NS|(default)|",
      "  Number of SOQL queries: 2 out of 100",
      "10:00:00.0 (3000)|CUMULATIVE_LIMIT_USAGE",
      "  Number of SOQL queries: 9 out of 100",
      "10:00:00.0 (4000)|CUMULATIVE_LIMIT_USAGE_END",
      "10:00:00.0 (5000)|EXECUTION_FINISHED",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    const usage = analysis.limits[0];
    expect(usage?.entries).toHaveLength(1);
    expect(usage?.entries[0]?.current).toBe(2);
  });

  it("parses comma-separated limit numbers", () => {
    const log = [
      "10:00:00.0 (1000)|LIMIT_USAGE_FOR_NS|(default)|",
      "  Maximum heap size: 2,097,152 out of 6,000,000",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    const entry = analysis.limits[0]?.entries[0];
    expect(entry?.current).toBe(2_097_152);
    expect(entry?.max).toBe(6_000_000);
    expect(entry?.closeToLimit).toBe(false);
  });

  it("groups limits per managed-package namespace", () => {
    const log = [
      "10:00:00.0 (1000)|LIMIT_USAGE_FOR_NS|(default)|",
      "  Number of SOQL queries: 1 out of 100",
      "10:00:00.0 (2000)|LIMIT_USAGE_FOR_NS|npo01|",
      "  Number of SOQL queries: 8 out of 100 ******* CLOSE TO LIMIT",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.limits).toHaveLength(2);
    expect(analysis.limits[0]?.namespace).toBe("(default)");
    expect(analysis.limits[1]?.namespace).toBe("npo01");
    expect(analysis.limits[1]?.entries[0]?.closeToLimit).toBe(true);
    expect(analysis.namespaces).toContain("npo01");
  });

  it("finalizes unterminated SOQL statements when the log is truncated", () => {
    const log = [
      "10:00:00.0 (1000)|SOQL_EXECUTE_BEGIN[7]|Aggregations:0|SELECT Id FROM Account",
      // No SOQL_EXECUTE_END[7] — Salesforce cut the log mid-statement.
      "*** Skipped 4194304 bytes of detailed log due to log size limit ***",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.counts.soqlQueries).toBe(1);
    expect(analysis.counts.soqlRows).toBe(0);
    expect(analysis.soqlExecutions[0]?.durationUs).toBeNull();
    expect(analysis.soqlExecutions[0]?.rows).toBeNull();
    expect(analysis.soqlExecutions[0]?.query).toContain("FROM Account");
    const group = analysis.soql[0];
    expect(group?.calls).toBe(1);
    expect(group?.measuredCalls).toBe(0);
    expect(group?.rowsKnown).toBe(false);
    expect(group?.maxDurationUs).toBe(0);
    expect(analysis.truncated).toBe(true);
  });

  it("closes an unterminated statement when its number is reused (trigger recursion)", () => {
    const log = [
      "10:00:00.0 (1000)|SOQL_EXECUTE_BEGIN[10]|SELECT Id FROM Contact",
      // END for the first BEGIN[10] never arrived; a new transaction begins.
      "10:00:00.0 (2000)|SOQL_EXECUTE_BEGIN[10]|SELECT Id FROM Contact",
      "10:00:00.0 (3000)|SOQL_EXECUTE_END[10]|Rows:5",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.counts.soqlQueries).toBe(2);
    expect(analysis.soqlExecutions).toHaveLength(2);
    expect(analysis.soqlExecutions[0]?.durationUs).toBeNull(); // orphaned by reuse
    expect(analysis.soqlExecutions[1]?.durationUs).toBe(1_000);
    expect(analysis.soqlExecutions[1]?.rows).toBe(5);
    expect(analysis.counts.soqlRows).toBe(5);
  });

  it("credits row totals from orphan END events with no visible BEGIN", () => {
    const log = "10:00:00.0 (1000)|SOQL_EXECUTE_END[9]|Rows:5";
    const analysis = analyzeDebugLog(log);
    expect(analysis.counts.soqlRows).toBe(5);
    expect(analysis.soqlExecutions).toHaveLength(0);
  });

  it("computes DML durations from paired DML_END events", () => {
    const log = [
      "10:00:00.0 (1000)|DML_BEGIN[5]|Op:Insert|Type:Account|rows:2",
      "10:00:00.0 (9000)|DML_END[5]",
    ].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.dmlExecutions[0]?.durationUs).toBe(8_000);
    expect(analysis.dml[0]?.measuredCalls).toBe(1);
    expect(analysis.dml[0]?.totalDurationUs).toBe(8_000);
  });

  it("finalizes unterminated DML statements at end-of-log", () => {
    const log = ["10:00:00.0 (1000)|DML_BEGIN[5]|Op:Delete|Type:Task|rows:3"].join("\n");
    const analysis = analyzeDebugLog(log);
    expect(analysis.dmlExecutions[0]?.durationUs).toBeNull();
    expect(analysis.dmlExecutions[0]?.rows).toBe(3);
    expect(analysis.dml[0]?.measuredCalls).toBe(0);
  });

  it("returns a zeroed analysis for empty input", () => {
    const analysis = analyzeDebugLog("");
    expect(analysis.lineCount).toBe(0);
    expect(analysis.counts.soqlQueries).toBe(0);
    expect(analysis.limits).toEqual([]);
    expect(analysis.errors).toEqual([]);
    expect(analysis.nPlusOne).toEqual([]);
    expect(analysis.logVersion).toBeNull();
  });

  it("ignores unrelated text without crashing", () => {
    const analysis = analyzeDebugLog("hello\nworld\n\nnot a log");
    expect(analysis.lineCount).toBe(4);
    expect(analysis.counts.soqlQueries).toBe(0);
    expect(analysis.errors).toHaveLength(0);
  });

  it("scales linearly on synthetic bulk input (100k events, single pass)", () => {
    const lines: string[] = ["60.0 APEX_CODE,DEBUG"];
    for (let i = 0; i < 100_000; i += 1) {
      const base = i * 10;
      lines.push(`10:00:00.0 (${base})|SOQL_EXECUTE_BEGIN[${i % 500}]|Aggregations:0|SELECT Id FROM Thing__c WHERE N = ${i % 50}`);
      lines.push(`10:00:00.0 (${base + 5})|SOQL_EXECUTE_END[${i % 500}]|Rows:1`);
    }
    const analysis = analyzeDebugLog(lines.join("\n"));
    expect(analysis.counts.soqlQueries).toBe(100_000);
    expect(analysis.counts.soqlRows).toBe(100_000);
    expect(analysis.coverage.queryGroupsTruncated).toBe(false);
    expect(analysis.soql).toHaveLength(50);
    expect(analysis.coverage.soqlDetailsTruncated).toBe(true); // detail list capped
    expect(analysis.durationMs).toBeLessThan(10_000);
    // 50 shapes × 2000 calls each — all flagged, capped at the warning cap.
    expect(analysis.nPlusOne.length).toBeGreaterThan(0);
    expect(analysis.nPlusOne.length).toBeLessThanOrEqual(50);
  });
});
