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
    slug: "json-to-zod",
    target: "zod",
    title: "JSON to Zod Schema Generator (Secure & Offline) | SyntaxFiddle",
    heading: "JSON to Zod Schema Generator — Secure & Offline",
    description:
      "Paste JSON and instantly generate a Zod schema: nested objects, mixed-array unions, optional fields, and ISO dates as z.coerce.date(). 100% client-side — payloads never leave your browser.",
    heroDescription:
      "Paste any JSON payload and get a production-ready Zod schema: z.object trees with optional fields inferred from partial arrays, [1, \"a\"] merged into z.union([...]), ISO-8601 strings mapped to z.coerce.date(), and snake_case keys transformed to camelCase after validation. The whole pipeline runs in a Web Worker in your browser.",
    keywords: [
      "json to zod",
      "json to zod schema",
      "zod schema generator",
      "json to zod converter",
      "generate zod schema from json",
      "zod schema from json online",
      "json to zod offline",
      "zod validator generator",
    ],
    featureList: [
      "Generates a complete z.object schema tree from any JSON payload",
      "Mixed arrays become z.union types and partial objects infer .optional() fields",
      "ISO-8601 strings detected and emitted as z.coerce.date()",
      "Validates raw snake_case or kebab-case keys, then transforms them to camelCase",
      "100% client-side generation in a Web Worker — payloads with PII are never uploaded",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Runtime-accurate output",
        description:
          "The schema validates your raw JSON as it arrives, then remaps keys — no hand-editing required.",
      },
    ],
    sections: [
      {
        heading: "How the Zod schema is inferred",
        body: [
          "The generator walks your JSON recursively and emits a matching z.object tree: strings become z.string(), numbers z.number(), booleans z.boolean(), and null z.null(). Arrays are folded element by element, so [1, \"a\"] becomes z.union([z.number(), z.string()]) rather than a lossy unknown, and nested arrays merge the same way. When an array of objects has inconsistent keys — a real-world API page where some records carry optional fields — the schemas are merged and every key missing from at least one element comes out as .optional().",
          "Dates get first-class treatment: any string matching ISO 8601 (date-only or full timestamp with timezone) is emitted as z.coerce.date(), which parses the string into a real JavaScript Date at validation time. Empty arrays become z.array(z.unknown()) because an empty sample proves nothing, and a watchdog terminates runaway conversions after three seconds so a multi-megabyte paste can never freeze the tab.",
        ],
      },
      {
        heading: "Key renaming without losing raw-key validation",
        body: [
          "JSON payloads from Python backends arrive in snake_case; REST APIs built on older frameworks often use kebab-case. The generated schema keeps the original key inside z.object — so it validates the JSON exactly as it arrives — and chains a .transform((v) => ({...})) that renames user_name to userName on the parsed output. You get camelCase TypeScript types out of the box while still accepting the wire format verbatim.",
          "Because the transform runs after parsing, the output type is clean and predictable: fields that were optional in the union keep their undefined, and ISO date strings arrive as Date objects. Drop the exported schema straight into a form library, an API boundary, or an env-var validator without renaming keys by hand.",
        ],
      },
      {
        heading: "Why offline conversion matters for JSON with user data",
        body: [
          "The JSON developers reach for when testing validators is rarely synthetic — it is a real API response, a production webhook, or an export from a customer database. Those payloads routinely contain names, email addresses, phone numbers, and tokens: personally identifiable information that GDPR, HIPAA, and most internal security policies forbid shipping to third parties. Pasting that into a server-backed \"free online converter\" means uploading your users' data to an unknown server with unknown retention and logging — a data breach by another name.",
          "This tool ships as pre-rendered static HTML and JavaScript, and the entire schema generator is pure TypeScript with no network calls. Parsing and code generation run inside a Web Worker in your own browser tab, guarded by a 3-second watchdog; nothing is transmitted, stored, or logged. That makes it safe to paste production payloads on a locked-down corporate laptop, and it keeps working on a plane or an air-gapped machine once the page has loaded.",
        ],
      },
      {
        heading: "Using the generated schema",
        body: [
          "The output targets Zod 3 (the version the vast majority of codebases run today) and is exported as a named const you can drop next to your types. Use schema.parse(data) for exceptions, or safeParse to get a typed result object with a flattened error tree for form validation. Because ISO strings coerce to Date, the parsed output type differs from the input type — exactly the hydration step most date-carrying APIs need.",
          "If your payload had renamed keys, the export is a ZodEffects (z.object + transform) rather than a plain ZodObject, so extend it with .extend() sparingly — regenerate instead. The inferred TS type is available via z.infer<typeof YourSchema>, giving you runtime validation and compile-time types from a single paste.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is my JSON uploaded anywhere when generating a Zod schema?",
        answer:
          "No. The converter is a static page — parsing and generation run in a Web Worker inside your browser, so payloads containing emails, names, or tokens are never transmitted, stored, or logged anywhere.",
      },
      {
        question: "How are mixed arrays like [1, \"a\", true] converted?",
        answer:
          "The generator folds every element into a union: that example becomes z.union([z.number(), z.string(), z.boolean()]). Nested arrays merge element-wise, and arrays of objects with different keys are merged into one schema with .optional() on the keys that are missing somewhere.",
      },
      {
        question: "Why does the output use z.coerce.date() for some strings?",
        answer:
          "Strings matching ISO 8601 — date-only or full timestamps with a timezone — are inferred as dates. z.coerce.date() parses the string into a real Date object at validation time, so your parsed output carries proper Date instances instead of raw strings.",
      },
      {
        question: "Can it handle snake_case keys and still give camelCase types?",
        answer:
          "Yes. The schema validates the raw keys as they appear in your JSON, then a .transform() step renames them to camelCase on the parsed output — you keep wire-format compatibility and idiomatic TypeScript types at the same time.",
      },
      {
        question: "What happens with very large JSON payloads?",
        answer:
          "Conversion runs off the main thread in a Web Worker, so the UI never freezes. A watchdog aborts any conversion that exceeds three seconds and shows a clean error, letting you re-try with a smaller sample instead of hanging the tab.",
      },
      {
        question: "Which Zod version does the generated schema target?",
        answer:
          "Zod 3, which is what most projects use today. The output uses stable, long-standing APIs — z.object, z.union, z.coerce.date, .optional(), and .transform() — so it drops into any modern Zod setup unchanged.",
      },
    ],
  },
  {
    slug: "json-to-typescript",
    target: "ts",
    title: "JSON to TypeScript Interface Converter (Zero-Upload)",
    heading: "JSON to TypeScript Interface Converter — Zero-Upload",
    description:
      "Paste JSON and get clean TypeScript interfaces instantly: nested types, union arrays, optional fields, and a key map for snake_case keys. Runs entirely in your browser — no uploads.",
    heroDescription:
      "Turn any JSON payload into strict-mode TypeScript: every nested object becomes a named interface, [1, \"a\"] becomes (number | string)[], missing keys in arrays of objects become optional properties, and a KeyMap const records every renamed key. The generator runs in a Web Worker in your browser — your data never leaves the tab.",
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
      "snake_case and kebab-case keys converted to camelCase with a KeyMap for hydration",
      "Empty arrays infer unknown[] instead of guessing a wrong concrete type",
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
        heading: "camelCase types with a KeyMap for the wire format",
        body: [
          "snake_case and kebab-case keys are converted to camelCase in the interfaces, so your TypeScript follows convention instead of the API's spelling quirks. To preserve the mapping to the original keys, the generator emits an adjacent KeyMap const: export const UserProfileKeyMap = { userName: \"user_name\" } as const. Use it at your hydration boundary to map parsed JSON onto the typed shape with full type safety.",
          "ISO-8601 strings stay string in the TypeScript output — which is what JSON.parse actually produces at runtime — while the Zod target of the same tool coerces them to Date. That keeps the interfaces honest about what the wire delivers, and lets you layer a parsing step on top when you want richer types.",
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
          "For runtime validation, pair the interfaces with the Zod output from the same tool: the schema validates the raw JSON keys, transforms them to camelCase, and its inferred type matches these interfaces. Together they give you a compile-time contract and a runtime guard from a single paste.",
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
        question: "Why is there a KeyMap const next to my interfaces?",
        answer:
          "JSON keys in snake_case or kebab-case are renamed to camelCase in the interfaces; the KeyMap records the original key for each renamed property so you can map wire-format data onto the typed shape at your hydration boundary.",
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
    slug: "json-to-pydantic",
    target: "pydantic",
    title: "JSON to Pydantic BaseModel (Offline) | SyntaxFiddle",
    heading: "JSON to Pydantic BaseModel Converter — Offline & Private",
    description:
      "Paste JSON and generate Pydantic v2 BaseModel classes instantly: Optional fields, datetime from ISO-8601, and Field(alias=...) for camelCase keys. Fully offline in your browser.",
    heroDescription:
      "Turn any JSON payload into Pydantic v2 models: BaseModel classes emitted children-first, keys missing from array elements become Optional with a None default, ISO-8601 strings map to datetime, and camelCase keys get Field(alias=...) with populate_by_name. The converter runs in a Web Worker in your browser — zero uploads.",
    keywords: [
      "json to pydantic",
      "json to pydantic model",
      "pydantic model generator",
      "json to basemodel",
      "generate pydantic from json",
      "json to python model",
      "pydantic schema from json",
      "json to pydantic offline",
    ],
    featureList: [
      "Generates Pydantic v2 BaseModel classes with children emitted before parents",
      "Partial array objects infer Optional[T] = None fields automatically",
      "ISO-8601 strings detected and typed as datetime",
      "camelCase keys become snake_case fields with Field(alias=...) and populate_by_name",
      "Offline conversion in a Web Worker — payloads with PII never leave your browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "v2-native output",
        description:
          "model_config = ConfigDict, Field aliases, and typing imports — idiomatic modern Pydantic.",
      },
    ],
    sections: [
      {
        heading: "How JSON maps to BaseModel classes",
        body: [
          "Each nested object in your payload becomes its own BaseModel class, emitted children-first so the file imports cleanly top to bottom. Scalars map to their Python equivalents — str, float, bool — arrays become List[T], and mixed arrays such as [1, \"a\"] fold into Union[float, str] wrapped in Optional when null is present. A root that is not an object gets a module-level alias (Root = List[RootItem]) instead of a class.",
          "Optionality is inferred from the data: when an array of objects contains records with different keys, any key missing from at least one element is emitted as Optional[T] = None — the contract FastAPI and Pydantic users actually want for partial API responses. Nulls map to Any, or Optional[...] inside unions, keeping validation lenient exactly where the evidence is ambiguous.",
        ],
      },
      {
        heading: "Aliases, datetimes, and populate_by_name",
        body: [
          "camelCase JSON keys are converted to snake_case field names, and every renamed field carries Field(alias=\"originalKey\") so the model still validates the wire format byte-for-byte. Classes with aliases set model_config = ConfigDict(populate_by_name=True), letting you construct models with either the snake_case name or the original alias — the pattern the Pydantic docs recommend for camelCase APIs.",
          "Strings matching ISO 8601 — dates or full timestamps with timezone offsets — are typed as datetime, so Pydantic parses them into aware datetime objects on validation. Keys that are already snake_case stay untouched with no alias, and Python keywords are suffixed safely (a class key becomes class_), so the generated module is valid Python no matter what your API names its fields.",
        ],
      },
      {
        heading: "Why offline conversion matters for JSON with user data",
        body: [
          "Pydantic models are usually written against real payloads: user records, order histories, support tickets. That JSON contains exactly the personally identifiable information — names, emails, addresses, phone numbers — that GDPR, CCPA, and internal security policies restrict. Running it through a server-hosted converter means transmitting your users' data to an unknown third party, where it may sit in logs or object storage indefinitely; for healthcare or fintech payloads that can be a reportable breach.",
          "This tool has no backend to receive anything. The page is statically exported HTML and JavaScript, and the model generator — pure TypeScript — runs inside a Web Worker in your browser, capped by a 3-second watchdog. Nothing is uploaded, nothing is logged, and the tool keeps working offline once loaded, which makes it safe for production payloads on corporate laptops and in restricted networks.",
        ],
      },
      {
        heading: "Using the generated models",
        body: [
          "The output targets Pydantic v2 with its modern APIs: model_config with ConfigDict, Field(alias=...), and standard typing imports computed from what your payload actually uses. Validate with Model.model_validate(json.loads(payload)) and serialize back with model_dump(mode=\"json\") — datetimes and aliases round-trip correctly because the aliases mirror the original keys.",
          "On Pydantic v1, the output needs only mechanical tweaks — replace model_config with an inner class Config containing populate_by_name = True — everything else (typing imports, Field aliases, Optional defaults) is unchanged. The models drop straight into FastAPI request bodies, SQLModel bases, or data-processing pipelines.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does the JSON I paste leave my browser?",
        answer:
          "No. The converter is a static page and the generator runs in a Web Worker locally — payloads containing customer names, emails, or tokens are never transmitted, stored, or logged by anyone.",
      },
      {
        question: "How are camelCase keys handled in the models?",
        answer:
          "They become idiomatic snake_case fields with Field(alias=\"originalKey\") so validation still accepts the raw JSON, and the class sets model_config = ConfigDict(populate_by_name=True) so you can instantiate with either spelling.",
      },
      {
        question: "Are ISO date strings converted to datetime?",
        answer:
          "Yes. Strings matching ISO 8601 — including date-only values and timestamps with timezone offsets — are typed as datetime, and Pydantic parses them into real datetime objects at validation time.",
      },
      {
        question: "What happens when array objects have inconsistent keys?",
        answer:
          "Keys present in every element become required; keys missing from at least one element become Optional[T] = None. Merged this way, the models accept the full range of shapes a real paginated API returns.",
      },
      {
        question: "Does the output target Pydantic v1 or v2?",
        answer:
          "v2 — the output uses model_config = ConfigDict(...) and Field aliasing. For v1 projects, swap model_config for an inner Config class with populate_by_name = True; everything else works as-is.",
      },
      {
        question: "How are null values represented?",
        answer:
          "A null-only field maps to Any, and null inside a mixed array wraps the union in Optional — so Optional[Union[float, str, bool]] for [1, \"a\", true, null]. Validation stays lenient precisely where the sample data is ambiguous.",
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
          "Every nested object becomes its own named struct type, emitted children-first, with each field exported in PascalCase and carrying a json:\"original_key\" tag that preserves the exact key from your payload — snake_case, kebab-case, or anything else survives the round trip through encoding/json unchanged. Mixed arrays such as [1, \"a\"] map to []any because Go has no unions, while a nullable value ([1, null]) becomes *float64 so the zero value stays distinguishable from absence.",
          "Optionality is inferred from evidence: a key that is missing from at least one object in an array becomes a pointer with an omitempty tag, letting json.Unmarshal and Marshal round-trip partial API responses faithfully. Empty arrays become []any rather than guessing a wrong concrete element type, and struct fields are column-aligned the way gofmt leaves them.",
        ],
      },
      {
        heading: "Type mapping details worth knowing",
        body: [
          "JSON numbers map to float64 — the type encoding/json unmarshals into any, and the only lossless choice without integer evidence in the sample. Strings matching ISO 8601, including date-only values and timestamps with timezone offsets, map to time.Time with the import \"time\" block added automatically and only when needed. Booleans map to bool, null-only fields to any, and a root value that is not an object becomes a type alias (type Root = []string).",
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
          "If your API sends integers, float64 still decodes them exactly (Go's float64 is lossless for JSON integers up to 2^53) — and when you want int64 fields for IDs, a one-line type change is all it takes since the tags already carry the correct keys. For API clients beyond encoding/json, the same struct shapes transfer to jsoncodegen tools or generated OpenAPI types unchanged.",
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
          "Go has no union types, so any is the honest representation. A nullable numeric array ([1, null]) is more specific and becomes []*float64, keeping nil-able elements round-trippable.",
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
