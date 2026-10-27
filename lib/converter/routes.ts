import type { SourceFormat, TargetFormat } from "./types";

export type ConversionFaq = {
  question: string;
  answer: string;
};

export type ConversionPair = {
  slug: string;
  source: SourceFormat;
  target: TargetFormat;
  sourceLabel: string;
  targetLabel: string;
  title: string;
  heading: string;
  description: string;
  keywords: string[];
  faqs: ConversionFaq[];
  /**
   * Pair-specific Open Graph image under /public/og. Falls back to the
   * shared /og/csv.jpg when omitted.
   */
  ogImage?: string;
};

type BuildTarget = Extract<TargetFormat, "json" | "sql" | "soql-in" | "xml">;
type BuildSource = Extract<SourceFormat, "csv" | "excel">;

const TARGET_META: Record<
  BuildTarget,
  { label: string; titleName: string; outputNoun: string; faq: ConversionFaq }
> = {
  json: {
    label: "JSON",
    titleName: "JSON",
    outputNoun: "clean, API-ready JSON arrays",
    faq: {
      question: "Does the JSON output preserve data types?",
      answer:
        "Yes. Excel numbers and booleans are carried through natively, and CSV values are kept exactly as written so nothing is silently coerced. Output can be pretty-printed or minified with one click.",
    },
  },
  sql: {
    label: "SQL",
    titleName: "SQL INSERT",
    outputNoun: "typed, batched SQL INSERT statements",
    faq: {
      question: "Does the SQL output escape special characters?",
      answer:
        "Yes. Single quotes are escaped by doubling them, column types are inferred as INTEGER, NUMERIC, BOOLEAN, or VARCHAR(255), and rows are batched into multi-row INSERT statements of 500.",
    },
  },
  "soql-in": {
    label: "SOQL",
    titleName: "SOQL IN Clause",
    outputNoun: "Salesforce-ready SOQL WHERE IN clauses",
    faq: {
      question: "How are large value lists handled in the SOQL IN clause?",
      answer:
        "Values are deduplicated and blank entries stripped automatically. If more than 200 unique values are found, the output is split into commented chunks of 200 or fewer — the Salesforce best-practice limit for IN expressions.",
    },
  },
  xml: {
    label: "XML",
    titleName: "XML",
    outputNoun: "well-formed XML documents",
    faq: {
      question: "Are XML special characters escaped?",
      answer:
        "Yes. Ampersands, angle brackets, quotes, and apostrophes are escaped per the XML specification, and column names that are invalid tag names are sanitized automatically. Empty cells become self-closing elements.",
    },
  },
};

const SOURCE_META: Record<BuildSource, { label: string; noun: string }> = {
  csv: {
    label: "CSV",
    noun: "comma, semicolon, tab, or pipe-delimited text",
  },
  excel: {
    label: "Excel",
    noun: ".xlsx or .xls workbooks",
  },
};

function buildPair(source: BuildSource, target: BuildTarget): ConversionPair {
  const sourceMeta = SOURCE_META[source];
  const targetMeta = TARGET_META[target];
  const name = `${sourceMeta.label} to ${targetMeta.titleName} Converter`;
  const title = `${name} Online — No Upload`;
  return {
    slug: `${source}-to-${target === "soql-in" ? "soql" : target}`,
    source,
    target,
    sourceLabel: sourceMeta.label,
    targetLabel: targetMeta.label,
    title,
    heading: `${name} — Online & Private`,
    description: `Convert ${sourceMeta.noun} into ${targetMeta.outputNoun} instantly — zero server upload, instant browser-side processing, and free forever. Delimiter sniffing, type inference, and chunked output, 100% client-side.`,
    keywords: [
      `${source} to ${targetMeta.label.toLowerCase()} converter`,
      `${source} to ${targetMeta.label.toLowerCase()}`,
      `${sourceMeta.label.toLowerCase()} to ${targetMeta.label.toLowerCase()} converter online`,
      `convert ${source} to ${targetMeta.label.toLowerCase()} free`,
      `${targetMeta.label.toLowerCase()} generator`,
      "online converter",
      "free converter",
      "client-side converter",
      "no upload converter",
      "browser data converter",
    ],
    faqs: [
      {
        question: `How do I convert ${sourceMeta.label} to ${targetMeta.titleName}?`,
        answer: `Paste your ${sourceMeta.label} text or drop your file into the input pane, pick ${targetMeta.titleName} as the target format, and press Run Conversion. The ${targetMeta.titleName} output appears instantly with copy and download buttons — no account, no upload, no limits.`,
      },
      targetMeta.faq,
      {
        question: "Is my data uploaded to a server?",
        answer:
          "No. Every conversion runs entirely inside your browser using JavaScript — the parsed bytes never leave your machine. Large files are processed in a background Web Worker so the UI stays responsive, and nothing is logged or stored.",
      },
      {
        question: "Is there a file size limit?",
        answer:
          "Inputs are capped at 15MB per file or paste — comfortably hundreds of thousands of rows — entirely as a browser-safety guard, not a server policy. Files over 1MB are parsed in a background Web Worker, and conversion time scales linearly with your data.",
      },
      {
        question: "Which conversion directions are supported?",
        answer:
          "The studio converts CSV or Excel into SQL INSERT statements, JSON, Salesforce SOQL IN clauses, and XML — plus the reverse directions: JSON and SQL to CSV, Excel, and YAML, XML to JSON, CSV, and Excel, and CSV and Excel to Markdown tables and YAML. Twenty dedicated converters in total, each with its own pre-configured page, and the full studio at /csv/ lets you switch formats without losing your input.",
      },
    ],
  };
}

