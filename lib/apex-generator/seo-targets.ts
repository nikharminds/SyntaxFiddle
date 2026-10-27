import type { ApexPreset } from "./index";

export type ApexSeoFactIcon = "lock" | "zap" | "terminal" | "shield" | "code";

export interface ApexSeoFact {
  icon: ApexSeoFactIcon;
  title: string;
  description: string;
}

export interface ApexSeoSection {
  heading: string;
  body: string[];
}

export interface ApexSeoFaq {
  question: string;
  answer: string;
}

export interface ApexRelatedLink {
  label: string;
  href: string;
}

export interface ApexSeoTarget {
  slug: string;
  preset: ApexPreset;
  badge: string;
  title: string;
  heading: string;
  description: string;
  heroDescription: string;
  keywords: string[];
  featureList: string[];
  facts: ApexSeoFact[];
  sections: ApexSeoSection[];
  faqs: ApexSeoFaq[];
  relatedLinks: ApexRelatedLink[];
}

/**
 * One authoritative page for every "JSON to Apex" search intent. The LWC
 * (cacheable parse) and wrapper (callout helper) variants are output modes
 * of the same generator — shipped as on-page toggles and covered by
 * dedicated sections/FAQs here. The former variant URLs 301 here via
 * public/_redirects (Cloudflare Pages).
 */
