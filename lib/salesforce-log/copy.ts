export type SalesforceLogSeoSection = {
  heading: string;
  body: string[];
};

export type SalesforceLogFaq = {
  question: string;
  answer: string;
};

const SECTIONS: SalesforceLogSeoSection[] = [
  {
    heading: "What a Salesforce debug log records — and what this analyzer extracts",
    body: [
      "A Salesforce debug log is a timestamped event stream: every line follows HH:MM:SS.m (offset)|EVENT|fields, where the parenthesized number is microseconds since the execution started. The analyzer walks that stream once, correlating SOQL_EXECUTE_BEGIN with SOQL_EXECUTE_END statement numbers to recover row counts and execution durations, grouping repeated queries into per-query statistics, merging DML operations by statement and object, and tracking every LIMIT_USAGE_FOR_NS block per namespace. Timing is reconstructed from the microsecond offsets rather than wall-clock seconds, which are too coarse to reason about.",
      "Errors get first-class treatment. EXCEPTION_THROWN events keep their Apex source line, FATAL_ERROR events capture the stack frames Salesforce prints on the continuation lines beneath them, USER_DEBUG output is classified by level (ERROR and WARN surface in the Errors tab), and anonymous-Apex compile failures — plain Error: Line n, Column m lines with no timestamp — are recognized too. Truncation markers such as *** Skipped N bytes of detailed log *** are flagged prominently, because conclusions drawn from a truncated log can be silently wrong.",
    ],
  },
  {
    heading: "N+1 SOQL detection: finding the queries Salesforce charges you for twice",
    body: [
      "The most expensive defect an Apex log can reveal is an N+1: a SOQL statement inside a loop, re-executed once per record. Debug logs hide it in plain sight — the query text looks identical line after line, or nearly identical when only a filter literal changes. This analyzer fingerprints every distinct query by structure: string literals, numeric literals, and IN-list values are masked into placeholders, so SELECT … WHERE AccountId = '001xx1' and SELECT … WHERE AccountId = '001xx2' collapse into one shape.",
      "Any structural shape executed three or more times is flagged as a Potential N+1, ranked by execution count, and cross-referenced in the SOQL table so you can see exactly which statements participate. Ten or more executions escalate the warning to high severity. The fix is always bulkification: gather the varying filter values into a collection, execute one query with an IN bind, and index the results — turning N round trips (and N× the query-row governor cost) into one.",
    ],
  },
  {
    heading: "Governor limits: reading LIMIT_USAGE_FOR_NS before Salesforce enforces it",
    body: [
      "Salesforce emits a LIMIT_USAGE_FOR_NS block whenever a code unit finishes, listing each governor limit as used out of max. In synchronous Apex the headline caps are 100 SOQL queries, 50,000 query rows, 150 DML statements, 10,000 DML rows (10,000 of query rows per relationship in triggers), 10 seconds of CPU, and 6 MB of heap; asynchronous Apex roughly doubles several of them. Because blocks repeat throughout a transaction, this analyzer reports the FINAL block per namespace — the transaction's closing statement of how close you ran to each ceiling.",
      "Anything the log itself marks ******* CLOSE TO LIMIT gets a badge, and the analyzer additionally colors usage at 70% (amber) and 90% (red) of the declared maximum. Managed packages run under their own namespace limits, so blocks are grouped per namespace with yours shown first. The maximums shown are always the ones your log declares, never hardcoded values, which keeps the numbers correct for async contexts, scratch orgs with raised limits, and Apex tests.",
    ],
  },
  {
    heading: "SOQL and DML forensics: rows, aggregations, and table scans",
    body: [
      "The numbers in brackets on SOQL_EXECUTE_BEGIN[10] are statement sequence numbers, not line numbers — the analyzer uses them to pair each query with its row count and BEGIN→END execution duration. Every execution is listed per statement with its duration and physical log line, so slow statements can be jumped to directly in the original file. SOQL_EXECUTE_EXPLAIN output is checked for TableScan markers: a table scan means the query filtered on a non-indexed field and scanned the object, the classic cause of query timeouts on large objects.",
      "DML statements are aggregated by operation and object so you can see, for example, that an integration performed 340 single-row updates instead of one bulkified call. The distinction between statements and rows matters because they breach independently: 150 statements caps bulkification failures while 10,000 rows caps volume, and the Limits tab shows both against their ceilings.",
    ],
  },
  {
    heading: "Private by architecture: the log never leaves the browser",
    body: [
      "Debug logs contain everything — record data, user names, internal IDs, sometimes tokens in callout headers. This analyzer is built so that leaking one is structurally impossible: the page is statically exported, there is no API route to receive data, and parsing happens in a page-local Web Worker that has no network access. The raw text is passed to the worker, the aggregated counts come back, and nothing is written to localStorage, cookies, or any telemetry endpoint. You can confirm it in your browser's network tab — zero requests carry log content.",
      "The dedicated worker also keeps the page responsive: a 20 MB log (Salesforce's own maximum) can contain hundreds of thousands of lines, and scanning them synchronously would freeze the UI for seconds. Off the main thread, the same scan runs while the interface stays interactive, and the worker is terminated after each parse so memory is released immediately. If Web Workers are disabled by policy, the analyzer falls back to parsing on the main thread rather than uploading anything — privacy is never traded for convenience.",
    ],
  },
];