const FORWARD_CONVERSION_PAIRS: ConversionPair[] = (
  ["csv", "excel"] as BuildSource[]
).flatMap((source) =>
  (["json", "sql", "soql-in", "xml"] as BuildTarget[]).map((target) =>
    buildPair(source, target),
  ),
);

/**
 * Reverse directions: JSON and SQL as sources, CSV/Excel into Markdown and
 * YAML as targets.
 * Each pair is hand-authored (not templated) because the source parsing and
 * the target generation are both pair-specific engineering.
 */
const REVERSE_PAIR_META: Array<{
  slug: string;
  source: SourceFormat;
  target: TargetFormat;
  sourceLabel: string;
  targetLabel: string;
  title: string;
  heading: string;
  description: string;
  keywords: string[];
  faqs: ConversionFaq[];
  ogImage?: string;
}> = [
  {
    slug: "json-to-csv",
    source: "json",
    target: "csv",
    sourceLabel: "JSON",
    targetLabel: "CSV",
    title: "JSON to CSV Converter Online — No Upload",
    heading: "JSON to CSV Converter — Online & Private",
    description:
      "Convert JSON arrays of objects to CSV instantly — nested objects flattened with dot paths, RFC 4180 quoting, and delimiter options. Zero upload, 100% client-side, free forever.",
    keywords: [
      "json to csv",
      "json to csv converter",
      "convert json to csv",
      "json to csv online",
      "json array to csv",
      "json to csv free",
      "nested json to csv",
      "json to csv no upload",
      "client-side json to csv",
    ],
    faqs: [
      {
        question: "How do I convert JSON to CSV?",
        answer:
          "Paste your JSON — an array of objects, a single object, an array of arrays, or an object of column arrays — into the input pane and press Run Conversion. Every object becomes a row, the union of keys becomes the header in first-seen order, and the RFC 4180-quoted CSV appears instantly with copy and download buttons.",
      },
      {
        question: "How are nested objects converted?",
        answer:
          "Nested objects are flattened with dot paths: user.name becomes a column named user.name, so a one-level API response converts cleanly. Arrays serialize to their JSON text within the cell. Deeply nested or recursive structures still convert — every leaf scalar becomes its own dotted column — so the output is always rectangular and spreadsheet-ready.",
      },
      {
        question: "Is my JSON uploaded to a server?",
        answer:
          "No. Parsing and CSV generation run entirely inside your browser — the bytes never leave your machine, nothing is logged, and the page works offline once loaded. That makes it safe for payloads containing customer PII, internal API responses, or unreleased data.",
      },
      {
        question: "What JSON shapes are supported?",
        answer:
          "Four: an array of objects (the canonical API list), a single object (one row), an array of arrays (first row is the header), and an object of arrays (column name to values). Anything else — bare numbers, strings, or mixed arrays — is rejected with a specific message rather than converted to nonsense.",
      },
      {
        question: "Does the converter handle large JSON files?",
        answer:
          "Yes — pastes and files up to 15MB, comfortably hundreds of thousands of rows. Inputs over 1MB are parsed in a background Web Worker so the page stays responsive, and conversion time scales linearly with row count. The header union is computed in a single pass, so wide objects with sparse keys do not quadratic-bomb the parser.",
      },
    ],
  },
  {
    slug: "sql-to-csv",
    source: "sql",
    target: "csv",
    sourceLabel: "SQL",
    targetLabel: "CSV",
    title: "SQL to CSV Converter Online — No Upload",
    heading: "SQL to CSV Converter — Online & Private",
    description:
      "Paste INSERT INTO ... VALUES statements and get CSV back instantly — multi-row tuples merged, quotes un-escaped, NULLs handled. Zero upload, 100% client-side.",
    keywords: [
      "sql to csv",
      "sql to csv converter",
      "convert sql to csv",
      "insert statement to csv",
      "sql insert to csv",
      "sql dump to csv",
      "sql to csv online",
      "sql to csv free",
    ],
    faqs: [
      {
        question: "How do I convert SQL INSERT statements to CSV?",
        answer:
          "Paste the INSERT INTO ... VALUES statements — a single multi-row statement, several statements, or a whole dump fragment — and press Run Conversion. The column list becomes the header, every value tuple becomes a row, and the CSV appears with copy and download buttons. No database connection is involved at any point.",
      },
      {
        question: "Which SQL dialect does the parser accept?",
        answer:
          "The value syntax is ANSI: single-quoted strings with doubled-quote escapes, NULL, TRUE/FALSE, and numeric literals — which MySQL, PostgreSQL, SQLite, and SQL Server dumps all emit. Column lists accept double-quoted, backticked, bracketed, and bare identifiers. SELECT queries and placeholder parameters are out of scope by design: there are no literal values in them to extract.",
      },
      {
        question: "How are NULLs and empty strings handled?",
        answer:
          "NULL becomes an empty CSV cell — the convention spreadsheet consumers expect for missing values. Empty SQL strings ('') also produce empty cells, matching how CSV itself cannot distinguish the two; if the distinction matters downstream, keep it in the SQL layer where it exists. TRUE and FALSE convert to true and false text.",
      },
      {
        question: "Can I convert a full database dump?",
        answer:
          "Paste the INSERT fragment of it. mysqldump-style dumps interleave CREATE TABLE, LOCK TABLES, and comments, which the parser skips harmlessly — but all statements in one paste must share the same column list (or omit it consistently), because the output is one table. For multi-table dumps, split by table and convert each fragment separately.",
      },
      {
        question: "Is my SQL uploaded anywhere?",
        answer:
          "No. Parsing happens entirely in your browser against the pasted text — no server, no database connection, no logging. That is the point: production data inserts stay on your machine whether they contain customer records or internal metrics.",
      },
    ],
  },
  {
    slug: "csv-to-markdown",
    source: "csv",
    target: "markdown",
    sourceLabel: "CSV",
    targetLabel: "Markdown",
    title: "CSV to Markdown Table Converter Online — No Upload",
    heading: "CSV to Markdown Table Converter — Online & Private",
    description:
      "Convert CSV to GitHub-Flavored Markdown tables instantly — pipes escaped, line breaks preserved as <br>, numeric columns right-aligned. Zero upload, 100% client-side.",
    keywords: [
      "csv to markdown",
      "csv to markdown converter",
      "convert csv to markdown table",
      "csv to md table",
      "markdown table generator",
      "csv to markdown online",
      "tsv to markdown",
      "csv to gfm table",
    ],
    faqs: [
      {
        question: "How do I convert CSV to a Markdown table?",
        answer:
          "Paste your CSV (or drop a .csv/.tsv file), pick Markdown as the target, and press Run Conversion. The header row becomes the table header, a delimiter row is generated, and every data row becomes a pipe-delimited line — ready to paste into a README, PR description, or docs page.",
      },
      {
        question: "Which Markdown flavor is generated?",
        answer:
          "GitHub-Flavored Markdown (GFM) pipe tables — the format rendered natively by GitHub, GitLab, Bitbucket, and common documentation generators. The syntax is portable: the same table renders in most Markdown engines that support tables at all.",
      },
      {
        question: "What happens to cells containing pipes or line breaks?",
        answer:
          "Pipes are escaped as \\| so they cannot terminate a cell early, and embedded line breaks become <br>, which GitHub renders as a true break inside the table cell. Both transformations are exactly what GFM requires — the two characters that would otherwise corrupt the table structure.",
      },
      {
        question: "Why are some columns right-aligned?",
        answer:
          "The alignment option right-aligns columns whose values are all numeric — amounts line up under their headers the way spreadsheets align them — using GFM's ---: delimiter form. Text columns stay left-aligned. Toggle the option off if your target renderer does not support alignment.",
      },
      {
        question: "Can I convert TSV to Markdown too?",
        answer:
          "Yes. The delimiter sniffer detects tabs automatically, so pasted TSV converts to Markdown identically — paste from Excel (which copies as TSV) or from a tab-separated export and the table appears without any settings. Semicolon- and pipe-delimited inputs are detected the same way.",
      },
    ],
  },
  {
    slug: "csv-to-yaml",
    source: "csv",
    target: "yaml",
    sourceLabel: "CSV",
    targetLabel: "YAML",
    title: "CSV to YAML Converter Online — No Upload",
    heading: "CSV to YAML Converter — Online & Private",
    description:
      "Convert CSV rows to a YAML list of mappings instantly — block style, correct scalar quoting, empty cells distinguishable from nulls. Zero upload, 100% client-side.",
    keywords: [
      "csv to yaml",
      "csv to yaml converter",
      "convert csv to yaml",
      "csv to yml",
      "csv to yaml online",
      "csv to yaml list",
      "spreadsheet to yaml",
      "csv to config",
    ],
    faqs: [
      {
        question: "How do I convert CSV to YAML?",
        answer:
          "Paste your CSV (or drop a file), pick YAML as the target, and press Run Conversion. Each row becomes a list item mapping — headers become keys, cells become scalars — in block style: exactly the shape Ansible inventories, docker-compose configs, and CI pipelines expect.",
      },
      {
        question: "When does the converter quote values?",
        answer:
          "When quoting is the only correct choice: values that would otherwise parse as booleans or null (true/false, yes/no, on/off, null, ~), numbers, and strings containing YAML indicators like colons or hashes. Safe strings stay bare so the output reads cleanly. This is the difference between a converter and a generator that merely formats — YAML's ambiguity is handled, not ignored.",
      },
      {
        question: "How are empty cells represented?",
        answer:
          "As quoted empty strings (\"\") — deliberately, because a bare empty value in YAML means null, not an empty string. Preserving that distinction is what makes the output round-trip: convert back and the cell is an empty string again, not a null that changed your data model.",
      },
      {
        question: "Can I generate a YAML mapping keyed by a column instead of a list?",
        answer:
          "The converter emits the canonical list-of-mappings shape, which is what the overwhelming majority of YAML consumers (Ansible, docker-compose, Kubernetes ConfigMap generators, CI matrices) accept. Keying by a column value is a consumer-side reshape — a two-line jq or Python transform from this exact output — and keeping the generator canonical means the output is predictable everywhere.",
      },
      {
        question: "Does the YAML output work with Ansible and docker-compose?",
        answer:
          "Yes — a list of mappings is the native shape for Ansible host variables and docker-compose service definitions built from rows. The block style and scalar quoting follow YAML 1.2 conventions that strict loaders accept, and the output passes yamllint's default rules for structure. Test with your specific loader when the config is load-bearing, as with any generated file.",
      },
    ],
  },
  {
    slug: "json-to-yaml",
    source: "json",
    target: "yaml",
    sourceLabel: "JSON",
    targetLabel: "YAML",
    title: "JSON to YAML Converter Online — No Upload",
    heading: "JSON to YAML Converter — Online & Private",
    ogImage: "/og/json-to-yaml.jpg",
    description:
      "Convert JSON to YAML instantly — nesting preserved as block mappings and sequences, scalars quoted only when YAML would misread them. Zero upload, 100% client-side.",
    keywords: [
      "json to yaml",
      "json to yaml converter",
      "convert json to yaml",
      "json to yml",
      "json to yaml online",
      "json to yaml converter online",
      "json to yaml free",
      "yaml config from json",
      "json to yaml no upload",
    ],
    faqs: [
      {
        question: "How do I convert JSON to YAML?",
        answer:
          "Paste your JSON — an array of objects, a single object, an array of arrays, or an object of column arrays — pick YAML as the target, and press Run Conversion. The block-style YAML appears instantly with copy and download buttons, and the output regenerates automatically as you edit the input once it parses.",
      },
      {
        question: "Is my JSON nesting preserved in the YAML output?",
        answer:
          "Yes. JSON and YAML are both tree formats, so object-shaped input converts structurally: nested objects stay nested block mappings, arrays become block sequences, an array of objects becomes a list of mappings, and a single object becomes a plain mapping document without a list wrapper. Only the two explicitly tabular shapes — an array of arrays (first row is the header) and an object of column arrays — convert through the table pipeline, the same interpretation every converter on this site applies to those shapes.",
      },
      {
        question: "When does the converter quote YAML values?",
        answer:
          "Exactly when quoting is required for correctness: strings that would otherwise load as booleans or null (true/false, yes/no, on/off, null, ~), strings that look like numbers (8080, 1e5), and strings containing YAML indicators such as colons or hashes. JSON numbers and booleans pass through bare because YAML reads them identically, and safe strings stay bare so the file stays readable.",
      },
      {
        question: "How are null and the empty string handled?",
        answer:
          "JSON null becomes YAML null — the honest translation of the value — while an empty JSON string becomes \"\" so the two survive a load round-trip as distinct values. That distinction is what breaks naive converters: leaving an empty string bare makes YAML load it as null, silently changing your data's types downstream.",
      },
      {
        question: "Is my JSON uploaded to a server?",
        answer:
          "No. Parsing and YAML generation run entirely inside your browser — the bytes never leave your machine, nothing is logged, and there is no account. Inputs over 1MB are processed in a background Web Worker, which keeps the page responsive without moving any data off your machine.",
      },
    ],
  },
  {
    slug: "excel-to-markdown",
    source: "excel",
    target: "markdown",
    sourceLabel: "Excel",
    targetLabel: "Markdown",
    title: "Excel to Markdown Table Converter Online — No Upload",
    heading: "Excel to Markdown Table Converter — Online & Private",
    description:
      "Convert Excel ranges to GitHub-Flavored Markdown tables instantly — paste from the clipboard or drop the workbook, pipes escaped, numeric columns aligned. Zero upload, 100% client-side.",
    keywords: [
      "excel to markdown",
      "excel to markdown converter",
      "convert excel to markdown table",
      "excel to md",
      "xlsx to markdown",
      "excel to markdown online",
      "spreadsheet to markdown",
      "excel table to markdown",
    ],
    faqs: [
      {
        question: "How do I convert an Excel table to Markdown?",
        answer:
          "Drop your .xlsx or .xls workbook onto the input pane — the first worksheet converts with its first row as the header — or copy a range in Excel and paste it (the clipboard carries TSV, which the parser detects automatically). Pick Markdown as the target and press Run Conversion: a GitHub-Flavored pipe table appears, ready for a README or PR description.",
      },
      {
        question: "Can I paste directly from Excel without saving a file?",
        answer:
          "Yes — copying a range in Excel puts TSV on the clipboard, and pasting it into the input pane works identically to a file drop because the delimiter sniffer detects tabs automatically. That is the fastest path for one-off tables: select, copy, paste, convert. File drops are better for large workbooks with many rows.",
      },
      {
        question: "What happens to cells containing pipes or line breaks?",
        answer:
          "Pipes are escaped as \\| so a value can never terminate its own column, and embedded line breaks become <br> — the two transformations GitHub-Flavored Markdown requires to keep the table structure intact. Both are applied per cell during generation, so messy spreadsheet data still renders cleanly.",
      },
      {
        question: "Why are some columns right-aligned?",
        answer:
          "Columns whose non-empty values are all numeric are right-aligned with GFM's ---: delimiter so figures line up under their headers — the same alignment convention spreadsheets use. Text columns stay left-aligned. Toggle the alignment option off if your target renderer does not support it.",
      },
      {
        question: "Is my workbook uploaded to a server?",
        answer:
          "No. The workbook is decoded entirely inside your browser — no upload endpoint exists, nothing is logged, and the page keeps working offline once loaded. Financial spreadsheets, customer lists, and unreleased data stay on your machine by architecture, not by policy.",
      },
    ],
  },
  {
    slug: "excel-to-yaml",
    source: "excel",
    target: "yaml",
    sourceLabel: "Excel",
    targetLabel: "YAML",
    title: "Excel to YAML Converter Online — No Upload",
    heading: "Excel to YAML Converter — Online & Private",
    ogImage: "/og/excel-to-yaml.jpg",
    description:
      "Convert Excel rows to a YAML list of mappings instantly — block style, correct scalar quoting, empty cells distinguishable from nulls. Zero upload, 100% client-side.",
    keywords: [
      "excel to yaml",
      "excel to yaml converter",
      "convert excel to yaml",
      "xlsx to yaml",
      "excel to yml",
      "spreadsheet to yaml",
      "excel to config",
      "excel to yaml online",
    ],
    faqs: [
      {
        question: "How do I convert Excel to YAML?",
        answer:
          "Drop your .xlsx or .xls workbook onto the input pane and press Run Conversion. Each row becomes a YAML list item — headers become keys, cells become scalars — in block style, the structure Ansible inventories, docker-compose fragments, and CI matrices expect.",
      },
      {
        question: "When does the converter quote values?",
        answer:
          "Whenever quoting is the only correct choice: values that would otherwise parse as booleans, null, or numbers (true/false, yes/no, on/off, null, 42), and strings containing YAML indicators like colons or hashes. Safe strings stay bare and readable. The distinction matters — an unquoted 'on' becomes true the moment YAML loads it.",
      },
      {
        question: "How are empty cells represented?",
        answer:
          "As quoted empty strings (\"\"), because a bare empty value in YAML means null, not an empty string. Preserving that distinction is what makes the output round-trip: your blank spreadsheet cell becomes empty text, not a null that changes the shape of your data downstream.",
      },
      {
        question: "What about Excel dates and long numeric IDs?",
        answer:
          "Excel stores dates as serial numbers and the converter passes cell values through faithfully — a date column arrives as its serial unless the column is formatted as Text first. Long numeric identifiers hit Excel's 15-significant-digit double precision limit before conversion ever runs; format ID columns as Text in the workbook and every digit survives as a string.",
      },
      {
        question: "Is my workbook uploaded anywhere?",
        answer:
          "No. Parsing and YAML generation run entirely in your browser — the workbook bytes never leave your machine, nothing is logged, and there is no account. That makes the tool safe for exactly the spreadsheets you would never paste into a random website.",
      },
    ],
  },
  {
    slug: "xml-to-json",
    source: "xml",
    target: "json",
    sourceLabel: "XML",
    targetLabel: "JSON",
    title: "XML to JSON Converter Online — No Upload",
    heading: "XML to JSON Converter — Online & Private",
    description:
      "Convert XML to JSON instantly — attributes become @properties, repeated elements become arrays, mixed text becomes #text. Zero upload, 100% client-side.",
    keywords: [
      "xml to json",
      "xml to json converter",
      "convert xml to json",
      "xml to json online",
      "xml parser online",
      "xml json",
      "soap to json",
      "xml document to json",
    ],
    faqs: [
      {
        question: "How do I convert XML to JSON?",
        answer:
          "Paste your XML document into the input pane, pick JSON as the target, and press Run Conversion. The parser runs entirely in your browser, applies the documented XML-to-JSON conventions, and produces clean JSON you can pretty-print or minify with one click before copying.",
      },
      {
        question: "How are XML attributes converted?",
        answer:
          "Attributes become properties prefixed with @ — id=\"1\" becomes \"@id\" — because attributes and child elements can share names and the prefix keeps them unambiguous. Attribute values go through conservative scalar sniffing: true/false and round-trippable numbers convert, everything else stays a string.",
      },
      {
        question: "What do repeated elements and mixed content become?",
        answer:
          "Repeated sibling elements with the same tag become JSON arrays, and an element appearing once stays a single value — the same evidence-based rule the schema tools use. Mixed content (text interleaved with child elements) is concatenated into a #text property so nothing is dropped, and empty elements become null.",
      },
      {
        question: "Is the XML to JSON conversion really private?",
        answer:
          "Yes. Parsing and generation run in a Web Worker inside your browser — there is no upload endpoint, nothing is logged, and the page keeps working offline once loaded. SOAP envelopes, invoices, and internal feeds never leave your machine by architecture, not by policy.",
      },
      {
        question: "What XML is not supported?",
        answer:
          "DTDs and processing instructions are skipped, and the parser rejects malformed documents with a line-and-column diagnosis instead of producing wrong JSON. Entity references (named and numeric) are decoded, CDATA is preserved verbatim, and namespaces are kept as written — atom:feed stays atom:feed.",
      },
    ],
  },
  {
    slug: "json-to-excel",
    source: "json",
    target: "excel",
    sourceLabel: "JSON",
    targetLabel: "Excel",
    title: "JSON to Excel (.xlsx) Converter Online — No Upload",
    heading: "JSON to Excel Converter — Real .xlsx, Zero Upload",
    description:
      "Convert JSON to a real .xlsx workbook instantly — typed cells, content-sized columns, array-of-objects or any shape. 100% client-side, zero uploads.",
    keywords: [
      "json to excel",
      "json to excel converter",
      "convert json to excel",
      "json to xlsx",
      "json to excel online",
      "json to spreadsheet",
      "export json to excel",
      "json file to excel",
    ],
    faqs: [
      {
        question: "How do I convert JSON to Excel?",
        answer:
          "Paste your JSON — an array of objects, a single object, an array of arrays, or an object of column arrays — pick Excel as the target, and press Run Conversion. The preview shows the parsed table, and the Download button produces a real .xlsx workbook with typed cells and content-sized columns.",
      },
      {
        question: "Is the output a real Excel file or CSV with an extension?",
        answer:
          "A real Office Open XML workbook. Numbers land as numeric cells that SUM and AVERAGE work on, booleans become TRUE/FALSE cells, and nulls become empty cells — so filters and pivot tables behave correctly the moment the file opens. It is not a text file renamed to .xlsx.",
      },
      {
        question: "What happens to nested objects in my JSON?",
        answer:
          "Nested objects flatten to dot-path columns — user.address.city becomes a column named user.address.city — and arrays serialize to their JSON text inside the cell. The header set is the union of keys across all records in first-seen order, so records with different fields convert with blanks instead of errors.",
      },
      {
        question: "How large a JSON payload can I convert?",
        answer:
          "Inputs are capped at 15MB — hundreds of thousands of rows in practice — purely as a browser-safety guard. Large payloads are processed in a background Web Worker so the tab stays responsive, and the same input always produces a byte-identical workbook.",
      },
      {
        question: "Is my JSON uploaded to a server?",
        answer:
          "Never. Parsing and workbook generation run entirely in your browser — there is no upload endpoint, nothing is logged, and no account is needed. API payloads with customer data, tokens, or internal records stay on your machine.",
      },
    ],
  },
  {
    slug: "sql-to-excel",
    source: "sql",
    target: "excel",
    sourceLabel: "SQL",
    targetLabel: "Excel",
    title: "SQL to Excel (.xlsx) Converter Online — No Upload",
    heading: "SQL to Excel Converter — INSERT Dumps to .xlsx",
    description:
      "Convert SQL INSERT statements to a real .xlsx workbook instantly — multi-row tuples merged, NULL to empty cells, typed numbers. 100% client-side.",
    keywords: [
      "sql to excel",
      "sql to excel converter",
      "sql to excel online",
      "convert sql to excel",
      "sql insert to excel",
      "sql dump to xlsx",
      "sql to xlsx",
      "mysqldump to excel",
      "sql to spreadsheet",
    ],
    faqs: [
      {
        question: "How do I convert SQL INSERTs to Excel?",
        answer:
          "Paste INSERT INTO ... VALUES statements — multi-row tuples and multiple statements are merged automatically — pick Excel as the target, and press Run Conversion. The Download button produces a real .xlsx workbook with the column list from your statement as the header row.",
      },
      {
        question: "Does it connect to a database?",
        answer:
          "No. There is no database connection, driver, or execution of any kind — the parser reads the INSERT text as text, extracting column names and literal value tuples exactly as written. That also makes it safe for production dumps: nothing executes and nothing leaves your machine.",
      },
      {
        question: "How are NULLs and booleans handled?",
        answer:
          "NULL becomes an empty cell, TRUE/FALSE become native boolean cells, and numeric literals keep their values as typed numeric cells. String literals honor SQL's doubled-quote escaping, so O''Brien converts to O'Brien with the apostrophe intact.",
      },
      {
        question: "Can I convert a mysqldump or pg_dump file?",
        answer:
          "Yes, if it was exported with literal INSERT statements (pg_dump --inserts, or mysqldump's default format). The CREATE TABLE block is skipped and every INSERT tuple is merged into one table. Statements using placeholders or INSERT ... SELECT contain no literal rows and are rejected with a specific message.",
      },
      {
        question: "Is my SQL dump uploaded anywhere?",
        answer:
          "Never. Parsing and workbook generation run in your browser inside a Web Worker — no upload endpoint exists, nothing is logged, and the tool works offline once loaded. Production data stays on your machine.",
      },
    ],
  },
  {
    slug: "xml-to-csv",
    source: "xml",
    target: "csv",
    sourceLabel: "XML",
    targetLabel: "CSV",
    title: "XML to CSV Converter Online — No Upload",
    heading: "XML to CSV Converter — Online & Private",
    description:
      "Convert XML to CSV instantly — the repeated record element becomes rows, attributes become @-prefixed columns, dot-path flattening. Zero upload.",
    keywords: [
      "xml to csv",
      "xml to csv converter",
      "convert xml to csv",
      "xml to csv online",
      "xml file to csv",
      "sitemap to csv",
      "rss to csv",
      "xml extract csv",
    ],
    faqs: [
      {
        question: "How do I convert XML to CSV?",
        answer:
          "Paste your XML document into the input pane, pick CSV as the target, and press Run Conversion. The converter locates the repeated record element — <book> inside <books>, <item> inside a feed — and produces one CSV row per record, with the delimiter you choose.",
      },
      {
        question: "How does the converter know which element is a row?",
        answer:
          "It searches depth-first for the first repeating element whose occurrences are all objects — the structural signature of records. Attributes become @-prefixed columns (@id), nested elements flatten to dot paths, and the record path is deterministic for the same document shape, so sitemaps, RSS feeds, and vendor exports all convert consistently.",
      },
      {
        question: "What if my XML has no repeating element?",
        answer:
          "The converter rejects it with a precise message instead of guessing — a single-record document has no table to build, and picking an arbitrary element would invent data. Wrap the record in a repeating parent, or use the XML to JSON converter for tree-shaped documents.",
      },
      {
        question: "Are numbers and dates converted or kept as text?",
        answer:
          "Scalar sniffing is conservative: true/false and round-trippable numbers (42, 5.95) convert to typed values, while leading-zero identifiers and date strings stay text — because Excel and databases silently corrupt force-cast values like 007. CDATA content is always preserved verbatim.",
      },
      {
        question: "Is my XML uploaded to a server?",
        answer:
          "No. Parsing and CSV generation run entirely in your browser — no upload endpoint, no logging, no account. The page works offline once loaded, which is the proof that nothing phones home.",
      },
    ],
  },
  {
    slug: "xml-to-excel",
    source: "xml",
    target: "excel",
    sourceLabel: "XML",
    targetLabel: "Excel",
    title: "XML to Excel (.xlsx) Converter Online — No Upload",
    heading: "XML to Excel Converter — Online & Private",
    description:
      "Convert XML to a real .xlsx workbook instantly — record extraction, typed cells, @-prefixed attribute columns. 100% client-side, zero uploads.",
    keywords: [
      "xml to excel",
      "xml to excel converter",
      "convert xml to excel",
      "xml to xlsx",
      "xml to excel online",
      "xml file to excel",
      "xml to spreadsheet",
      "open xml in excel",
    ],
    faqs: [
      {
        question: "How do I convert XML to Excel?",
        answer:
          "Paste your XML document, pick Excel as the target, and press Run Conversion. The repeated record element becomes the rows, the Download button produces a real .xlsx workbook with typed cells, and the preview pane shows the equivalent table before you commit.",
      },
      {
        question: "Which XML files work best?",
        answer:
          "Documents with a clear repeating record structure: sitemaps (one row per <url>), RSS and Atom feeds (one row per <item>), product catalogs, and vendor exports. The converter finds the record element automatically; documents with no repeating element are rejected with an explanation rather than a guess.",
      },
      {
        question: "How are attributes and nested elements handled?",
        answer:
          "Attributes become @-prefixed columns (@id) and nested elements flatten to dot paths, mirroring the JSON converter's conventions so both pipelines produce interchangeable tables. Repeated grandchildren become JSON text inside their cell, bounding width by depth rather than array length.",
      },
      {
        question: "Do I get typed cells or everything as text?",
        answer:
          "Typed cells: numbers land as numeric cells that Excel can aggregate, booleans as TRUE/FALSE, nulls as empty cells. Values that look numeric but do not round-trip — 007, version strings — stay text deliberately, because Excel silently corrupts force-cast identifiers.",
      },
      {
        question: "Is my XML uploaded anywhere?",
        answer:
          "Never. The XML is parsed in your browser and the workbook is generated in your browser — no upload endpoint exists, nothing is logged, and the tool works offline once the page is loaded.",
      },
    ],
  },
];

