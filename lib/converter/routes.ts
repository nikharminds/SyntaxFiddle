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
};

const TARGET_META: Record<
  TargetFormat,
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
    titleName: "SQL",
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

const SOURCE_META: Record<SourceFormat, { label: string; noun: string }> = {
  csv: {
    label: "CSV",
    noun: "comma, semicolon, tab, or pipe-delimited text",
  },
  excel: {
    label: "Excel",
    noun: ".xlsx or .xls workbooks",
  },
};

function buildPair(source: SourceFormat, target: TargetFormat): ConversionPair {
  const sourceMeta = SOURCE_META[source];
  const targetMeta = TARGET_META[target];
  const title = `${sourceMeta.label} to ${targetMeta.titleName} Converter`;
  return {
    slug: `${source}-to-${target === "soql-in" ? "soql" : target}`,
    source,
    target,
    sourceLabel: sourceMeta.label,
    targetLabel: targetMeta.label,
    title,
    heading: `${title} — Online & Private`,
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
          "The studio converts CSV or Excel into four targets — SQL INSERT statements, JSON, Salesforce SOQL IN clauses, and XML — eight dedicated converters in total. Each has its own pre-configured page, and the full studio at /csv/ lets you switch formats without losing your input.",
      },
    ],
  };
}

export const CONVERSION_PAIRS: ConversionPair[] = (
  ["csv", "excel"] as SourceFormat[]
).flatMap((source) =>
  (["json", "sql", "soql-in", "xml"] as TargetFormat[]).map((target) =>
    buildPair(source, target),
  ),
);

export function getConversionPair(slug: string): ConversionPair | undefined {
  return CONVERSION_PAIRS.find((pair) => pair.slug === slug);
}

export function relatedConversionPairs(pair: ConversionPair): ConversionPair[] {
  return CONVERSION_PAIRS.filter((candidate) => candidate.slug !== pair.slug);
}

export const POPULAR_CONVERSION_SLUGS = [
  "csv-to-json",
  "csv-to-sql",
  "excel-to-sql",
  "csv-to-xml",
];
