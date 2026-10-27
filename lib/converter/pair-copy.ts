import type { ConversionFaq } from "./routes";

/**
 * Pair-specific deep content for the eight CSV/Excel converter landing pages.
 * The generic pipeline copy lives in copy.ts; these sections make each pair's
 * page genuinely distinct (the SEO reason) by documenting the quirks that only
 * matter for that source-target combination (the engineering reason).
 */

export type PairDeepSections = Record<string, { heading: string; body: string[] }[]>;
export type PairExtraFaqs = Record<string, ConversionFaq[]>;

export const PAIR_DEEP_SECTIONS: PairDeepSections = {
  "csv-to-json": [
    {
      heading: "CSV to JSON: where every value stays exactly what you typed",
      body: [
        "CSV has no types — every cell is text — and this converter honors that instead of guessing. Amounts like 0012 keep their leading zeros, phone numbers keep their formatting, and 1,234.56 stays a string rather than being silently parsed into a number that may not round-trip through your API. That deliberate conservatism is why the JSON output has string values everywhere: jq, JavaScript, and Python consumers can coerce exactly where they need to, but the original bytes are never destroyed first. When you do want typed JSON, pre-convert in the consumer (Number(x), int(x)) where the coercion is explicit and reviewable.",
        "The header row becomes the JSON keys verbatim after trimming, so the shape of your output is exactly the shape of your spreadsheet's first row. Duplicate headers — two columns both named Email — get a numeric suffix (Email, Email_2) because JSON objects cannot carry duplicate keys; without that rule the second column would silently overwrite the first. Empty trailing lines and fully blank rows are dropped before conversion, so an export with 500 rows of data and 40 blank lines at the bottom produces a 500-element array, not a 540-element one with null objects.",
      ],
    },
  ],
  "csv-to-sql": [
    {
      heading: "CSV to SQL across engines: quoting, batches, and NULLs",
      body: [
        "The generated DDL and DML are engine-portable by construction: identifiers that are not plain lowercase-safe names are double-quoted (\"Order Total (USD)\"), which is the SQL-standard quoting that PostgreSQL, SQLite, and DuckDB accept natively — and MySQL accepts when ANSI_QUOTES is in its sql_mode. For vanilla MySQL, swap the double quotes for backticks on the identifier lines (values are unaffected: string literals use standard single quotes everywhere). String values are escaped by quote-doubling, the form every engine in the list treats identically, so O'Brien and Conner O'Neal import without incident.",
        "Two engine limits govern the batch size. The 500-row multi-row INSERT default keeps statements well under MySQL's max_allowed_packet (default 64MB in 8.0) and far under the 65,535-placeholder ceiling that parameterized loaders hit — but if your target is Postgres with its 1GB statement cap you can raise the batch size, and for warehouses that prefer smaller transactions (or greenplum-style segment-parallel loads) you can lower it. Empty cells become NULL rather than '' — the right default for NOT NULL analytics and for aggregates like COUNT(col), which skip empty strings but count them if you meant zero.",
      ],
    },
  ],
  "excel-to-sql": [
    {
      heading: "Excel to SQL: the three Excel quirks that break naive imports",
      body: [
        "First: dates. Excel stores dates as serial numbers — days since 1900-01-01 — and a cell displaying 2026-10-24 is actually 46289 underneath. This converter passes cell values through faithfully, which means a Date-formatted column arrives in SQL as that serial number unless you pre-format the column as Text (or convert it in the sheet). Check the inferred column type in the output: a column typed INTEGER holding values in the 40000-50000 range is almost always a date column that needs F2-enter or a TEXT() pass in the workbook before converting.",
        "Second: long numeric identifiers. Excel stores numbers as IEEE 754 doubles with 15 significant digits of precision — a 16-digit order ID pasted as a number is silently mangled on the last digit before any converter ever sees it. The fix is upstream: format ID columns as Text in Excel (they'll left-align and keep every digit), then convert. Third: formulas contribute their cached computed values, not their formulas — what you see in the cell is what converts — but a workbook saved mid-calculation can carry stale caches, so a final save before converting is the cheap insurance.",
      ],
    },
  ],
  "excel-to-json": [
    {
      heading: "Excel to JSON: types, dates, and the 15-digit ceiling",
      body: [
        "Unlike CSV, Excel cells carry real types, and they survive into the JSON output natively: numeric cells become JSON numbers (1200.5 stays 1200.5), boolean cells become true/false, and text cells stay strings. That makes the array-of-objects output ready for APIs that want typed payloads without a coercion layer. The number caveat is precision, not type: Excel's doubles hold 15 significant digits, so a numeric cell holding a 16+-digit identifier has already lost its tail digits inside Excel itself — format identifier columns as Text in the workbook and they convert as exact strings.",
        "Dates are the JSON gotcha worth planning around. Excel dates are serial numbers internally, and the converter is honest about that: a Date-formatted cell arrives in the JSON as its serial value unless the column is formatted as Text first. Teams that need ISO-8601 dates in the output typically add a TEXT(A1, \"yyyy-mm-dd\") helper column in the workbook — one formula, no ambiguity, and the JSON carries the exact string you specified. Blank cells become empty strings rather than null, keeping key sets consistent across every object in the array for consumers that iterate keys.",
      ],
    },
  ],
  "csv-to-soql": [
    {
      heading: "CSV to SOQL IN: Salesforce-ready filters from one column",
      body: [
        "The IN clause this tool generates is Salesforces's bulk-fetch idiom: WHERE Id IN ('001...', '003...') selects exactly the records your CSV names, in one query, without chaining OR conditions. The converter takes the column you pick, trims each value, drops blanks, deduplicates while preserving first-seen order, and single-quote-escapes with Salesforce's backslash rules — so Ids exported from a report (with their inevitable trailing spaces) clean up automatically. Beyond 200 unique values the output splits into commented OR-joined chunks because the Developer Console and API both degrade on very long IN lists long before hard limits.",
        "Id format matters more in Salesforce than anywhere else: 15-character case-sensitive Ids (classic UI exports) and 18-character case-insensitive Ids (API, reports) both work in SOQL, but they are not interchangeable in external keys and joins — pick one form per filter and stick to it. For custom external-ID fields the same generated clause pattern applies with your field's API name (External_Id__c); the chunked output pastes cleanly into the Developer Console Query Editor, Workbench, or Execute Anonymous, and the per-chunk comments make a 3,000-value filter auditable at a glance.",
      ],
    },
  ],
  "excel-to-soql": [
    {
      heading: "Excel to SOQL: report exports to filter clauses without paste-cleanup",
      body: [
        "Excel exports are where SOQL IN clauses go to die: one column of Ids, plus blank cells, plus a header, plus at least one cell Excel 'helpfully' rendered in scientific notation. This converter handles the column end-to-end — drop the workbook on the input pane, select the Id column as the SOQL source, and every value is trimmed, blank-stripped, deduplicated, and quote-escaped into WHERE ... IN (...) form. Numeric-looking Ids that Excel converted to numbers keep their digits as text (the cell's displayed value converts), and the 200-value chunking follows Salesforce's IN-list best practice automatically.",
        "Two Salesforce-specific disciplines make the output production-safe. First, dedupe before you filter: report exports routinely contain the same Id many times, and a deduplicated list is both shorter and faster against the query parser. Second, respect the governor math: SOQL returns at most 50,000 rows per Apex-invoked query, and a 3,000-Id IN clause against a selective index is fine while the same clause against a non-indexed custom field is a selective-query exception waiting to happen. Id and external-ID fields are indexed; arbitrary text fields usually are not — filter on the indexed ones.",
      ],
    },
  ],
  "csv-to-xml": [
    {
      heading: "CSV to XML: elements-per-cell, escaped and validated",
      body: [
        "The generated document is deliberately element-per-cell — every column becomes a child element of a row element — rather than attribute-based, because element content survives characters that attribute values often cannot and because downstream XPath is simpler (records/record[Email] rather than records/record/@Email). If your integration demands attributes instead, an XSLT transform or a consumer-side mapping is the standard follow-up; the document structure here is the one that validates cleanly against a schema generated from the same table shape.",
        "Escaping is total and specification-accurate: &, <, >, ', and \" become their entity forms in text nodes, so a CSV of HTML snippets, math comparisons, or ampersand-laden company names converts without a single malformed document. Tag names follow XML's stricter rules via deterministic sanitization — First Name becomes First_Name, 2024 Total becomes _2024_Total — and empty cells emit self-closing elements (<Notes/>) rather than omitted tags, which keeps the document shape regular for validators and XPath consumers that count children. The root and row element names are configurable to match whatever vocabulary the receiving system validates against.",
      ],
    },
  ],
  "excel-to-xml": [
    {
      heading: "Excel to XML: typed cells into a regular, valid document",
      body: [
        "Excel's real cell types flow through to XML text nodes as their natural string form: numeric cells serialize without Excel's display formatting (1234.5, not the 1,234.50 shown in the sheet), booleans become true/false, and text stays verbatim. Date-formatted cells convert as their underlying serial numbers — Excel's internal representation — so teams feeding date fields into an XML integration add a TEXT(date_col, \"yyyy-mm-dd\") helper column in the workbook first; the converted XML then carries the exact ISO string rather than a number the consumer would have to interpret.",
        "The document shape mirrors the worksheet one-to-one: first row becomes the element names (sanitized to XML rules, with positional fallbacks for blank headers), every subsequent row becomes a row element, and blank spreadsheet rows are skipped entirely rather than emitted as empty elements — which keeps the element count honest to the data. Multi-sheet workbooks convert their first sheet; move the sheet you need to position one in Excel before converting, or export that sheet as CSV and use the CSV input. The 15MB cap comfortably covers multi-thousand-row workbooks, with parsing off the main thread above 1MB.",
      ],
    },
  ],
  "json-to-csv": [
    {
      heading: "JSON to CSV: from trees to rectangles without losing data",
      body: [
        "CSV is rectangular; JSON is a tree — and the distance between those two shapes is where converters usually lose data. This one flattens deliberately: nested objects become dot-path columns (user.address.city stays addressable and auditable), arrays serialize to their JSON text inside the cell, and null becomes an empty cell rather than the string 'null'. The header set is the union of keys across every record in first-seen order, so sparse JSON — objects with different fields — converts with blanks instead of errors, and nothing is silently dropped because it appeared in row 402 but not row 1.",
        "The type story is preserved honestly: JSON numbers and booleans keep their native types through the pipeline and serialize naturally into the CSV text (1200.5, true), while strings stay strings. No date guessing, no number coercion of identifier-like strings, no silent reformatting — the CSV is the JSON, flattened and quoted, and nothing else. That discipline is what makes the output safe to import into a database or spreadsheet without a data-integrity review. When the destination is code instead of a rectangle, the [JSON to Apex class generator](/json-to-apex/) maps the same payload to typed Salesforce wrapper classes.",
      ],
    },
  ],
  "sql-to-csv": [
    {
      heading: "SQL to CSV: turning INSERT dumps back into data",
      body: [
        "Every INSERT dump carries a table hiding inside it: the column list names the fields, each value tuple is a row, and multi-row VALUES plus repeated statements are just one table sharded across statements. The parser reconstructs exactly that — merging every tuple it finds, un-escaping SQL string literals ('' back to '), mapping NULL to an empty cell, and passing TRUE/FALSE and numerics through as their natural values. Column lists may be quoted any way your engine likes: double quotes, backticks, brackets, or bare.",
        "The reverse trip composes: output from this site's CSV/Excel-to-SQL converters parses back to the original rows, making JSON-to-SQL-to-CSV a lossless round-trip when you need to move data through a SQL-shaped checkpoint. The boundary is honest and stated: values must be literals — SELECT statements and placeholder parameters contain no rows to extract, and the parser rejects them with a specific message rather than a partial guess.",
      ],
    },
  ],
  "csv-to-markdown": [
    {
      heading: "CSV to Markdown: tables people actually read in review",
      body: [
        "A Markdown table is documentation's unit of truth — but hand-writing pipes and alignment rows is error-prone drudgery that this converter removes. The generated GFM table inherits the CSV's header row exactly, escapes pipes inside cells so a value cannot terminate its own column, and converts embedded line breaks to <br> — the two transformations that separate a table that renders from a table that collapses. Drop a CSV from a benchmark run into the README, paste the output, done.",
        "The alignment row is generated with intent: numeric columns — detected by checking every non-empty value — get GFM's right-align form (---:) so figures line up under their headers, and everything else stays left-aligned. Toggle it off for renderers without alignment support. Because the input sniffs delimiters, pasted TSV (straight from Excel or a database CLI) and semicolon files convert identically — the table you paste into a PR is the table your spreadsheet showed.",
      ],
    },
  ],
  "csv-to-yaml": [
    {
      heading: "CSV to YAML: rows into the config-file shape",
      body: [
        "The output is the YAML shape configuration tooling actually consumes: a block-style list of mappings, one list item per row, one key per line. That is the structure Ansible inventories, docker-compose service fragments, and CI matrices expect — not flow-style JSON-in-YAML that linters reject and humans reread twice. Headers become keys verbatim, so your spreadsheet's column names are your config's field names, visible in the diff when they change.",
        "Scalar quoting is where YAML generation gets hard, and where this converter is deliberately conservative: values that would parse as booleans, null, or numbers (true, yes, on, null, ~, 42, 1e5) are double-quoted; values containing YAML indicators like a colon or hash are quoted; everything else stays bare and readable. Empty cells become quoted empty strings, because bare emptiness in YAML is null — the distinction that preserves your data model when the file is loaded back.",
      ],
    },
  ],
  "json-to-yaml": [
    {
      heading: "JSON to YAML: tree in, tree out",
      body: [
        "JSON and YAML are both tree formats, so this converter preserves structure instead of flattening it: nested objects become nested block mappings, arrays become block sequences, an array of objects becomes the list-of-mappings shape Ansible inventories, docker-compose fragments, and CI matrices expect, and a single object becomes a plain mapping document — not wrapped in a list — because that is the shape config files actually have. The only inputs that flatten are the two explicitly tabular JSON shapes (an array of arrays with its first row as a header, and an object of column arrays), which convert through the same table pipeline as the CSV and Excel paths — matching how every other converter on this site interprets them. The sibling tools follow the same rule by target: [JSON to CSV](/json-to-csv/) and [JSON to Excel](/json-to-excel/) flatten to rectangles because spreadsheets are rectangular, [JSON to Apex](/json-to-apex/) turns the payload into a typed Salesforce wrapper class instead of another data format, while [CSV to YAML](/csv-to-yaml/) and [Excel to YAML](/excel-to-yaml/) share this page's block-style output — and the [full conversion studio](/csv/) switches formats without losing your input.",
        "Scalar translation is where naive JSON-to-YAML conversion corrupts data, because the two formats disagree about bare words: the JSON string \"on\" must be quoted in YAML or it loads as true, \"8080\" must be quoted or it loads as a number, and the string \"null\" must be quoted or it loads as nothing at all. The generator quotes exactly those strings and leaves safe ones bare; JSON numbers and booleans pass through unquoted because YAML reads them identically, and JSON null becomes YAML null — the honest translation of the value rather than an empty-string stand-in that changes the data model on load.",
      ],
    },
  ],
  "excel-to-markdown": [
    {
      heading: "Excel to Markdown: from spreadsheet to PR-ready table",
      body: [
        "The two paths in are both one step: drop the workbook (first sheet, first row as header) or copy a range in Excel and paste — the clipboard carries TSV, which the delimiter sniffer detects without any settings. The path out is a GitHub-Flavored Markdown table that inherits the sheet's headers exactly, escapes pipes inside cells, converts embedded line breaks to <br>, and right-aligns columns that are numeric end to end. It is the fastest honest route from a spreadsheet somebody maintains to a table a PR reviewer can read.",
        "The fidelity rules mirror the Excel engine's own: formula cells contribute their cached computed values — what the cell displays is what converts — and numeric cells serialize without the sheet's display formatting (1234.5, not 1,234.50), which is almost always what a documentation table wants. A final save with recalculation before converting guarantees the caches are current, and the 15MB client-side cap covers workbooks far larger than any table a README needs.",
      ],
    },
  ],
  "excel-to-yaml": [
    {
      heading: "Excel to YAML: config data without the YAML hand-editing",
      body: [
        "YAML files are how teams encode configuration; spreadsheets are how stakeholders actually edit data. This converter closes that gap: each row becomes a block-style list item with headers as keys, ready for Ansible inventories, docker-compose service fragments, or CI matrices — the structure config tooling consumes, not flow-style JSON that linters reject. The header row is the contract: rename a column in the sheet and the generated key changes with it, visibly in the diff.",
        "Scalar quoting is where YAML generation silently corrupts data, and the rules here are explicit: booleans-in-disguise (yes, no, on, off), null-like values, numbers, and indicator-bearing strings are double-quoted; everything else stays bare. Excel-specific traps get the same treatment — date-formatted cells convert as their serial numbers unless the column is Text-formatted first, and numeric IDs beyond 15 digits were already rounded inside Excel's doubles, so ID columns belong formatted as Text before they ever reach a converter. For the same block-style output from other inputs, see the [JSON to YAML](/json-to-yaml/) and [CSV to YAML](/csv-to-yaml/) converters, take the same workbook to documentation with [Excel to Markdown](/excel-to-markdown/), or open the [conversion studio](/csv/) to switch formats without losing your input.",
      ],
    },
  ],
  "xml-to-json": [
    {
      heading: "XML to JSON: the conventions, stated up front",
      body: [
        "Every XML-to-JSON converter makes judgment calls; this one publishes them. Attributes become @-prefixed properties, repeated sibling elements become arrays while single occurrences stay scalars, mixed content concatenates into #text, and empty elements become null. Namespaced tags are kept exactly as written — atom:feed stays atom:feed — because silently stripping prefixes is how two different elements collapse into one key. None of these rules is exotic; together they are the closest thing the ecosystem has to a standard mapping, and every one is applied deterministically.",
        "The scalar rules are the conservative set: true/false and round-trippable numbers convert to native JSON types, while leading-zero identifiers, phone numbers, and version strings stay strings — the values a force-cast would corrupt. CDATA is preserved verbatim with no sniffing, entities (named and numeric) are decoded, and malformed XML is rejected with a line-and-column diagnosis instead of a best-effort tree. The JSON out is the XML in, translated honestly.",
      ],
    },
  ],
  "json-to-excel": [
    {
      heading: "JSON to Excel: typed cells or it does not count",
      body: [
        "The failure mode of most JSON-to-Excel tools is that they are CSV converters in disguise: every value becomes text, and the first SUM() over the amount column returns zero. This generator writes real Office Open XML — numbers as numeric cells, booleans as TRUE/FALSE, nulls as empty cells — so aggregation, filtering, and pivot tables work the instant the workbook opens. Column widths are sized to content and capped, so the sheet is readable before anyone touches anything.",
        "The JSON side accepts all four shapes real data arrives in — array of objects, single object, array of arrays, object of column arrays — with nested objects flattened to dot-path columns and arrays serialized to JSON text in their cell. The workbook is generated in the same Web Worker pipeline as every other target, under the same 15MB browser-safety cap, and the preview pane shows the parsed table before you download a byte. For the same JSON on a code-shaped destination, the [JSON to Apex class generator](/json-to-apex/) emits typed Salesforce wrapper classes with parse() and serialize() helpers.",
      ],
    },
  ],
  "sql-to-excel": [
    {
      heading: "SQL to Excel: dump analysis without a database",
      body: [
        "The classic reason this converter exists: someone hands you a .sql file of INSERT statements and asks a question about the data, and the answer should not require provisioning a database. Paste the dump, get a workbook: column lists become headers, multi-row VALUES tuples become rows, repeated statements merge, '' un-escapes to ', NULL becomes an empty cell, and numerics keep their types into real numeric cells.",
        "The boundary is the same honest one the SQL-to-CSV converter states: values must be literals. pg_dump --inserts and mysqldump's default output parse natively; INSERT ... SELECT and placeholder-parameterized statements contain no rows to extract and are rejected with a specific message. Nothing executes, nothing connects, nothing uploads — the dump is read as text in your browser and the workbook is written by it.",
      ],
    },
  ],
  "xml-to-csv": [
    {
      heading: "XML to CSV: record extraction done honestly",
      body: [
        "CSV needs rows; XML is a tree. The bridge is the repeating record element — the structural signature of tabular data hiding inside a document — and this converter finds it deterministically: depth-first, first array whose members are all objects. <book> inside <books>, <url> inside a sitemap, <item> inside a feed: each occurrence becomes a row, attributes become @-prefixed columns, nested elements flatten to dot paths, and the union of keys in first-seen order becomes the header.",
        "When the signature is absent, the converter refuses rather than guesses — a single-record document has no table, and inventing one would be fabricating data. Scalar sniffing matches the site-wide conservative rules (007 stays text, 5.95 becomes a number), CDATA passes through verbatim, and malformed XML reports its line and column. Sitemaps, feeds, and vendor exports convert the same way every time.",
      ],
    },
  ],
  "xml-to-excel": [
    {
      heading: "XML to Excel: from feed to pivot table in one step",
      body: [
        "The pipeline is record extraction plus real workbook generation: the same repeating-element detection that powers XML to CSV feeds a generator that writes typed cells — numerics as numbers Excel can aggregate, booleans as TRUE/FALSE, nulls as blanks — with content-sized columns. The step from 'here is a feed' to 'here is a chart-ready sheet' is one paste, one click, and one download, with the preview pane showing exactly which records and columns were detected.",
        "The @-prefixed attribute columns and dot-path nesting match the JSON converter's conventions on purpose: XML, JSON, and SQL sources all produce the same kind of table, so mixed-source workflows stay coherent. And because the workbook is assembled client-side in the same worker as every other target, the vendor exports and internal feeds that need this most never leave the machine doing the converting.",
      ],
    },
  ],
};

