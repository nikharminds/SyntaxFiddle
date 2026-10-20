import type { ConversionPair } from "./routes";

export type SeoSection = {
  heading: string;
  body: string[];
};

const SOURCE_SECTIONS: Record<
  ConversionPair["source"],
  { heading: string; body: string[] }
> = {
  csv: {
    heading: "Delimiter sniffing, quoted fields, and header handling",
    body: [
      "The parser sniffs the delimiter automatically, scoring comma, semicolon, tab, and pipe candidates against how consistently each one splits your sample — so pasted TSV exports, European semicolon files, and pipe-delimited database dumps all convert without a manual setting. Quoted fields are fully supported, including embedded delimiters, embedded line breaks, and doubled escape quotes: a cell containing \"said \"\"hi\"\", twice\" survives as a single field with its punctuation intact.",
      "The first non-empty line becomes the header row and every header is trimmed, so leading spaces from hand-edited files never produce mismatched keys. Blank headers fall back to positional names, duplicate headers receive deterministic numeric suffixes so no data is silently overwritten, and rows that are completely empty are dropped before conversion begins.",
    ],
  },
  excel: {
    heading: "Workbook parsing with native type preservation",
    body: [
      "The workbook is decoded entirely in your browser: the first worksheet is selected, its first row is treated as the header row, and every remaining row becomes a record. Both modern .xlsx files and the legacy .xls format are accepted, up to the 15MB client-side cap.",
      "Unlike CSV, spreadsheet cells carry real types — and that flows through the whole pipeline. Numeric amounts and true/false booleans survive into conversion natively, so SQL output gets genuine INTEGER and BOOLEAN columns instead of quoted strings, and JSON output gets numbers instead of text. Blank rows are skipped automatically, and anything over 1MB is parsed inside a background Web Worker so the tab stays fully interactive while large books decode.",
    ],
  },
};

const SQL_SECTIONS: SeoSection[] = [
  {
    heading: "Datatype mapping and schema inference",
    body: [
      "Every column is scanned end-to-end before a single type is assigned. If every non-empty value in a column matches a plain integer pattern the column is typed INTEGER; if decimals or scientific notation appear anywhere it widens to NUMERIC; if every value is true or false (case-insensitive) it becomes BOOLEAN; and anything else falls back to VARCHAR(255). That conservative fallback is deliberate — a column of product codes like 0012 would lose its leading zero if it were force-cast to a number, so anything that is not unambiguously numeric stays textual.",
      "Empty cells are emitted as NULL rather than empty strings, which keeps NOT NULL constraints, unique indexes, and aggregate queries behaving the way database developers expect. Identifiers that are not plain SQL names — a header like First Name or Order Total (USD) — are wrapped in double quotes automatically, so the generated DDL and DML run unmodified on PostgreSQL, MySQL, SQLite, and DuckDB without any manual quoting pass.",
    ],
  },
  {
    heading: "Batch insert sizing and single-quote escaping",
    body: [
      "Rows are packed into multi-row INSERT statements of 500 rows per statement by default. Multi-row inserts cut round-trips, lock time, and per-statement parse overhead dramatically compared to row-by-row loading, and 500 rows keeps each statement comfortably below the max_allowed_packet and parameter-count limits that typically start biting around the one-megabyte mark on MySQL and similar engines. If your target warehouse prefers different sizing, the batch size is a single option rather than a code change.",
      "Every string value is escaped by doubling single quotes: O'Reilly becomes 'O''Reilly'. Doubled quotes are the SQL-standard escape, and they structurally guarantee that a stray apostrophe can never terminate a string literal early or splice extra SQL into the statement — the classic vector for broken imports and injection payloads alike. For untrusted user input in application code, parameterized queries remain the gold-standard defense; this generator is built for importing data you already control, where deterministic, reviewable SQL is the goal.",
    ],
  },
];