const REVERSE_CONVERSION_PAIRS: ConversionPair[] = REVERSE_PAIR_META.map(
  (meta) => ({
    slug: meta.slug,
    source: meta.source,
    target: meta.target,
    sourceLabel: meta.sourceLabel,
    targetLabel: meta.targetLabel,
    title: meta.title,
    heading: meta.heading,
    description: meta.description,
    keywords: meta.keywords,
    faqs: meta.faqs,
    ogImage: meta.ogImage,
  }),
);

export const CONVERSION_PAIRS: ConversionPair[] = [
  ...FORWARD_CONVERSION_PAIRS,
  ...REVERSE_CONVERSION_PAIRS,
];

export function getConversionPair(slug: string): ConversionPair | undefined {
  return CONVERSION_PAIRS.find((pair) => pair.slug === slug);
}

export function relatedConversionPairs(pair: ConversionPair): ConversionPair[] {
  // Relevance-ordered internal links: converters sharing the source format
  // come first, then converters sharing the target format, then the rest in
  // registry order — so crawlers and users see the most topically related
  // pages leading every pair's link block.
  const score = (candidate: ConversionPair): number => {
    if (candidate.source === pair.source) return 2;
    if (candidate.target === pair.target) return 1;
    return 0;
  };
  return CONVERSION_PAIRS.filter((candidate) => candidate.slug !== pair.slug)
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => score(b.candidate) - score(a.candidate) || a.index - b.index)
    .map(({ candidate }) => candidate);
}

export const POPULAR_CONVERSION_SLUGS = [
  "csv-to-json",
  "csv-to-sql",
  "excel-to-sql",
  "json-to-csv",
  "csv-to-xml",
];