export function buildSalesforceLogSeoSections(): SalesforceLogSeoSection[] {
  return SECTIONS;
}

export const SALESFORCE_LOG_FAQS: SalesforceLogFaq[] = [
  {
    question: "Is my Salesforce debug log uploaded anywhere?",
    answer:
      "No. The analyzer is a static page with no backend. Your log is read locally with the File API and parsed inside a Web Worker that has no network access — there is no API route, no storage, and no telemetry that ever receives log content. Nothing is written to localStorage or cookies, and closing the tab erases everything. You can verify this by watching the network tab while you analyze a log: no request contains your data.",
  },
  {
    question: "How do I capture a Salesforce debug log?",
    answer:
      "Three common routes: (1) Setup → Environments → Logs → Debug Logs — add a trace flag for a user and reproduce the action; (2) the Developer Console — open it, run your code, then read the generated log from the Logs tab; (3) Workbench or the API via Setup → Debug Logs with trace-flag levels. Set the Apex Code level to at least DEBUG (FINEST captures query plans but fills the log faster). Export the log as a .txt or .log file and drop it into this analyzer — up to 20 MB, Salesforce's own ceiling.",
  },
  {
    question: "How do I read a Salesforce debug log line?",
    answer:
      "Every event line follows the pattern HH:MM:SS.m (microseconds)|EVENT_NAME[n]|fields. The bracketed number is a statement sequence number, not a source line. The events worth learning first: EXECUTION_STARTED / EXECUTION_FINISHED bound the transaction; CODE_UNIT_STARTED / FINISHED delimit each entry point (triggers, classes, anonymous blocks); SOQL_EXECUTE_BEGIN/END pair up queries and row counts; DML_BEGIN carries Op, Type, and rows; USER_DEBUG carries System.debug output; LIMIT_USAGE_FOR_NS prints governor usage; EXCEPTION_THROWN and FATAL_ERROR carry failures and stacks. This analyzer decodes all of them automatically — paste a log and read the Summary tab instead of the raw stream.",
  },
  {
    question: "What is an N+1 SOQL query, and how does the analyzer detect it?",
    answer:
      "An N+1 is a query placed inside a loop: one query for the parent list, then one query per child record — N executions where one would do. It wastes CPU, burns query-row governor limits multiplicatively, and is the most common cause of LIMIT_EXCEEDED in production Apex. The analyzer fingerprints each distinct query by structure (literals and IN-list values masked into placeholders) and flags any shape executed 3 or more times as a Potential N+1, escalating to high severity at 10+. The fix is bulkification: collect the varying filter values, run one query with an IN bind, and index the results.",
  },
  {
    question: "What file types and sizes are supported?",
    answer:
      "Any .txt or .log file up to 20 MB — the same ceiling Salesforce applies to debug logs themselves. You can also paste raw log text directly. Larger captures should be split or re-exported with a narrower trace window, since Salesforce truncates oversized logs anyway.",
  },
  {
    question: "Why do SOQL and DML lines have numbers in brackets?",
    answer:
      "Those are statement sequence numbers assigned per transaction, e.g. SOQL_EXECUTE_BEGIN[10]. The analyzer pairs BEGIN and END events by these numbers to recover the row count each query returned and the exact execution duration between the two events. When a trigger fires the same query repeatedly, the number is reused and the executions are grouped into a single statistic showing the call count, total rows, and slowest run.",
  },
  {
    question: "Why does my log end with 'Skipped N bytes of detailed log'?",
    answer:
      "Salesforce stops recording once a log hits its size cap, replacing the omitted middle with a truncation marker — this happens on Salesforce's servers before you download the file, and the skipped events were never recorded anywhere. The analyzer flags this in the Summary tab because any counts (queries, DML, exceptions) are then lower bounds. Lowering trace-flag levels — e.g. APEX_CODE from FINEST to DEBUG — or shortening the capture window usually keeps the log complete.",
  },
  {
    question: "What counts as an error in the Errors tab?",
    answer:
      "Four categories: FATAL_ERROR events (with their stack frames), EXCEPTION_THROWN events (with the Apex line where they were raised), USER_DEBUG output written at ERROR or WARN level, and anonymous-Apex compile failures (Error: Line n, Column m …). Every entry has click-to-copy for the message and stack trace, ready to paste into a ticket. Informational debug output stays in the Debugs tab and the Summary count.",
  },
  {
    question: "Do managed packages share my governor limits?",
    answer:
      "No — each namespace gets its own LIMIT_USAGE_FOR_NS accounting, which is why a package can consume its limits without exhausting yours. The Limits tab groups blocks by namespace and shows yours first, so a runaway managed package is distinguishable from your own code.",
  },
  {
    question: "Why is my CPU time high even though there is barely any DML?",
    answer:
      "CPU time is consumed by Apex execution itself — loops, string building, JSON serialization, and re-processing query results — not just database work. The classic combination is an N+1 pattern: thousands of query results iterated and re-processed per record. Check the N+1 tab for repeated query shapes and the SOQL tab for queries with large row counts, then restructure the logic to process results in bulk once.",
  },
];