const JSON_SECTIONS: SeoSection[] = [
  {
    heading: "Output schema: an array of typed objects",
    body: [
      "The converter emits a single JSON array in which every spreadsheet row becomes an object and every trimmed header becomes a key: [{\"Id\": \"001xx...\", \"Amount\": 1200.5, \"IsActive\": true}]. This array-of-objects shape is exactly what REST APIs, NoSQL importers, jq, and every major language runtime expect, so the output can be piped straight into fetch(), requests, or a document database with zero reshaping.",
      "Value types follow the source. Excel cells arrive as real numbers and booleans and are serialized natively — 1200.5 stays a number and true stays a boolean. CSV is text by nature, so values are preserved exactly as written: amounts remain strings rather than being silently rounded or reformatted, and leading zeros in codes such as 0012 survive intact. Keys are never mangled; duplicate headers are disambiguated with a numeric suffix so no field is ever overwritten by its neighbor.",
    ],
  },
  {
    heading: "Pretty-printing versus minified output",
    body: [
      "By default the output is pretty-printed with two-space indentation — the human-friendly form that diffs cleanly in code review, reads well in documentation, and parses unchanged. Toggling Minify output strips every byte of insignificant whitespace and emits one compact line, typically 20 to 40 percent smaller, which is what you want when embedding a payload in a config file, shipping it over the wire, or feeding a size-limited API endpoint.",
      "Both forms are byte-identical after JSON.parse, so the choice is purely operational: pretty for humans reviewing the data, minified for machines consuming it. Either way the JSON is guaranteed valid — JSON.stringify escapes quotes, backslashes, and control characters in your data, so even cells containing snippets of JSON themselves round-trip safely.",
    ],
  },
];

const SOQL_SECTIONS: SeoSection[] = [
  {
    heading: "SOQL WHERE IN syntax, decoded",
    body: [
      "Salesforce Object Query Language supports filtering a field against a value list with WHERE FieldName IN ('a', 'b', 'c') — by far the fastest way to fetch a specific subset of records by Id or external key without chaining a dozen OR conditions. The converter takes one column of your data as the value source: each value is trimmed, blanks are stripped, duplicates are removed while first-seen order is preserved, and every remaining value is wrapped in single quotes with internal quotes and backslashes escaped — matching the escape rules of both SOQL and Apex string literals.",
      "The Target SOQL Field option names the API field on the left side of the operator: Id for record IDs, AccountId for relationship filters, or any custom field such as External_Id__c. Paste the finished clause directly into the Developer Console Query Editor, Workbench, or a Data Loader extract — anywhere a SOQL WHERE clause is accepted.",
    ],
  },
  {
    heading: "Developer Console limits, governor limits, and automatic chunking",
    body: [
      "Salesforce caps the SOQL statement itself at roughly 100,000 characters in the Developer Console and API, and long IN lists become unwieldy and slow to parse well before that ceiling. Best practice keeps IN expressions to about 200 values. The converter enforces that automatically: when your column produces more than 200 unique values, the output is split into commented chunks of 200 or fewer — each introduced by a // Chunk i of n header — with OR joining the continuation clauses so the entire block remains one valid, copy-pasteable filter expression.",
      "Governor limits are the second constraint worth respecting: a SOQL query may return at most 50,000 rows when invoked from Apex, and a synchronous transaction allows only 100 SOQL queries. Keeping individual queries small and predictable — which chunked IN clauses do by construction — makes retry logic, limit monitoring, and bulk data jobs tractable. The same generated WHERE blocks drop unchanged into Anonymous Apex one-off scripts executed from the Developer Console's Execute Anonymous window, so a cleanup job is a paste and an insert away.",
    ],
  },
];

