import type { ToolFaq } from "@/components/schema/ToolSchema";

/**
 * Landing-page copy for the SOQL formatter. Kept in lib (like the regex and
 * JWT tools) so prose quality is unit-tested alongside the formatter itself.
 */

export type SoqlSeoSection = { heading: string; body: string[] };

export function buildSoqlSeoSections(): SoqlSeoSection[] {
  return [
    {
      heading: "A parser built for SOQL, not recycled SQL",
      body: [
        "Generic SQL formatters assume ANSI dialects and stumble the moment they meet Salesforce syntax. This tool ships a purpose-built, token-based parser: it lexes your query into keywords, field paths, string literals, date literals, bind variables, and parenthesis structure before applying any layout rules. That distinction matters for correctness — SOQL keywords are case-insensitive but field API names are not, so the formatter uppercases clause keywords (SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT) while leaving field names, aliases, and object names exactly as you typed them. No sql-formatter dependency, no server round trip: the entire grammar, from TYPEOF polymorphic expressions down to USING SCOPE, ships with the page as plain TypeScript.",
      ],
    },
    {
      heading: "Subqueries indent the way Apex developers read them",
      body: [
        "Relationship queries are where SOQL formatting gets hard. Parent-to-child subqueries — (SELECT LastName, Email FROM Contacts) nested inside a SELECT list — and semi-join subqueries inside WHERE Id IN (SELECT AccountId FROM Contact) are detected by tracking parenthesis depth, so each nested query's SELECT, FROM, WHERE, and ORDER BY clauses line up one indentation level deeper than the query that contains them. Comma-separated SELECT lists break onto one field per line once they grow past three fields or past the line-length budget, long WHERE conditions align their AND/OR connectors at a consistent indent, and subqueries nested inside subqueries keep stacking cleanly instead of collapsing into a single unreadable line.",
      ],
    },
    {
      heading: "Custom fields, relationships, and metadata objects stay atomic",
      body: [
        "Salesforce field names carry meaning in their suffixes: AnnualRevenue is standard, Deal_Size__c is a custom field, Account__r.Region__c traverses a relationship, Revenue_Country__mdt is a custom metadata type, and ns__Field__c carries a managed-package namespace. The tokenizer treats every dotted path as one atomic token, so Contact__r.Custom_Field__c is never split at the dot, never re-cased, and never confused with a clause keyword. The same care extends to SOQL literals: datetime values like 2024-01-15T10:30:00Z, date functions like LAST_N_DAYS:90, currency literals like USD5000, and Apex bind variables like :maxRows all survive formatting byte-for-byte.",
      ],
    },
    {
      heading: "WITH SECURITY_ENFORCED and modern clauses are first-class",
      body: [
        "Contemporary SOQL is more than SELECT/FROM/WHERE. The formatter recognizes WITH SECURITY_ENFORCED — plus WITH USER_MODE and WITH SYSTEM_MODE — as dedicated clause lines, understands WITH DATA CATEGORY filters without breaking their internal AND/OR logic, and lays out the full tail of a query: GROUP BY with HAVING, ORDER BY Name DESC NULLS LAST, LIMIT and OFFSET, FOR VIEW, FOR UPDATE, ALL ROWS, and USING SCOPE. Aggregate functions such as COUNT, COUNT_DISTINCT, SUM, toLabel, and convertCurrency get canonical casing while their aliases stay exactly yours.",
      ],
    },
    {
      heading: "Your queries describe your org — so they never leave your browser",
      body: [
        "A pasted SOQL string is a map of your enterprise: object names, custom field names, picklist values, and filter constants together describe your schema and your business. That is why this formatter has no backend that could receive it. The page is statically exported, formatting executes in a Web Worker inside your own tab, and a quick look at the browser network tab confirms that zero requests ever carry your query text. It works on a plane, behind a VPN, or in an air-gapped environment — and because the formatter is total rather than validating, even malformed or half-typed queries are harmlessly re-indented instead of throwing an error.",
      ],
    },
  ];
}

export const SOQL_FAQS: ToolFaq[] = [
  {
    question: "Is my SOQL query uploaded to a server?",
    answer:
      "No. The formatter is compiled into the page itself and executes in a Web Worker inside your browser tab. Open your network panel while typing — no request ever carries your query text. Nothing is transmitted, logged, or stored.",
  },
  {
    question: "Does the formatter execute my query or connect to Salesforce?",
    answer:
      "No. Formatting is purely lexical: it rewrites whitespace, line breaks, and keyword casing only. The tool never calls the Salesforce REST or SOAP APIs, never asks for a login, cannot hit org limits, and will happily format queries for objects that do not exist.",
  },
  {
    question: "How are subqueries and relationship queries formatted?",
    answer:
      "Parent-to-child subqueries in the SELECT list and semi-join subqueries inside WHERE Id IN (SELECT …) are detected through parenthesis tracking, then indented one additional level so each nested SELECT, FROM, and WHERE lines up beneath the query that contains it. Nesting stacks cleanly at any depth.",
  },
  {
    question: "Will it change my custom field names or Apex bind variables?",
    answer:
      "No. Clause keywords such as SELECT and WITH SECURITY_ENFORCED are uppercased, but field paths (Deal_Size__c, Account__r.Region__c, Revenue_Country__mdt), aggregate aliases, and Apex bind variables like :maxRows keep their exact casing and are never split at dots.",
  },
  {
    question: "Which SOQL features does the formatter understand?",
    answer:
      "TYPEOF polymorphic expressions, WITH SECURITY_ENFORCED / USER_MODE / SYSTEM_MODE, WITH DATA CATEGORY, GROUP BY with HAVING, ORDER BY … NULLS FIRST/LAST, LIMIT and OFFSET, FOR VIEW / FOR UPDATE, ALL ROWS, USING SCOPE, date literals like LAST_N_DAYS:90, currency literals like USD5000, and Apex bind variables.",
  },
  {
    question: "Can I use the SOQL formatter offline?",
    answer:
      "Yes. This page is a static export with no runtime backend. Once it has loaded, you can disconnect the network and formatting keeps working — including copy and download of the formatted output.",
  },
];

export const SOQL_FEATURE_LIST: string[] = [
  "Token-based SOQL parser — no generic SQL formatter",
  "Parent-to-child and semi-join subquery indentation",
  "__c / __r / __mdt field paths preserved atomically",
  "WITH SECURITY_ENFORCED, TYPEOF, GROUP BY & HAVING aware",
  "Formats in a background Web Worker — the UI never freezes",
  "100% offline: zero uploads and zero network calls",
];
