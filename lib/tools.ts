export type ToolStatus = "live" | "beta" | "soon";

export type ToolIcon = "cron" | "csv" | "regex" | "jwt" | "curl" | "database";

export type Tool = {
  slug: string;
  href?: string;
  name: string;
  tagline: string;
  description: string;
  status: ToolStatus;
  icon: ToolIcon;
  keywords: string[];
  featured?: boolean;
  badges?: string[];
  conversions?: { label: string; href: string }[];
};

export const TOOLS: Tool[] = [
  {
    slug: "cron",
    name: "Cron Tester & Generator",
    tagline: "Parse, explain, and simulate cron schedules in plain English.",
    description:
      "An interactive playground for cron expressions with support for Unix, Quartz, AWS EventBridge, and Cloudflare dialects, human-readable explanations, and next-run previews.",
    status: "live",
    icon: "cron",
    featured: true,
    keywords: [
      "cron",
      "crontab",
      "schedule",
      "scheduler",
      "expression",
      "quartz",
      "eventbridge",
      "cloudflare",
      "unix",
      "linux",
      "timer",
      "job",
    ],
  },
  {
    slug: "csv",
    name: "CSV & Excel Converter",
    tagline: "Convert CSV and Excel to SQL, JSON, SOQL, and XML.",
    description:
      "Paste a spreadsheet or drop a workbook and export typed SQL INSERT statements, clean JSON, Salesforce SOQL IN clauses, or XML documents, with delimiter sniffing and column type inference.",
    status: "live",
    icon: "csv",
    conversions: [
      { label: "CSV to JSON", href: "/csv-to-json/" },
      { label: "CSV to SQL", href: "/csv-to-sql/" },
      { label: "Excel to SQL", href: "/excel-to-sql/" },
      { label: "Excel to JSON", href: "/excel-to-json/" },
      { label: "CSV to SOQL", href: "/csv-to-soql/" },
      { label: "CSV to XML", href: "/csv-to-xml/" },
      { label: "Excel to XML", href: "/excel-to-xml/" },
      { label: "Excel to SOQL", href: "/excel-to-soql/" },
    ],
    keywords: [
      "csv",
      "excel",
      "xlsx",
      "tsv",
      "spreadsheet",
      "sql",
      "insert",
      "json",
      "xml",
      "soql",
      "salesforce",
      "convert",
      "converter",
      "import",
      "export",
      "data",
    ],
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    tagline: "Test regular expressions with live match highlighting.",
    description:
      "Evaluate patterns against sample text with capture groups, flags, and real-time match highlighting — executed in a sandboxed Web Worker with ReDoS protection.",
    status: "live",
    icon: "regex",
    keywords: ["regex", "regexp", "regular expression", "pattern", "match", "test", "capture group"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    tagline: "Inspect header, payload, and claims of JWT tokens.",
    description:
      "Decode and inspect JSON Web Tokens locally — color-coded segments, syntax-highlighted claims, and expiry checks. Decode-only, zero network calls.",
    status: "live",
    icon: "jwt",
    keywords: ["jwt", "json web token", "decode", "inspect", "claims", "auth", "bearer"],
  },
  {
    slug: "curl-converter",
    name: "cURL Converter",
    tagline: "Convert cURL commands to fetch, axios, Python, Apex, and more.",
    description:
      "Paste a cURL command and transpile it to idiomatic code in eight targets — JavaScript fetch(), axios, Python requests, PHP Guzzle, Go net/http, C# HttpClient, Java OkHttp, or Salesforce Apex HttpRequest. Headers, JSON bodies, basic auth, and query strings included. 100% client-side, zero uploads.",
    status: "live",
    icon: "curl",
    conversions: [
      { label: "cURL to Fetch", href: "/curl-to-fetch/" },
      { label: "cURL to Axios", href: "/curl-to-axios/" },
      { label: "cURL to Python", href: "/curl-to-python/" },
      { label: "cURL to PHP", href: "/curl-to-php/" },
      { label: "cURL to Go", href: "/curl-to-go/" },
      { label: "cURL to C#", href: "/curl-to-csharp/" },
      { label: "cURL to Java", href: "/curl-to-java/" },
      { label: "cURL to Apex", href: "/curl-to-apex/" },
    ],
    keywords: [
      "curl",
      "curl converter",
      "curl to fetch",
      "curl to axios",
      "curl to python",
      "curl to php",
      "curl to guzzle",
      "curl to go",
      "curl to golang",
      "curl to csharp",
      "curl to java",
      "curl to okhttp",
      "curl to apex",
      "curl to salesforce apex",
      "curl to requests",
      "curl to javascript",
      "transpile",
      "http client",
      "api testing",
    ],
  },
  {
    slug: "json-to-schema",
    href: "/json-to-schema/",
    name: "JSON to Schema Converter",
    tagline: "Infer types from raw JSON — Zod, TypeScript, Pydantic & Go.",
    description:
      "Instantly infer types from raw JSON. 100% offline execution ensures customer PII never leaves your browser.",
    status: "live",
    icon: "database",
    badges: ["TypeScript", "Zod", "Pydantic", "Go"],
    keywords: [
      "json to schema",
      "json to zod",
      "json to typescript",
      "json to pydantic",
      "json to go struct",
      "json to interface",
      "schema generator",
      "type inference",
      "json validator generator",
    ],
  },
];
