export type JsonSchemaSeoSection = {
  heading: string;
  body: string[];
};

const SECTIONS: JsonSchemaSeoSection[] = [
  {
    heading: "How automatic schema inference works",
    body: [
      "The generator walks your JSON the way a type checker would. Scalars map directly — strings, booleans, and numbers split into integers and floats: when every sample of a field is whole (\"id\": 1), it is typed int in Pydantic, int64 in Go, and z.number().int() in Zod, because float64 silently loses precision on large IDs; a single fractional sample widens the field back to a float. Objects become recursive containers and arrays are folded element by element instead of being judged by their first item. That folding is where most online generators give up: [1, \"a\", true] becomes a honest union (number | string | boolean) rather than a lossy any, [1, 2, 3] collapses to a single number because duplicates are deduplicated, and [[1, 2], [\"a\", \"b\"]] merges nested arrays element-wise into a two-dimensional union.",
      "Objects inside arrays are merged field-by-field across every element, which is how real APIs actually behave across pages: a key present in every record stays required, while a key that appears in only some records — an optional email, a middle stage's extra field — comes out optional. Empty arrays infer unknown rather than a guessed concrete type, because an empty sample proves nothing. Identical object shapes found in different branches are deduplicated into one named type, and a watchdog terminates any conversion that exceeds three seconds so a pathological payload can never freeze your tab.",
    ],
  },
  {
    heading: "Dates, keys, and the details generators usually get wrong",
    body: [
      "Timestamps are the classic failure mode of schema generators. Any string matching ISO 8601 — date-only values like 2024-10-21, full timestamps with fractional seconds, or timezone offsets like +05:30 — is detected and typed as a real date in the targets that support them: z.coerce.date() in Zod, datetime in Pydantic, time.Time in Go. Non-dates that merely look numeric stay strings, and invalid calendar values like 2024-13-01 are rejected by an actual parse check, not just a regex.",
      "Key handling is lossless in both directions. By default keys are preserved verbatim — TypeScript emits \"client-name\": string, which is exactly what res.json() returns at runtime, so the generated types never lie about the wire format. Turn on the camelCase toggle and snake_case or kebab-case keys are renamed for TypeScript and Zod instead, with the original spelling preserved somewhere binding: a KeyMap constant next to your interfaces, a .transform() that renames after validating raw keys, a Field(alias=\"...\") with populate_by_name, or a json:\"original_key\" struct tag. Keys that collide after normalization (user_name and user-name) are disambiguated deterministically, and hostile keys like 123abc are sanitized into valid identifiers per language.",
    ],
  },
  {
    heading: "Zod: validation and transformation in one schema",
    body: [
      "The Zod target emits a parse-ready schema, not pseudo-code. Nested objects become z.object trees, mixed arrays become z.union, nullable fields compose with .nullable(), and partial records infer .optional() on exactly the fields the evidence supports. ISO strings map to z.coerce.date(), so the parsed output carries real Date instances instead of the raw strings that arrived over the wire — the hydration step most date-carrying APIs end up hand-writing.",
      "When the camelCase toggle is on and your payload uses keys that would be renamed, the export chains a .transform() that validates the raw wire format and emits camelCase output, so you never choose between accepting the API as-is and idiomatic types. With the toggle off, the schema validates and returns the original keys untouched. The result composes with the rest of the Zod ecosystem: schema.parse for throw-on-invalid boundaries, safeParse for form validation with a flattened error tree, and z.infer<typeof Schema> for a compile-time type derived from the same definition. One paste gives you both the runtime guard and the static type.",
    ],
  },
  {
    heading: "One payload, four dialects: TypeScript, Pydantic, and Go",
    body: [
      "The TypeScript target emits children-first export interface declarations named by their path in the tree, unions written verbatim, optionals with the ? modifier, and keys exactly as they appear on the wire (quoted when they are not valid identifiers) so a variable typed as Root matches res.json() property-for-property. Turn on the camelCase toggle and renamed keys instead get an as-const KeyMap recording the mapping for your hydration boundary. It is declaration-only, compiles under strict mode, and stays honest about runtime reality — JSON.parse produces strings, so ISO dates remain string in the type while the Zod twin of the same payload coerces them to Date.",
      "The Pydantic target generates v2 BaseModel classes with Optional[T] = None for partial fields, datetime for ISO strings, and Field aliases wired through model_config = ConfigDict(populate_by_name=True) — the exact pattern the Pydantic docs recommend for camelCase APIs. The Go target emits encoding/json-ready structs: exported PascalCase fields with column-aligned json tags preserving your original keys, pointers with omitempty for nullability and absence, time.Time where the data is a timestamp, and the import block included only when it is actually needed.",
    ],
  },
  {
    heading: "Why offline conversion matters for JSON with user data",
    body: [
      "The payloads developers test schema generators with are rarely synthetic. They are production API responses, CRM exports, webhook captures, and database dumps — files full of names, email addresses, phone numbers, session tokens, and purchase history. That is personally identifiable information, and pasting it into a server-backed converter means transmitting it to an unknown operator whose retention policy, logging, and sub-processors you cannot audit. Under GDPR, HIPAA, or most corporate security policies, that single paste can constitute a reportable data breach.",
      "This tool has no backend to leak to. It ships as statically exported HTML and JavaScript; the inference engine is pure TypeScript running inside a Web Worker in your browser tab, capped by a three-second watchdog and a nesting-depth limiter. Nothing you paste is transmitted, stored, or logged, the tool keeps working offline once loaded, and you can verify all of it in seconds by opening your browser's Network panel and watching it stay silent while you paste.",
    ],
  },
  {
    heading: "From paste to production: a recommended workflow",
    body: [
      "Treat generated schemas as a starting contract, then keep them in sync. Paste the richest realistic sample you have — ideally several records with optional fields present and absent — and generate the target that matches your stack. Drop the Zod schema at your API boundary with safeParse, validate FastAPI request bodies with the Pydantic models, or unmarshal into the Go structs directly; the aliases and struct tags (and the KeyMap when camelCase renaming is on) keep the wire format byte-compatible so no manual renaming is required.",
      "When the API evolves, paste a fresh response and regenerate rather than hand-editing drift. The engine is deterministic: identical input always yields identical output, so the generated file diffs cleanly in code review. For very large captures, convert a representative slice first — the watchdog aborts pathological payloads with a clean error instead of hanging, and the nesting limiter keeps deep but legitimate documents well inside V8's stack budget.",
    ],
  },
];