export const APEX_SEO_TARGETS: ApexSeoTarget[] = [
  {
    slug: "json-to-apex",
    preset: "hub",
    badge: "Typed Apex Output",
    title: "JSON to Apex Class Generator — Free & Client-Side | SyntaxFiddle",
    heading: "JSON to Apex Class Generator",
    description:
      "Generate a Salesforce Apex class from JSON — inner classes, parse() via JSON.deserialize, @AuraEnabled for LWC, and callout helpers. Free, 100% client-side.",
    heroDescription:
      "Paste any JSON payload — a SOQL query result, a REST response, a webhook event — and get a complete Apex wrapper class: inner classes for every nested object, List<> members for arrays, a static parse() built on JSON.deserialize, and a serialize() helper for the way back. Flip one toggle for LWC and parse() ships as @AuraEnabled(cacheable=true), callable straight from @wire; flip another and the class gains a fromHttpResponse() helper that parses callout bodies in one line. Reserved words are mangled safely, original key casing is preserved for lossless round-trips, and every byte is generated locally in your browser.",
    keywords: [
      "json to apex",
      "json to apex class",
      "json to apex class generator",
      "json to apex converter",
      "json2apex",
      "salesforce json to apex",
      "convert json to apex",
      "generate apex class from json",
      "apex class from json",
      "json.deserialize apex",
      "apex wrapper class generator",
      "json to apex lwc",
      "aura enabled apex class generator",
      "apex callout json",
      "apex rest callout deserialize",
      "parse json in apex",
      "apex object",
      "json to sobject",
      "json to apex online",
      "apex serialize json",
    ],
    featureList: [
      "Generates a complete Apex wrapper class with nested inner classes from any JSON",
      "Static parse(String) helper built on JSON.deserialize — including List<T>.class for root arrays",
      "LWC mode: parse() ships as @AuraEnabled(cacheable=true), callable from @wire",
      "Callout mode: static fromHttpResponse(HttpResponse) parses callout bodies in one line",
      "Optional @AuraEnabled members and serialize() helper, toggled with one click",
      "Reserved-word mangling (class, trigger, group…) and case-insensitive collision safety",
      "Original JSON key casing preserved so parse() → serialize() round-trips losslessly",
    ],
    facts: [
      {
        icon: "lock",
        title: "Zero upload, ever",
        description:
          "Parsing and Apex generation run in your browser — API responses, tokens, and customer data never touch a server.",
      },
      {
        icon: "zap",
        title: "Live generation as you type",
        description:
          "Inner classes, parse(), and serialize() regenerate on every keystroke, with one-press copy and .cls download.",
      },
      {
        icon: "terminal",
        title: "Honest type mapping",
        description:
          "Numbers become Decimal, ISO 8601 strings become DateTime, nulls fold into String — types that deserialize without surprises.",
      },
    ],
    sections: [
      {
        heading: "From raw JSON to typed Apex in one paste",
        body: [
          "This generator creates Apex classes from JSON with the same inference engine that powers the site's Zod, TypeScript, Pydantic, and Go schema generators, then emits one outer class containing an inner class for every nested object — a typed Apex object for every shape the payload contains. Arrays of objects become List<Member> where Member is generated too; arrays of scalars become List<String> or List<Decimal>; empty arrays fall back to List<Object> because there is nothing to infer from.",
          "Everything is deterministic: the same JSON and the same options always produce byte-identical Apex. That matters when the generated class is checked into a repository, reviewed in a pull request, or diffed after an API change adds a field.",
        ],
      },
      {
        heading: "Typed deserialization with JSON.deserialize",
        body: [
          "The generated static parse(String) helper is a one-liner wrapper around JSON.deserialize(json, ClassName.class) — the compiler-checked way to parse JSON in Apex. Compared with JSON.deserializeUntyped and its endless Map<String, Object> casts, this deserialization approach gives you a typed Apex object with autocompletion, refactoring safety, and a single place to change when the upstream API evolves.",
          "Apex matches JSON keys to class members case-insensitively during deserialization, so the class works even though the generator preserves your original key casing. That preservation is deliberate: when you call serialize(), the JSON that comes back keeps the exact keys the upstream API sent, making parse() → serialize() round-trips lossless.",
        ],
      },
      {
        heading: "LWC mode: a parse() that @wire can call",
        body: [
          "Lightning Web Components can only reach Apex methods marked @AuraEnabled — and @wire can only cache methods marked cacheable. Flip the cacheable toggle and parse() is emitted as @AuraEnabled(cacheable=true): import it in your component with import parse from '@salesforce/apex/ClassName.parse', bind it through @wire, and the typed response arrives in JavaScript with every nested inner class intact — no JSON.deserializeUntyped casting and no double serialization.",
          "One Apex rule to remember: callout-backed methods cannot be cacheable. The generated cacheable parse() is ideal for data you already hold; for HTTP-backed flows, call imperatively or split into a queueable fetch plus a cacheable reader.",
        ],
      },
      {
        heading: "Callout mode: fromHttpResponse() in one line",
        body: [
          "Salesforce integrations live on wrapper classes: a typed class a callout response deserializes into, and a request body serializes out of. Flip the callout toggle and the class gains a static fromHttpResponse(HttpResponse) helper, so the consume side of an integration is one line — CalloutWrapper.fromHttpResponse(httpResponse) — instead of a hand-written parse(getBody()) dance. For the outbound direction, populate the wrapper and send wrapper.serialize() as the request body.",
          "Writing these wrappers by hand is mechanical and error-prone — a missed field deserializes to null silently, and a mistyped one throws at runtime in production. Paste a sample response from the API's docs, a Postman run, or a debug log, and every field the payload actually contains gets a home; regenerate when the API changes and diff the class to review exactly what moved.",
        ],
      },
      {
        heading: "Numbers, dates, and nulls mapped honestly",
        body: [
          "JSON numbers become Decimal — the only Apex numeric type that round-trips every JSON number safely. Integer looks natural until the API sends 1.0 and the deserializer throws; Double loses decimal precision on money values; Decimal accepts integers, decimals, and scientific notation without complaint. For a generator that must handle arbitrary payloads, Decimal is the honest choice.",
          "Strings that match ISO 8601 — 2026-10-27T09:15:00Z or 2026-12-31 — become DateTime, because Apex parses ISO 8601 natively during deserialization. null values fold into String members: Apex reference types are null by default, so no information is lost and no member is unusable.",
        ],
      },
      {
        heading: "Reserved words, collisions, and compile-first-time output",
        body: [
          "Salesforce field names love Apex keywords: a payload with class, trigger, group, or select would not compile if pasted verbatim into member declarations. The generator detects every Apex reserved word and renames the member deterministically with an X suffix — class becomes ClassX — while legal member names like url or Date are preserved exactly so the JSON key keeps deserializing.",
          "Keys that collide after sanitization get numeric suffixes instead of silently overwriting each other, the same guard runs on inner-class names, and collision detection is case-insensitive because Apex identifiers are. The class you copy from this tool compiles first time, every time.",
        ],
      },
      {
        heading: "Why client-side matters for API payloads",
        body: [
          "Real JSON payloads carry customer records, opportunity amounts, session tokens, and PII. Uploading those to a generation API means trusting a third party with production data — and Salesforce security review teams ask exactly that question about callout tooling. This page ships as pre-rendered HTML plus a static JavaScript bundle; the generator itself is pure TypeScript with no network calls.",
          "Because everything is static, the tool also works offline once the page has loaded — convenient for locked-down corporate machines, air-gapped orgs, and quick conversions from a train. Nothing you paste is transmitted, stored, or logged, because there is no server to do the storing.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is this JSON to Apex class generator really free and private?",
        answer:
          "Yes. This JSON to Apex converter runs entirely in your browser as a static page — there is no backend API that receives your JSON. It is free to use with no sign-up, no rate limits, and no logging of any kind.",
      },
      {
        question: "How do I use the generated Apex class?",
        answer:
          "Copy the class into a .cls file in your org (Developer Console, VS Code with the Salesforce Extensions, or your CI setup). Then call ClassName.parse(json) wherever you would have called JSON.deserializeUntyped — after an HTTP callout (or ClassName.fromHttpResponse(response) with the callout toggle on), inside an @AuraEnabled controller method, or when processing a webhook payload.",
      },
      {
        question: "How do I make parse() callable from @wire in an LWC?",
        answer:
          "Flip the cacheable toggle: parse() is emitted as @AuraEnabled(cacheable=true), which is what @wire requires. Import it in your component — import parse from '@salesforce/apex/MyClass.parse' — and bind it with @wire. Remember that callout-backed methods cannot be cacheable; call those imperatively instead.",
      },
      {
        question: "Why are all numbers mapped to Decimal?",
        answer:
          "Decimal is the only Apex numeric type that safely accepts every JSON number: Integer fails on values like 1.0, and Double loses precision on decimal-heavy money values. JSON.deserialize maps JSON numbers into Decimal without conversion errors, so the generated class compiles and runs against any payload. You can change Decimal to Integer by hand once you know a field is always integral.",
      },
      {
        question: "Does the tool handle REST callout responses?",
        answer:
          "Yes — flip the callout toggle and the class ships a static fromHttpResponse(HttpResponse) helper, so consuming a callout is one line: CalloutWrapper.fromHttpResponse(httpResponse). Round-trip integrations also get serialize(): populate the wrapper and send wrapper.serialize() as the outbound request body.",
      },
      {
        question: "Does serialize() produce the same JSON I pasted?",
        answer:
          "Yes for structure and keys: the generator preserves original key casing, so parse() followed by serialize() reproduces your payload's field names exactly. Formatting (whitespace) is normalized by Apex's serializer, and field order follows the class declaration order.",
      },
      {
        question: "Can the class handle a root-level JSON array?",
        answer:
          "Yes. For an array of objects, the generated class describes one element and parse() returns List<ClassName> using List<ClassName>.class — the standard Apex pattern for typed collection deserialization. The callout helper returns the same list type.",
      },
      {
        question: "What happens to JSON fields named class, trigger, or other reserved words?",
        answer:
          "Reserved Apex keywords are detected and renamed deterministically with an X suffix — class becomes ClassX — so the generated class always compiles. Original keys that are already valid, unreserved identifiers (including url, Date, and Test) are kept exactly as they appear in the JSON, so deserialization keeps working.",
      },
      {
        question: "Can I convert JSON directly into an SObject?",
        answer:
          "Not directly — Apex's JSON.deserialize cannot produce sObjects from arbitrary payloads, and hand-rolling that mapping is where type mismatches slip in. The recommended pattern is what this generator produces: deserialize into a typed wrapper class first, then map the wrapper's fields onto the sObject in a few explicit lines (or use JSON.deserializeUntyped when field names are truly dynamic). The wrapper keeps the JSON parsing honest; the mapping stays visible and reviewable.",
      },
      {
        question: "Is there a size or complexity limit?",
        answer:
          "Generation is guarded by a 3-second watchdog and a 32-level nesting limit to keep the browser tab responsive. In practice, typical API responses — even SOQL results with hundreds of fields across nested objects — generate in a few milliseconds.",
      },
    ],
    relatedLinks: [
      { label: "SOQL Formatter", href: "/soql-formatter/" },
      { label: "cURL to Salesforce Apex", href: "/tools/curl-to-salesforce-apex/" },
      { label: "CSV to SOQL IN Clauses", href: "/csv-to-soql/" },
      { label: "Excel to SOQL IN Clauses", href: "/excel-to-soql/" },
      { label: "JSON to TypeScript & Zod", href: "/json-to-schema/" },
      { label: "All Developer Tools", href: "/tools/" },
    ],
  },
];

export function getApexSeoTarget(slug: string): ApexSeoTarget | undefined {
  return APEX_SEO_TARGETS.find((target) => target.slug === slug);
}