const XML_SECTIONS: SeoSection[] = [
  {
    heading: "Document structure: declaration, root, and row elements",
    body: [
      "The output is a complete, well-formed XML document: an XML declaration pinning UTF-8 encoding, a single configurable root element, and one element per spreadsheet row — <root><row><Name>Acme</Name></row></root> by default. Both the root and row element names are editable in the option bar, so you can match the exact vocabulary a legacy integration or publishing pipeline expects: <records><record>, <catalog><product>, or whatever convention your counterpart system already validates.",
      "Every cell value becomes the text node of a child element named after its column header, so the element structure mirrors your table one-to-one: headers become tags, rows become sibling groups, and the original row order is preserved — which matters for ordered feeds, invoice line items, and any consumer that indexes by position.",
    ],
  },
  {
    heading: "Entity escaping and tag-name sanitization",
    body: [
      "XML reserves five characters, and all of them are escaped in text nodes: & becomes &amp;, < and > become &lt; and &gt;, and quotes become &apos; and &quot;. That guarantees values like R&D or a stray <script> tag in your data can never break the document structure or smuggle markup into a downstream parser — the XML equivalent of injection-proofing.",
      "Tag names follow stricter rules than text: they cannot start with a digit and cannot contain spaces or most punctuation. Headers are sanitized automatically and deterministically — First Name becomes <First_Name>, 2024 Total becomes <_2024_Total> — and empty cells emit self-closing elements such as <Notes />, so downstream XML tooling can distinguish present-but-empty from missing without any extra schema work.",
    ],
  },
];

const TARGET_SECTIONS: Record<
  ConversionPair["target"],
  SeoSection[]
> = {
  sql: SQL_SECTIONS,
  json: JSON_SECTIONS,
  "soql-in": SOQL_SECTIONS,
  xml: XML_SECTIONS,
};

const PRIVACY_SECTION: SeoSection = {
  heading: "Private by architecture: your data never leaves the browser",
  body: [
    "Every stage of this conversion — parsing, type inference, and output generation — executes locally inside your browser's JavaScript engine. The input is never transmitted, logged, or stored: there is no upload endpoint, no queue, no telemetry, and no account to create. Files larger than 1MB are handed to a background Web Worker so the interface keeps animating at 60fps even on hundred-thousand-row imports, and the page keeps working offline once loaded because it is a fully static export.",
    "That architecture makes the tool safe for the exports you would never paste into a random website: customer PII, financial line items, internal Salesforce extracts, and unreleased product data. Paste it, convert it, copy or download the result — and the bytes never moved from your machine.",
  ],
};

function buildLimitsSection(pair: ConversionPair): SeoSection {
  const tips: Record<ConversionPair["target"], string> = {
    sql: "For SQL imports, start with the default 500-row batches and only raise them once you know your target engine's packet and parameter limits.",
    json: "For API payloads and config embeds, prefer minified JSON; for review workflows and diffs, keep pretty-printing on.",
    "soql-in": "Remember the SOQL IN clause draws from a single column — put your IDs in one column, one per row, and let the chunker handle the rest.",
    xml: "If a downstream system validates against a specific root element name, set it in the option bar before converting so the document validates on the first try.",
  };
  return {
    heading: "Limits and practical tips",
    body: [
      `Inputs are capped at 15MB per file or paste — hundreds of thousands of rows in practice — purely as a browser-safety guard rather than a server policy, since there is no server involved at all. Processing is single-pass and deterministic: the same input with the same options always produces byte-identical output, which makes the generator safe to keep in CI pipelines and documentation. ${tips[pair.target]}`,
    ],
  };
}

export function buildSeoSections(pair: ConversionPair): SeoSection[] {
  return [
    {
      heading: `How ${pair.sourceLabel} to ${pair.targetLabel} conversion works`,
      body: [
        `${pair.title} runs ${pair.source === "csv" ? "raw delimited text" : "Excel workbooks"} through a deterministic, fully client-side pipeline and produces ${pair.targetLabel} output in a single pass — no round-trips, no queues, no waiting on someone else's server. ${pair.source === "csv" ? "Paste rows straight from a spreadsheet, text editor, or database CLI into the input pane, or drop a .csv/.tsv file onto it." : "Drop a .xlsx or .xls workbook onto the input pane — the first worksheet is picked up automatically."} Press Run Conversion (or just pause typing — the studio parses as you go), and the generated output appears on the right with line numbers, syntax highlighting, and one-click copy or download.`,
      ],
    },
    SOURCE_SECTIONS[pair.source],
    ...TARGET_SECTIONS[pair.target],
    PRIVACY_SECTION,
    buildLimitsSection(pair),
  ];
}