export const JSON_SCHEMA_FAQS = [
  {
    question: "Is the JSON to Schema converter really private?",
    answer:
      "Yes. The page is a static export with no backend: parsing and code generation run in a Web Worker inside your browser tab, so payloads containing names, emails, or tokens are never transmitted, stored, or logged. You can verify this by opening the Network panel and watching it stay empty while you work.",
  },
  {
    question: "Which schema targets can I generate from JSON?",
    answer:
      "Four targets are supported: Zod schemas for runtime validation, TypeScript interfaces for compile-time types, Pydantic v2 BaseModel classes for Python, and Go structs with encoding/json tags. Each one is a typed data structure generated from the same inferred type tree, so pick the structure that matches your stack. Dedicated landing pages for each target are linked below the workspace.",
  },
  {
    question: "Does this turn JSON into a JSON Schema document or another structure?",
    answer:
      "It converts JSON into executable structures rather than the JSON Schema draft format: a Zod schema, TypeScript interfaces, Pydantic v2 models, or Go structs. Each target describes the same structure a JSON Schema would — required fields, optionals, unions, and date formats — expressed natively in the language you will actually run. If you are validating JSON in JavaScript, the generated Zod schema fills exactly the role a standalone JSON Schema file would, with runtime parsing included.",
  },
  {
    question: "How are mixed arrays like [1, \"a\", true] handled?",
    answer:
      "Array elements are folded into a deduplicated union, so that example becomes (number | string | boolean) in TypeScript, z.union in Zod, Union[int, str, bool] in Pydantic, and []any in Go, which has no union types. Nested arrays merge element-wise the same way instead of falling back to any.",
  },
  {
    question: "What happens when array objects have different keys?",
    answer:
      "Object schemas across an array are merged field-by-field: keys present in every element remain required, and keys missing from at least one element become optional — emitted as a ? modifier in TypeScript, .optional() in Zod, Optional[T] = None in Pydantic, and a pointer with omitempty in Go.",
  },
  {
    question: "Are ISO 8601 date strings converted to date types?",
    answer:
      "Yes. Strings matching ISO 8601 — date-only values, fractional seconds, and timezone offsets included — are detected with a regex plus a real parse check. They become z.coerce.date() in Zod, datetime in Pydantic, and time.Time in Go, while TypeScript keeps string because that is what JSON.parse actually produces.",
  },
  {
    question: "Will my snake_case keys still work after conversion?",
    answer:
      "Yes. Keys are preserved verbatim by default, so nothing needs mapping at all. If you turn on camelCase renaming, every target preserves the original key in its native mapping mechanism: Zod validates raw keys then transforms them to camelCase, TypeScript emits a KeyMap constant, Pydantic uses Field(alias=...) with populate_by_name, and Go writes the original key into the json struct tag.",
  },
  {
    question: "Are whole numbers typed as int or float?",
    answer:
      "As int. When every sample value of a field is whole (\"id\": 1), the generator emits int in Pydantic, int64 in Go, and z.number().int() in Zod — float64 loses precision on integers past 2^53, which is a real hazard for numeric IDs. If even one sample is fractional, the field widens to float/float64/z.number() to stay truthful to the data. TypeScript uses number for both, matching the language's single numeric type.",
  },
  {
    question: "Can I paste huge or deeply nested JSON files?",
    answer:
      "Reasonably large payloads convert in milliseconds because inference runs off the main thread in a Web Worker. Two guardrails protect the tab: a watchdog terminates any conversion exceeding three seconds with a clean error, and a nesting-depth limiter stops pathological documents long before the JavaScript engine could overflow its stack.",
  },
  {
    question: "Does the tool cost anything or require an account?",
    answer:
      "No. Every target is free to use with no sign-up, no rate limits, and no telemetry, and the generated code is yours with no attribution required. Because conversion is entirely client-side, there is no server cost to pass on and nothing that could log your payloads.",
  },
];

export function buildJsonSchemaSeoSections(): JsonSchemaSeoSection[] {
  return SECTIONS;
}
