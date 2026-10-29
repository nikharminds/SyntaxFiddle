import type { SchemaTarget } from "./index";

export type JsonSchemaSeoFactIcon = "lock" | "zap" | "terminal" | "shield" | "code";

export type JsonSchemaSeoFact = {
  icon: JsonSchemaSeoFactIcon;
  title: string;
  description: string;
};

export type JsonSchemaSeoSection = {
  heading: string;
  body: string[];
};

export type JsonSchemaSeoFaq = {
  question: string;
  answer: string;
};

export type JsonSchemaSeoTarget = {
  slug: string;
  target: SchemaTarget;
  title: string;
  heading: string;
  description: string;
  heroDescription: string;
  keywords: string[];
  featureList: string[];
  facts: JsonSchemaSeoFact[];
  sections: JsonSchemaSeoSection[];
  faqs: JsonSchemaSeoFaq[];
};

const PRIVACY_FACT: JsonSchemaSeoFact = {
  icon: "lock",
  title: "Zero upload, ever",
  description:
    "Inference and code generation run in a Web Worker inside your browser — payloads with PII never touch a server.",
};

const SPEED_FACT: JsonSchemaSeoFact = {
  icon: "zap",
  title: "Live 300 ms conversion",
  description:
    "Output updates as you type, with mixed-array unions, merged objects, and ISO-8601 dates inferred automatically.",
};

