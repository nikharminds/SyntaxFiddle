/**
 * Single source of truth for the Salesforce tool cluster: powers the navbar
 * dropdown, the /salesforce/ hub page, and contextual cross-links on every
 * Salesforce tool page. Keeping the list in one module guarantees the hub,
 * the navigation, and the in-page link equity stay consistent.
 */

export type SalesforceToolLink = {
  /** Canonical href with trailing slash (site-wide convention). */
  href: string;
  /** Full display label (nav, related-link lists). */
  label: string;
  /** Compact label for tight layouts. */
  shortLabel: string;
  /** One-line value proposition for hub cards. */
  tagline: string;
  /** Optional highlight badge, e.g. "New". */
  badge?: string;
};

export const SALESFORCE_HUB_URL = "/salesforce/";

export const SALESFORCE_TOOLS: SalesforceToolLink[] = [
  {
    href: "/salesforce-debug-log-analyzer/",
    label: "Debug Log Analyzer",
    shortLabel: "Log Analyzer",
    tagline: "N+1 loop detection, governor-limit heat maps, and exceptions with stack traces — parsed from raw debug logs in your browser.",
    badge: "New",
  },
  {
    href: "/soql-formatter/",
    label: "SOQL Formatter",
    shortLabel: "SOQL Formatter",
    tagline: "Beautify any SOQL query — subqueries, TYPEOF, and __r relationship paths handled natively.",
  },
  {
    href: "/json-to-apex/",
    label: "JSON to Apex Class Generator",
    shortLabel: "JSON to Apex",
    tagline: "Typed Apex wrapper classes from JSON, with @AuraEnabled for LWC and callout helpers.",
  },
  {
    href: "/csv-to-soql/",
    label: "CSV to SOQL IN Clauses",
    shortLabel: "CSV to SOQL",
    tagline: "Turn spreadsheet columns into safely escaped WHERE IN lists for bulk queries.",
  },
  {
    href: "/excel-to-soql/",
    label: "Excel to SOQL IN Clauses",
    shortLabel: "Excel to SOQL",
    tagline: "Convert .xlsx and .xls columns into SOQL IN clauses without opening Excel.",
  },
  {
    href: "/tools/curl-to-salesforce-apex/",
    label: "cURL to Salesforce Apex",
    shortLabel: "cURL to Apex",
    tagline: "Transpile cURL commands into Apex HttpRequest callout code with headers and auth.",
  },
];

export const SALESFORCE_HUB_TITLE =
  "Salesforce Developer Tools — Free, Online & 100% Client-Side | SyntaxFiddle";

export const SALESFORCE_HUB_DESCRIPTION =
  "Every SyntaxFiddle Salesforce tool in one place: debug log analyzer with N+1 detection, SOQL formatter, JSON to Apex class generator, CSV & Excel to SOQL converters, and cURL to Apex — free, online, and parsed entirely in your browser. No org login, no uploads.";

export const SALESFORCE_HUB_KEYWORDS = [
  "salesforce tools",
  "salesforce developer tools",
  "free salesforce tools online",
  "salesforce debug log analyzer",
  "apex debug log analyzer",
  "soql formatter online",
  "json to apex generator",
  "csv to soql",
  "excel to soql",
  "curl to apex",
  "salesforce apex tools",
  "client-side salesforce tools",
  "salesforce admin tools",
  "n+1 soql detector",
];

export const SALESFORCE_HUB_FAQS = [
  {
    question: "Are these Salesforce tools really free, and do they need org access?",
    answer:
      "Yes — every tool is free with no account, and none of them connects to your Salesforce org. There is no OAuth flow and no API key: the pages are statically exported and all processing (parsing, formatting, generation) happens in your browser with JavaScript.",
  },
  {
    question: "Which Salesforce debug log events can the analyzer parse?",
    answer:
      "The analyzer decodes the full event stream: EXECUTION_STARTED/FINISHED, CODE_UNIT_STARTED/FINISHED, SOQL_EXECUTE_BEGIN/END/EXPLAIN, SOSL_EXECUTE_BEGIN/END, DML_BEGIN/END, LIMIT_USAGE_FOR_NS, CALLOUT_REQUEST, USER_DEBUG, EXCEPTION_THROWN, FATAL_ERROR with stack frames, and truncation markers. It also detects N+1 patterns by fingerprinting structurally identical queries — up to 20 MB, Salesforce's own log ceiling.",
  },
  {
    question: "Could any of these tools leak my customer data?",
    answer:
      "No — that risk is structurally eliminated. There is no API route and no telemetry endpoint in the codebase, so log content has nowhere to go. You can verify it yourself: open your browser's network tab while using any tool and watch zero requests carry your data.",
  },
];