export const PAIR_EXTRA_FAQS: PairExtraFaqs = {
  "csv-to-json": [
    {
      question: "Why are all my CSV values strings in the JSON output?",
      answer:
        "Because CSV itself is untyped text and coercing it silently would destroy data. Leading zeros (0012), comma-formatted numbers (1,234.56), and region-specific decimals all survive exactly as written when values stay strings — a naive parse would turn 0012 into 12 and 1,234.56 into a parse error or a wrong number. Consumers coerce explicitly where they want types (Number(value) in JavaScript, int(value) in Python), which keeps the conversion step lossless and the coercion step reviewable in code.",
    },
    {
      question: "Can I convert CSV to JSON with nested objects instead of a flat array?",
      answer:
        "The converter emits the standard array-of-flat-objects shape that APIs and NoSQL importers expect. Nesting is a consumer-side reshape: in jq, a reduce over the keys builds objects from dotted paths; in JavaScript, a small splitter on '.' in the key builds the tree. Keeping the converter flat is deliberate — the flat form is deterministic and reversible, while nested shapes vary per integration, so the reshape belongs in the pipeline that knows the target schema.",
    },
  ],
  "csv-to-sql": [
    {
      question: "Is the generated SQL compatible with MySQL, PostgreSQL, and SQLite?",
      answer:
        "Yes — with one identifier note. String literals use single quotes with quote-doubling and NULLs are untyped, which every engine accepts identically. Identifiers that need quoting are double-quoted, the SQL-standard form native to PostgreSQL, SQLite, and DuckDB; MySQL accepts it with ANSI_QUOTES in sql_mode, or you can swap those quotes to backticks for vanilla MySQL. The multi-row INSERT statements with DROP TABLE / CREATE TABLE headers run as-is on all three engines.",
    },
    {
      question: "How do I change the table name and skip the DROP TABLE statement?",
      answer:
        "Both are options in the output bar: the Table name field sets the name used in the DROP, CREATE, and INSERT statements, and the DROP TABLE IF EXISTS toggle removes the drop entirely when your table already exists with data you are appending to. For append workflows, also consider raising the batch size — larger multi-row INSERTs mean fewer round-trips against an existing table.",
    },
  ],
  "excel-to-sql": [
    {
      question: "Why did my Excel date column import as numbers like 46289?",
      answer:
        "Excel stores dates as serial numbers — days since 1900-01-01 — and 46289 is 2026-10-24 in that system. The converter passes cell values through faithfully rather than guessing which numeric columns are dates, so a Date-formatted column arrives as its serial. Format the column as Text in Excel first (the displayed date becomes the stored text), or add a helper column with TEXT(A2, \"yyyy-mm-dd\") and convert that column instead — either way the SQL receives the literal date string you intended.",
    },
    {
      question: "How do I stop Excel from mangling my long numeric IDs before conversion?",
      answer:
        "Prevent it at the source: format the ID columns as Text in Excel before entering or pasting the data. Excel stores numbers as 64-bit doubles with 15 significant digits, so a 16-digit ID is rounded on its last digit the moment Excel treats it as a number — no converter downstream can recover a digit Excel already discarded. Text-formatted cells (left-aligned by default) preserve every character, and the SQL output then inserts the exact identifier as a VARCHAR value.",
    },
  ],
  "excel-to-json": [
    {
      question: "Do Excel formulas convert as their values or as the formula text?",
      answer:
        "As the computed value. A cell showing 42 from =SUM(A1:B1) converts as 42 — the cached result Excel stores with the cell, not the formula string. That is what virtually every JSON consumer wants. One caveat: if a workbook was closed while calculation was pending, a stale cached value can persist, so a final save with recalculation (F9 or Ctrl+Alt+F9) before converting guarantees the caches are current.",
    },
    {
      question: "Which worksheet does the converter use from a multi-sheet workbook?",
      answer:
        "The first sheet — the one at position one in the tab order. Convert-then-reshape is the standard workflow: if the data you need lives on sheet three, either drag that sheet to position one in Excel, or right-click and export that sheet as CSV and use the CSV input. The first-sheet rule keeps the conversion deterministic and makes the row and column counts in the parse summary match exactly what converted.",
    },
  ],
  "csv-to-soql": [
    {
      question: "How many values can a SOQL IN clause hold?",
      answer:
        "SOQL has no hard documented per-clause value limit, but practical limits bite much earlier: the Developer Console rejects statements around 100,000 characters, and query performance degrades on very long IN lists well before that. Best practice is about 200 values per clause, which the converter enforces automatically — longer value lists are split into commented, OR-joined chunks of 200 or fewer that you can paste together or run as separate filters.",
    },
    {
      question: "Should I use 15-character or 18-character Salesforce Ids in the IN clause?",
      answer:
        "Either works in SOQL — 15-character Ids are case-sensitive, 18-character Ids add a case-insensitive suffix — but be consistent within one filter and match the field you are filtering. If your CSV mixes both forms from different sources, deduplicate on the 18-character form first (the converter's dedupe is exact-string, so 001xx...4AA4 and its 18-char expansion would both survive). For external joins outside SOQL, standardize on 18-character everywhere.",
    },
  ],
  "excel-to-soql": [
    {
      question: "Why are values deduplicated in the generated SOQL clause?",
      answer:
        "Because report exports almost always contain repeats — the same Account Id on every opportunity row — and duplicate values in an IN clause add parser work and character count without matching anything new. The converter deduplicates while preserving first-seen order, so the generated clause is the shortest filter matching exactly your value set. If you need occurrence counts, generate them from the spreadsheet (a pivot on the column) rather than the filter clause.",
    },
    {
      question: "Can I filter on a custom external-ID field instead of Id?",
      answer:
        "Yes — set the Target SOQL field to your field's API name (External_Id__c, Legacy_Customer_No__c) and select the column holding those values. External-ID fields are indexed by default in Salesforce, making them the right join key for data loads — and unlike Id, they are stable across sandbox refreshes. The 200-value chunking and escaping apply identically; only the field name on the left side of IN changes.",
    },
  ],
  "csv-to-xml": [
    {
      question: "Can I get XML attributes instead of child elements for my columns?",
      answer:
        "The converter emits element-per-cell — the most portable and XPath-friendly shape — rather than attribute-based records. Attribute form is a consumer-specific mapping: an XSLT transform converts the two shapes mechanically, or the receiving integration maps fields as it parses. Element content also tolerates every escaped character identically, whereas attribute-heavy schemas complicate validators and tooling for no structural gain.",
    },
    {
      question: "How are special characters like & and < handled in the XML output?",
      answer:
        "All five XML-reserved characters are escaped to their standard entity forms in text nodes — &amp;, &lt;, &gt;, &apos;, and &quot; — so values containing HTML fragments, math operators, or company names with ampersands produce well-formed documents every time. Header names that cannot serve as tag names (starting with a digit, containing spaces) are sanitized deterministically: First Name becomes First_Name, 2024 Total becomes _2024_Total.",
    },
  ],
  "excel-to-xml": [
    {
      question: "How do Excel date cells appear in the XML output?",
      answer:
        "As their underlying serial number — Excel's actual storage format for dates (days since 1900-01-01). The converter preserves cell values as Excel holds them rather than guessing display formats, which vary per cell. For date-shaped XML, add a TEXT(date_cell, \"yyyy-mm-dd\") helper column in the workbook and include that column instead — the XML then carries the exact ISO string, with no ambiguity about time zones or display formats.",
    },
    {
      question: "What happens to blank cells and blank rows in the XML?",
      answer:
        "Blank cells become self-closing elements (<Notes/>) — present-but-empty, which keeps every row element structurally identical for validators and XPath consumers that count children. Fully blank spreadsheet rows are dropped entirely rather than emitting empty row elements, so the document's row count matches your data's row count exactly. Headers that are blank get positional fallback names (column_2) so no cell is ever left without its element.",
    },
  ],
  "json-to-csv": [
    {
      question: "What happens to null values and missing fields?",
      answer:
        "JSON null becomes an empty CSV cell, and records missing a key that other records carry get the same empty cell for it — the header set is the union of all keys, so sparse arrays of objects convert with blanks rather than errors or dropped columns. That is the correct default for spreadsheets and database imports, where an empty cell is the universal 'no value' signal. The string 'null' from your data stays the literal text 'null', distinct from a real JSON null.",
    },
    {
      question: "Why is my deeply nested JSON producing so many columns?",
      answer:
        "Because flattening is exhaustive by design: every leaf scalar becomes its own dot-path column (user.address.city), which preserves all data at the cost of width. If the output is wider than you want, pre-shape the JSON (map it to the fields you need) or post-filter the CSV columns — both are safer than a converter guessing which branches to collapse. Arrays inside objects serialize to JSON text in a single cell rather than exploding, so width is bounded by your object depth, not array length.",
    },
  ],
  "sql-to-csv": [
    {
      question: "Does the converter run a database connection?",
      answer:
        "Never — there is no database, no driver, and no execution of any kind. The parser reads the INSERT text you paste as text, extracting column lists and literal value tuples exactly as written. That is also why it is safe for production dumps: the data never leaves your machine, and no statement can execute as a side effect of conversion.",
    },
    {
      question: "What about INSERTs generated with placeholders or SELECT ... INSERTs?",
      answer:
        "Those are out of scope by design: statements like INSERT ... SELECT or INSERT with ? placeholders contain no literal rows to extract, and the parser rejects them with a specific message instead of producing a misleading partial table. Export literal INSERTs (mysqldump, pg_dump --inserts, or this site's own SQL generator) and the parser handles them natively.",
    },
  ],
  "csv-to-markdown": [
    {
      question: "Will the generated table render on GitHub and GitLab?",
      answer:
        "Yes — the output is GitHub-Flavored Markdown, the table dialect both platforms render natively, and Bitbucket and common documentation generators (Docusaurus, MkDocs with tables extension) accept the same syntax. The alignment row uses GFM's standard ---/---: forms, and cell escaping follows the GFM spec's rules for pipes and line breaks, so the table renders the same everywhere GFM does.",
    },
    {
      question: "How do I paste an Excel range directly as a Markdown table?",
      answer:
        "Copy the range in Excel — the clipboard carries TSV — and paste it here as the CSV source: the delimiter sniffer detects the tabs automatically, and the Markdown table appears with your selection's first row as the header. No export step, no intermediate file. The same path works for pastes from database CLIs and Google Sheets with TSV clipboard settings.",
    },
  ],
  "csv-to-yaml": [
    {
      question: "Is the output valid YAML 1.2?",
      answer:
        "Yes — block style, correct scalar quoting, and consistent indentation that strict loaders and yamllint accept. The generator quotes every scalar that YAML 1.2's core schema would otherwise reinterpret (booleans, null, numbers) and every string containing structural indicators, so a value like 'on' or '0755' or 'role: admin' survives a load round-trip byte-identically instead of silently becoming a boolean, number, or mapping.",
    },
    {
      question: 'Why are empty cells written as "" instead of being left blank?',
      answer:
        "Because in YAML an empty value means null, not an empty string — and conflating them changes your data model the moment the file is loaded. Writing the quoted empty string preserves the distinction: the CSV cell was empty text, so the YAML scalar is empty text. Converters that leave it bare produce nulls that downstream code then has to special-case; this one does not create that bug for you.",
    },
  ],
  "json-to-yaml": [
    {
      question: "Does the output use tabs or spaces, and which YAML version is it valid for?",
      answer:
        "Two-space block indentation, never tabs — the convention every YAML loader and yamllint's default rules expect. The output targets the YAML 1.2 core schema: block style only (flow syntax appears solely for explicit empty collections, as [] and {}), scalar quoting applied per the 1.2 resolution rules, and key order matching your JSON's key order so diffs track the source. PyYAML, Go's gopkg.in/yaml.v3, JavaScript's js-yaml, and Rust's serde_yaml all parse the result identically.",
    },
    {
      question: "Can I convert a JSON API response into a Kubernetes manifest or CI config?",
      answer:
        "Yes — that is the canonical use case. API responses and generated config JSON convert to block YAML with structure preserved, so a JSON deployment spec becomes the indented manifest Kubernetes expects. For multi-document manifests, convert each JSON document separately and join the outputs with --- separators; the generator emits one document per conversion by design, so outputs compose without structural surprises.",
    },
  ],
  "excel-to-markdown": [
    {
      question: "Which worksheet and rows does the converter use?",
      answer:
        "The first worksheet in tab order, with its first row as the header and every subsequent non-blank row as data — the same rule every converter on this site follows, so behavior is predictable across formats. If the table you need lives on another sheet, drag it to position one in Excel first, or copy just that range and paste it (pastes arrive as TSV and convert identically).",
    },
    {
      question: "Why does my numeric column show 1234.5 instead of the 1,234.50 I see in Excel?",
      answer:
        "Because the converter uses the cell's underlying value, not its display formatting. Excel's number formats (thousands separators, currency symbols, decimal padding) are presentation, not data — and baking them into a Markdown table would freeze formatting into documentation. If you want the displayed form, format the column as Text in Excel so the displayed string becomes the stored value, then convert.",
    },
  ],
  "excel-to-yaml": [
    {
      question: "Can I key the YAML by a column value instead of getting a list?",
      answer:
        "The converter emits the canonical list-of-mappings shape that Ansible, docker-compose, and CI tooling expect. Keying by a column is a deliberate consumer-side reshape — a two-line jq or Python transform from this exact output — and keeping the generator canonical means the same spreadsheet converts identically everywhere it is used, rather than into per-integration shapes.",
    },
    {
      question: "How do booleans in my sheet convert?",
      answer:
        "Genuine Excel boolean cells (TRUE/FALSE) become native YAML true/false scalars. Text cells reading 'yes', 'no', 'on', or 'off' are quoted — because YAML 1.2 would otherwise load them as booleans and silently change your data's type. That quoting rule is the difference between a config file that means what the spreadsheet said and one that means something adjacent to it.",
    },
  ],
  "xml-to-json": [
    {
      question: "Why do attributes have an @ prefix in the JSON output?",
      answer:
        "Because attributes and child elements live in the same name space and can collide — an element with both an id attribute and an <id> child needs both to survive. The @ prefix (the convention used by mainstream XML-to-JSON libraries) keeps them distinct and makes the mapping back to the source document unambiguous. It is documented, deterministic, and applied to every document identically.",
    },
    {
      question: "Will an element that appears once ever become an array?",
      answer:
        "Only if it repeats in the document you paste — the converter types what it observes, honestly. If you know a field always carries multiple values, paste a document where it does (or two documents and merge), rather than trusting a tool that guesses every element might repeat. Consistent input produces consistent JSON, and the rules never vary between runs.",
    },
  ],
  "json-to-excel": [
    {
      question: "Why do numbers sometimes arrive as text in other converters?",
      answer:
        "Because those tools generate CSV or write every cell as a string, leaving Excel to guess — and Excel's guesses corrupt leading-zero IDs and long numbers. This converter writes typed cells directly into the .xlsx format: genuine numeric and boolean cells with the type carried in the file, no guessing stage involved, and identifier-like strings preserved as text precisely because they were strings in your JSON.",
    },
    {
      question: "Can I convert multiple JSON shapes in one workbook?",
      answer:
        "One conversion produces one sheet from one shape — the deterministic behavior that makes outputs safe to automate. For multi-shape workbooks, convert each payload separately and combine in Excel, or merge the JSON first. A converter that silently mixed shapes into one sheet would be inventing a schema your data never agreed to.",
    },
  ],
  "sql-to-excel": [
    {
      question: "What about the CREATE TABLE statement in my dump?",
      answer:
        "It is skipped automatically — the parser is after rows, not DDL. Column types are inferred from the actual values in the tuples (numbers as numeric cells, booleans as TRUE/FALSE, everything else text), which is more honest than trusting a schema that may not match the data. The INSERT statements' column list, quoted or bare, becomes the header row.",
    },
    {
      question: "How fast is a large dump converted?",
      answer:
        "Parsing is single-pass and linear in the dump's size, with anything over 1MB handled inside a background Web Worker so the tab stays interactive. The 15MB cap covers dumps of roughly a million short rows — and because nothing uploads, the network is never the bottleneck; your CPU does the whole job locally.",
    },
  ],
  "xml-to-csv": [
    {
      question: "Which element becomes the header row?",
      answer:
        "There is no header element in XML — headers come from the record's own structure: attribute names (with @ prefix) and flattened element paths become columns, unioned across all records in first-seen order. A record missing a field the others carry gets an empty cell, mirroring the JSON converter's sparse-record behavior so both pipelines produce compatible CSVs.",
    },
    {
      question: "Can I convert a sitemap or RSS feed directly?",
      answer:
        "Yes — they are the canonical use cases. A sitemap's repeating <url> elements and a feed's repeating <item> elements are exactly the record signature the extractor looks for, so pasting either produces one row per entry with loc, lastmod, title, and pubDate as columns. Try it with a real feed URL's source: view-source, copy, paste, convert.",
    },
  ],
  "xml-to-excel": [
    {
      question: "Does the workbook preserve my XML's hierarchy?",
      answer:
        "As far as a spreadsheet honestly can: nesting flattens to dot-path columns (author.name), attributes keep their @ prefix, and deeper repeated elements serialize as JSON text in their cell. Spreadsheets are rectangles, and the flattening is the same one the JSON tools use — so the structure is recoverable and consistent rather than mangled into ambiguous columns.",
    },
    {
      question: "What if my document has several repeating elements?",
      answer:
        "The converter picks the first one found in document order — deterministic and predictable for the same schema. If you need the second record set (a feed with both <item> and <category> arrays, say), wrap or trim the document to the records you want, or convert twice and combine. Explicit choice beats a converter silently interleaving two tables into one sheet.",
    },
  ],
};

export function getPairDeepSections(slug: string): { heading: string; body: string[] }[] {
  return PAIR_DEEP_SECTIONS[slug] ?? [];
}

export function getPairExtraFaqs(slug: string): ConversionFaq[] {
  return PAIR_EXTRA_FAQS[slug] ?? [];
}
