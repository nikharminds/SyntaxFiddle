export type ToolStatus = "live" | "beta" | "soon";

export type ToolIcon = "cron" | "csv" | "regex" | "jwt";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ToolStatus;
  icon: ToolIcon;
  keywords: string[];
  featured?: boolean;
  conversions?: { label: string; href: string }[];
};

export const TOOLS: Tool[] = [
  {
    slug: "cron",
    name: "Cron Expression Visualizer",
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
];