export const JSON_SCHEMA_SEO_TARGETS: JsonSchemaSeoTarget[] = [
  {
    slug: "json-to-typescript",
    target: "ts",
    title: "JSON to TypeScript Interface Converter (Zero-Upload)",
    heading: "JSON to TypeScript Interface Converter — Zero-Upload",
    description:
      "Paste JSON and get clean TypeScript interfaces instantly: nested types, union arrays, optional fields, and keys exactly as they appear on the wire. Runs entirely in your browser — no uploads.",
    heroDescription:
      "Turn any JSON payload into strict-mode TypeScript: every nested object becomes a named interface, [1, \"a\"] becomes (number | string)[], missing keys in arrays of objects become optional properties, and keys are kept verbatim (\"client-name\": string) so the types match res.json() exactly — with an opt-in camelCase mode that emits a KeyMap const. The generator runs in a Web Worker in your browser — your data never leaves the tab.",
    keywords: [
      "json to typescript",
      "json to interface",
      "json to typescript interface",
      "typescript interface generator from json",
      "json to types converter",
      "json to typescript online",
      "generate types from json",
      "json to types offline",
    ],
    featureList: [
      "Emits export interface definitions for every nested object, named after their path",
      "Mixed arrays become union types and partial objects infer optional (?) properties",
      "Keys preserved verbatim by default; opt-in camelCase renaming with a KeyMap for hydration",
      "Whole numbers stay integers and empty arrays infer unknown[] instead of guessing",
      "Zero-upload conversion in a Web Worker — PII never leaves your browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Strict-mode clean",
        description:
          "Output compiles under strict tsc with no any — unions, unknown, and null handled explicitly.",
      },
    ],
    sections: [
      {
        heading: "From JSON values to strict TypeScript types",
        body: [
          "Every nested object in your payload becomes its own exported interface, named by its position in the tree — a friends array inside UserProfile yields UserProfileFriendsItem — so deeply nested documents stay readable instead of collapsing into one giant inline literal. Arrays fold their elements together: [1, \"a\"] becomes (number | string)[], and arrays of arrays merge element-wise. Identical shapes are deduplicated into a single interface and referenced by name.",
          "Optionality is inferred from evidence, not guesses. When an array of objects contains records with different keys, any key missing from at least one element is emitted with a ? — the exact contract a paginated API actually serves. Empty arrays infer unknown[] because an empty sample proves nothing, and null stays null rather than silently becoming undefined.",
        ],
      },
      {
        heading: "Wire-format keys by default, camelCase when you ask for it",
        body: [
          "Keys are emitted exactly as they appear in your payload by default: \"client-name\": string, created_at: string. That is deliberate — res.json() returns the original keys at runtime, so a variable typed as Root matches the parsed object property-for-property and r.clientName-style bugs cannot compile in the first place. Keys that are not valid identifiers are simply quoted, which TypeScript fully supports.",
          "When you want idiomatic camelCase instead, flip the toggle: keys are renamed to camelCase in the interfaces and the generator emits an adjacent KeyMap const (export const UserProfileKeyMap = { userName: \"user_name\" } as const) recording every rename for your hydration boundary. ISO-8601 strings stay string in the TypeScript output either way — which is what JSON.parse actually produces — while the Zod target of the same tool coerces them to Date.",
        ],
      },
      {
        heading: "Why offline conversion matters for JSON with user data",
        body: [
          "The payloads developers paste into interface generators are usually real: production API responses, CRM exports, analytics events. They carry names, email addresses, phone numbers, and internal IDs — personally identifiable information that privacy laws and most employer security policies prohibit sharing with third parties. A server-side converter means that data leaves your machine, and you are trusting an unknown operator's retention policy and log hygiene with a potential data breach.",
          "This page is a static export: the type engine is pure TypeScript running in a Web Worker inside your browser, with a watchdog that aborts runaway conversions after three seconds. No fetch calls, no telemetry on your payload, no storage. That makes it safe for production data on corporate machines, and it works fully offline once the page is cached — convenient for restricted networks and air-gapped environments.",
        ],
      },
      {
        heading: "Using the generated interfaces",
        body: [
          "The output is plain declaration-only TypeScript that compiles under strict mode with noUncheckedIndexedAccess — paste it next to your API client and annotate fetch responses with it. Interfaces are emitted children-first, so the file reads bottom-up from leaf shapes to the root type, and a root that is not an object gets an export type alias instead (export type Root = (number | string)[]).",
          "For runtime validation, pair the interfaces with the Zod output from the same tool: the schema validates the raw JSON keys and its inferred type matches these interfaces (both preserve the wire keys by default; both rename to camelCase when the toggle is on). Together they give you a compile-time contract and a runtime guard from a single paste.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is my JSON sent to a server during conversion?",
        answer:
          "No. The interface generator runs entirely in your browser inside a Web Worker — there is no backend API. Payloads with emails, names, or other PII are never transmitted, stored, or logged.",
      },
      {
        question: "How does it handle arrays where objects have different keys?",
        answer:
          "Object schemas across an array are merged: keys present in every element become required, and keys missing from at least one element become optional with a ? modifier. That mirrors what real APIs return across pages and partial updates.",
      },
      {
        question: "What do mixed arrays like [1, \"a\", null] become?",
        answer:
          "They become union types: (number | string | null)[]. The generator folds every element into a deduplicated union instead of collapsing to any, so your types stay strict.",
      },
      {
        question: "Why are my keys not renamed to camelCase?",
        answer:
          "Because res.json() returns the original keys at runtime — a type that renames them compiles but lies. Keys are therefore preserved verbatim by default (quoted when they are not valid identifiers). If you prefer camelCase, toggle it on and the generator renames keys and emits a KeyMap const recording the original spelling for each renamed property, for use at your hydration boundary.",
      },
      {
        question: "Does it work with huge JSON files?",
        answer:
          "Yes — parsing runs off the main thread and a watchdog aborts anything over three seconds with a clean error, so a pathological paste cannot freeze the tab. Sensible payloads convert in single-digit milliseconds.",
      },
      {
        question: "Can I use the interfaces commercially?",
        answer:
          "Yes — the generated TypeScript is yours with no attribution required. It is plain declaration code that compiles with the standard tsc compiler and no dependencies.",
      },
    ],
  },
  {
    slug: "json-to-go-struct",
    target: "go",
    title: "JSON to Go Struct Converter | SyntaxFiddle",
    heading: "JSON to Go Struct Converter — Client-Side & Private",
    description:
      "Paste JSON and generate Go structs with json tags instantly: nested types, pointers for nullable fields, time.Time for ISO dates. 100% client-side — nothing is uploaded.",
    heroDescription:
      "Turn any JSON payload into encoding/json-ready Go structs: every field carries its original key as a json tag, snake_case keys become exported PascalCase names, nullable unions become pointers, and ISO-8601 strings map to time.Time. The generator runs in a Web Worker in your browser — zero upload, zero logging.",
    keywords: [
      "json to go",
      "json to go struct",
      "json to golang struct",
      "go struct generator from json",
      "json to struct online",
      "json to golang converter",
      "generate go structs from json",
      "json to go offline",
    ],
    featureList: [
      "Emits nested Go struct types with aligned json tags preserving original keys",
      "Whole numbers infer int64; mixed int/float samples widen to float64",
      "snake_case and kebab-case keys converted to exported PascalCase field names",
      "Nullable fields map to pointers (*T) and optional fields get omitempty tags",
      "ISO-8601 strings detected and typed as time.Time with the import block included",
      "Client-side conversion in a Web Worker — payloads with PII never leave the browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "gofmt-shaped output",
        description:
          "Tab-indented structs with column-aligned tags that drop straight into any package.",
      },
    ],
    sections: [
      {
        heading: "From JSON to encoding/json-ready structs",
        body: [
          "Every nested object becomes its own named struct type, emitted children-first, with each field exported in PascalCase and carrying a json:\"original_key\" tag that preserves the exact key from your payload — snake_case, kebab-case, or anything else survives the round trip through encoding/json unchanged. Mixed arrays such as [1, \"a\"] map to []any because Go has no unions, while a nullable whole-number value ([1, null]) becomes *int64 so the zero value stays distinguishable from absence.",
          "Optionality is inferred from evidence: a key that is missing from at least one object in an array becomes a pointer with an omitempty tag, letting json.Unmarshal and Marshal round-trip partial API responses faithfully. Empty arrays become []any rather than guessing a wrong concrete element type, and struct fields are column-aligned the way gofmt leaves them.",
        ],
      },
      {
        heading: "Type mapping details worth knowing",
        body: [
          "JSON numbers are typed by evidence. When every sample of a field is whole — the signature of IDs, counts, and quantities — the field is emitted as int64, because float64 silently loses precision on integers past 2^53 and encoding/json decodes straight into either. A single fractional sample widens the field to float64. Strings matching ISO 8601, including date-only values and timestamps with timezone offsets, map to time.Time with the import \"time\" block added automatically and only when needed. Booleans map to bool, null-only fields to any, and a root value that is not an object becomes a type alias (type Root = []string).",
          "Field names are derived by splitting keys on separators and camelCase boundaries, so created_at becomes CreatedAt and userID keeps its acronym as UserID — exported, collision-free, and never shadowing Go's keywords. Struct names follow the same rule down the nesting path, keeping deep documents readable and greppable.",
        ],
      },
      {
        heading: "Why offline conversion matters for JSON with user data",
        body: [
          "Go developers converting JSON to structs are usually integrating a real third-party API or internal service — and the example payloads are production captures full of names, emails, addresses, and session tokens. That is personally identifiable information that privacy regulations and corporate security policies prohibit sharing with arbitrary third parties, which is exactly what a server-backed online converter asks you to do: upload your users' data to an unknown server with unknown logs and retention.",
          "This page is a static export with no backend of any kind. The struct generator is pure TypeScript running in a Web Worker inside your browser tab — parsing never touches the network, and a watchdog terminates any conversion that exceeds three seconds so oversized pastes cannot freeze the UI. It works offline once loaded, making it safe for production payloads on corporate machines and in air-gapped environments.",
        ],
      },
      {
        heading: "Using the generated structs",
        body: [
          "Drop the output into a .go file (it arrives with a package declaration) and unmarshal with json.Unmarshal(body, &root) — field names, tags, pointers, and time.Time values align with what encoding/json expects, so no post-processing is needed. Nullable pointers marshal back as null rather than zero values, and omitempty fields drop cleanly when absent.",
          "Integer evidence means ID fields arrive as int64 ready to use — no manual float64-to-int64 surgery on large identifiers. Fields your samples show as fractional come out float64, and since the json tags already carry the correct keys, changing any field's type later is a one-line edit. For API clients beyond encoding/json, the same struct shapes transfer to jsoncodegen tools or generated OpenAPI types unchanged.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is my JSON uploaded when converting to Go structs?",
        answer:
          "No. The page is static and the generator runs locally in a Web Worker — payloads containing emails, names, or auth tokens are never transmitted, stored, or logged by any server.",
      },
      {
        question: "Are the original JSON keys preserved in the struct tags?",
        answer:
          "Yes. Every field carries a json:\"...\" tag with the exact key from your payload, so snake_case, kebab-case, or otherwise unusual keys round-trip through encoding/json exactly as they arrived.",
      },
      {
        question: "Why do some fields become pointers?",
        answer:
          "Fields that are null somewhere in the sample, or missing from some objects in an array, become pointers (*T) — often with omitempty — so you can distinguish a zero value from an absent one when unmarshalling partial API responses.",
      },
      {
        question: "How are ISO-8601 date strings typed?",
        answer:
          "They map to time.Time, and the import \"time\" block is added automatically. encoding/json parses RFC 3339 timestamps straight into time.Time values, which ISO 8601 with timezone offsets satisfies.",
      },
      {
        question: "Why does a mixed array like [1, \"a\"] become []any?",
        answer:
          "Go has no union types, so any is the honest representation. A nullable whole-number array ([1, null]) is more specific and becomes []*int64, keeping nil-able elements round-trippable.",
      },
      {
        question: "Can I convert a JSON array at the root?",
        answer:
          "Yes. A root array of objects generates the item struct plus a type alias (type Root = []RootItem), so you can unmarshal directly into a slice while keeping the item type exported and reusable.",
      },
    ],
  },
];

export function getJsonSchemaSeoTarget(
  slug: string,
): JsonSchemaSeoTarget | undefined {
  return JSON_SCHEMA_SEO_TARGETS.find((target) => target.slug === slug);
}

export const JSON_SCHEMA_TARGET_SLUGS: string[] = JSON_SCHEMA_SEO_TARGETS.map(
  (target) => target.slug,
);
