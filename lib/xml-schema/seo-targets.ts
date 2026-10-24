
import type { SchemaTarget } from "../json-schema";

export type XmlSchemaSeoFactIcon = "lock" | "zap" | "terminal" | "shield" | "code";

export type XmlSchemaSeoFact = {
  icon: XmlSchemaSeoFactIcon;
  title: string;
  description: string;
};

export type XmlSchemaSeoSection = {
  heading: string;
  body: string[];
};

export type XmlSchemaSeoFaq = {
  question: string;
  answer: string;
};

export type XmlSchemaSeoTarget = {
  slug: string;
  target: SchemaTarget;
  title: string;
  heading: string;
  description: string;
  heroDescription: string;
  keywords: string[];
  featureList: string[];
  facts: XmlSchemaSeoFact[];
  sections: XmlSchemaSeoSection[];
  faqs: XmlSchemaSeoFaq[];
};

const PRIVACY_FACT: XmlSchemaSeoFact = {
  icon: "lock",
  title: "Zero upload, ever",
  description:
    "Parsing and generation run in a Web Worker inside your browser — SOAP envelopes, invoices, and records with PII never touch a server.",
};

const SPEED_FACT: XmlSchemaSeoFact = {
  icon: "zap",
  title: "Live 300 ms conversion",
  description:
    "Output updates as you type, with repeated elements inferred as arrays, mixed content preserved, and ISO-8601 dates mapped natively.",
};

export const XML_SCHEMA_SEO_TARGETS: XmlSchemaSeoTarget[] = [
  {
    slug: "xml-to-zod",
    target: "zod",
    title: "XML to Zod Schema Generator (Secure & Offline) | SyntaxFiddle",
    heading: "XML to Zod Schema Generator — Secure & Offline",
    description: "Convert XML documents to Zod schemas instantly. Attributes, repeated elements, CDATA, and namespaces handled — runs 100% client-side, zero uploads.",
    heroDescription: "Paste an XML document and get a runnable Zod schema in milliseconds: attributes become z.string() fields, repeated sibling elements become z.array(), text content is sniffed conservatively (numbers and booleans convert, leading-zero identifiers stay strings), and the whole pipeline runs in a Web Worker inside your browser. The schema you copy out is the schema that validates your real payloads.",
    keywords: ["xml to zod", "xml to zod schema", "convert xml to zod", "xml to zod generator", "zod schema from xml", "xml validation zod", "xml to zod online", "zod from soap xml"],
    featureList: ["Generates a complete, runnable Zod schema from any well-formed XML document", "Attributes map to renamed identifier fields with the original @-prefixed keys preserved as comments", "Repeated sibling elements infer z.array(); single occurrences infer plain fields, null elements infer .nullable()", "ISO-8601 text maps to z.coerce.date(); 42 and true convert, 007 stays a string", "100% client-side generation in a Web Worker — zero uploads, zero logging"],
    facts: [PRIVACY_FACT, SPEED_FACT,
      {
        icon: "code",
        title: "Idiomatic Zod output",
        description: "Generated with target-native conventions — renamed identifiers, preserved original-key mappings, and imports you would have written by hand.",
      },
    ],
    sections: [
      {
        heading: "Zod schemas built for real XML, not sanitized demos",
        body: ["Legacy XML is messy in specific, predictable ways: attributes and child elements share a tag, siblings repeat inconsistently between documents, and every enterprise feed carries one optional element nobody documented. This generator is built for that reality. Repeated sibling elements infer z.array() so a feed with three <item> elements and a feed with one validate against the same schema; null and empty elements infer .nullable() instead of failing inference; and mixed content — text interleaved with children — is preserved in a #text property rather than silently dropped.", "The scalar rules are the ones you would write yourself if you had the patience: true and false become z.boolean() literals, round-trippable numbers become z.number(), and everything else — including 007, phone numbers, and version strings — stays z.string(), because converting those is how schemas end up rejecting the data they were built from. CDATA sections are preserved verbatim with no sniffing at all, since a CDATA block is an explicit promise that the content is text."],
      },
      {
        heading: "Attributes, namespaces, and the identifier problem",
        body: ["XML attributes become @-prefixed properties in the intermediate structure and renamed to valid identifiers in the generated schema — @id becomes id — with the original key recorded so the mapping back to the source document is never lost. Namespaced tags are kept exactly as written, atom:feed stays atom:feed in the intermediate value, and the generator renames them to valid Zod property names while preserving the original mapping, the same discipline the JSON tool applies to kebab-case keys.", "That mapping matters more in Zod than in any other target, because Zod schemas are usually wired straight to API boundaries with .parse() at the edge. When a payload fails validation six months from now, the recorded original keys are what let you trace a failing field back to the exact attribute in the XML source — no archaeology, no guessing which element user-name came from.", "A practical workflow: export one representative response from the SOAP service, paste it here, and commit the generated schema next to the client that calls the service. The next integration gets a validator instead of a wiki page, and when the upstream feed changes, the schema diff is the review artifact. Teams that do this report the same outcome — the schema becomes the contract, and the contract is finally enforced at runtime instead of in code review."],
      },
      {
        heading: "Why offline conversion matters for XML payloads with PII",
        body: ["SOAP envelopes and enterprise XML carry the payloads compliance teams worry about: customer records, invoice totals, internal identifiers. This converter has no upload endpoint to disable, no request that can be logged, and no account to create — the XML is parsed by your browser, in a worker thread your browser owns, and the Zod schema is generated on your machine. The page keeps working offline once loaded, which is the proof: a tool that phones home cannot work without a connection. Records with PII — names, emails, tax identifiers — are exactly what this tool is built to keep local.", "The worker runs under a 3-second watchdog and a nesting-depth limit, so a pathologically nested document cannot freeze the tab — and cannot outlive the attempt. When generation fails, it fails loudly with a message, never quietly with a schema that is subtly wrong."],
      },
    ],
    faqs: [
      {
            question: "How do I convert XML to a Zod schema?",
            answer: "Paste your XML into the input pane and the Zod schema appears in the output as you type — no button, no upload. Attributes become renamed string fields, repeated elements become z.array(), and the root element name becomes the schema's exported name. Copy the result with the button or Ctrl/Cmd+Enter."
      },
      {
            question: "How are XML attributes handled in the Zod output?",
            answer: "Attributes arrive as @-prefixed properties in the intermediate value and are renamed to valid identifiers in the schema, with the original key preserved in a comment next to the field. Attribute values go through the same conservative sniffing as text: numeric and boolean-looking strings convert, everything else stays z.string() — so id=\"101\" becomes a string field unless every instance is numeric."
      },
      {
            question: "What does a repeated element infer?",
            answer: "z.array(). If <item> appears three times in one document, the schema requires an array; the same converter fed a single occurrence infers a plain field. That is honest inference from evidence — feed the generator the richest document you have, or paste a couple of variations and merge, when you know a field always repeats."
      },
      {
            question: "Does it support XSD or DTD validation?",
            answer: "No — this tool infers from instance documents, the XML you actually exchange, not from schema definition files. DTDs are skipped during parsing. If you have a formal XSD, an XSD-aware tool encodes cardinality and type constraints this generator can only observe in samples; instance inference is the right fit when the document is the only specification you have."
      },
      {
            question: "Is my XML uploaded anywhere?",
            answer: "Never. Parsing and Zod generation run in a Web Worker inside your browser — there is no backend, nothing is logged, and the page works offline once loaded. Malformed XML produces a precise line-and-column error instead of a wrong schema, and a 3-second watchdog keeps the tab responsive on large documents."
      }
],
  },
  {
    slug: "xml-to-typescript",
    target: "ts",
    title: "XML to TypeScript Interface Converter (Zero-Upload) | SyntaxFiddle",
    heading: "XML to TypeScript Interface Converter — Zero-Upload",
    description: "Convert XML documents to TypeScript interfaces instantly. Nested elements become interfaces, repeated elements become arrays — 100% client-side, zero uploads.",
    heroDescription: "Paste an XML document and get clean TypeScript interfaces in milliseconds: every nested element becomes its own exported interface, repeated siblings become T[], optional-looking scalars stay honest, and attributes become properly renamed properties. The generator runs in a Web Worker inside your browser — your documents never leave the tab.",
    keywords: ["xml to typescript", "xml to typescript interface", "convert xml to typescript", "xml to ts", "typescript types from xml", "xml to typescript online", "generate typescript from xml", "xml interface generator"],
    featureList: ["Generates exported TypeScript interfaces from any well-formed XML document", "Nested elements become separate interfaces named after their tags, PascalCased", "Repeated sibling elements infer arrays (T[]); empty elements infer null-union fields", "Attributes and kebab-case tags renamed to valid identifiers with original keys preserved", "100% client-side generation in a Web Worker — zero uploads, zero logging"],
    facts: [PRIVACY_FACT, SPEED_FACT,
      {
        icon: "code",
        title: "Idiomatic TypeScript output",
        description: "Generated with target-native conventions — renamed identifiers, preserved original-key mappings, and imports you would have written by hand.",
      },
    ],
    sections: [
      {
        heading: "Interfaces that match the document you actually have",
        body: ["TypeScript's job is to describe a shape, and XML documents are shapes with a history: elements that were added in 2009, attributes nobody remembers authorizing, and namespaces layered by successive integrators. This converter reads the document in front of it and describes exactly that. Nested elements become their own exported interfaces — <channel> inside <rss> becomes Rss and Channel — and repeated siblings become arrays, so the types fit the wire format rather than an idealized version of it.", "The naming path is deliberate: tag names are PascalCased for interface names and camelCased for properties, and the original tag or attribute is preserved alongside each rename. When a runtime error eventually points at a field, that recorded original name is the difference between a five-second fix and an afternoon of grepping a decade of XML.", "One more note on arrays: TypeScript cannot express one-or-many without a union, and neither can your document. The generator types what it sees and leaves the union to you, which is the correct default — a T[] that is sometimes wrong is worse than an honest T plus a comment."],
      },
      {
        heading: "What the types encode — and what they honestly cannot",
        body: ["Instance-based inference has a boundary this tool states instead of hiding: it can only type what your sample shows. An optional element that happens to be absent from the pasted document will not appear in the interfaces; a field that appears once will be typed as a scalar even if some documents repeat it. The fix is the obvious one — paste the richest instance you can find, or paste two documents and reconcile — and the output is plain interfaces, so hand-editing the merged result is trivial.", "Mixed content is concatenated into a #text property rather than discarded, empty elements infer null so the union tells the truth about absence, and ISO-8601 timestamps map to string with a comment, because the honest type for text you cannot verify is string — not Date, not any, string.", "The workflow that sticks: keep the richest sample document in the repo, regenerate whenever the feed changes, and treat the diff as the changelog. Because the interfaces are exported and plain, they compose into existing types with Pick and Omit instead of forcing a generator into the build pipeline. The types describe the wire; the wire describes itself; nothing in between needs to be trusted."],
      },
      {
        heading: "Why offline conversion matters for XML payloads with PII",
        body: ["The XML documents that need converting most — SOAP responses, vendor exports, internal reports — are precisely the ones that should not be pasted into a random website. This converter runs entirely in a Web Worker inside your browser: there is no upload call in the code path, no analytics payload carrying your document, and no backend that could log it. Once the page is loaded it works on a plane, which is the operational proof of the privacy claim. Documents full of PII and internal identifiers are precisely what this tool is built to keep local.", "A 3-second watchdog bounds every conversion so a deeply nested document cannot lock the tab, and parse failures surface as line-and-column diagnostics — mismatched tags, unknown entities, unterminated CDATA — instead of a stack trace or, worse, silently wrong interfaces."],
      },
    ],
    faqs: [
      {
            question: "How do I convert XML to TypeScript interfaces?",
            answer: "Paste the XML document into the input pane and the interfaces generate live as you type. The root element becomes the root interface, nested elements become their own exported interfaces, and you can set the root name in the workspace before copying the output."
      },
      {
            question: "What happens to XML attributes?",
            answer: "Attributes become properties with renamed, valid identifiers — @id becomes id — and the original attribute name is preserved alongside so the mapping back to the document is explicit. Attribute values are conservatively sniffed: true/false and round-trippable numbers get typed accordingly, everything else is string."
      },
      {
            question: "Why is my array field typed as a single object?",
            answer: "Because the document you pasted contains one occurrence of that element — the converter types what it observes, honestly. Find a document where the element repeats, or paste a second sample, and the field infers as an array. This beats the alternative: a converter that guesses every field might repeat produces T[] everywhere and types nothing usefully."
      },
      {
            question: "Are namespaces and prefixes preserved?",
            answer: "Tag names are kept exactly as written through parsing — atom:feed stays atom:feed — and then renamed to valid TypeScript identifiers with the original recorded. Silently stripping prefixes is how two different elements collapse into one field, so it never happens here."
      },
      {
            question: "Is my XML sent to a server?",
            answer: "No. Parsing and interface generation run in a Web Worker in your browser; there is no upload endpoint, nothing is logged, and the tool works offline once loaded. Malformed documents get precise line-and-column errors rather than a partial or wrong output."
      }
],
  },
  {
    slug: "xml-to-pydantic",
    target: "pydantic",
    title: "XML to Pydantic BaseModel (Offline) | SyntaxFiddle",
    heading: "XML to Pydantic BaseModel Generator — Offline",
    description: "Convert XML documents to Pydantic v2 BaseModel classes instantly. Aliases for @-attributes, datetime for ISO timestamps — 100% client-side, zero uploads.",
    heroDescription: "Paste an XML document and get Pydantic v2 models in milliseconds: nested elements become nested BaseModel classes, attributes become aliased fields, ISO-8601 timestamps become datetime, and repeated elements become lists. Generation runs in a Web Worker inside your browser — the documents you would never paste into a random site stay on your machine.",
    keywords: ["xml to pydantic", "xml to pydantic model", "convert xml to pydantic", "pydantic from xml", "xml to basemodel", "python model from xml", "xml to pydantic online", "xml to python class"],
    featureList: ["Generates Pydantic v2 BaseModel classes from any well-formed XML document", "Attributes and kebab-case tags become fields with Field alias= mappings back to the source", "Repeated sibling elements infer list[T]; empty elements infer Optional fields", "ISO-8601 text maps to datetime; booleans and numbers typed conservatively", "100% client-side generation in a Web Worker — zero uploads, zero logging"],
    facts: [PRIVACY_FACT, SPEED_FACT,
      {
        icon: "code",
        title: "Idiomatic Pydantic output",
        description: "Generated with target-native conventions — renamed identifiers, preserved original-key mappings, and imports you would have written by hand.",
      },
    ],
    sections: [
      {
        heading: "Pydantic models with aliases that round-trip",
        body: ["Pydantic v2 made aliases first-class, and XML is the reason that matters: attributes carry names like @id and tags arrive as kebab-case, neither of which is a legal Python identifier. The generator maps each one to a clean field name and records the original as a Field alias, so model_validate on the converted structure — and model_dump back toward it — preserves the exact source names. The alias is not cosmetic; it is the contract that keeps the model loadable and the data round-trippable.", "Nesting maps the way you would design it by hand: each repeating or nested element becomes its own BaseModel, repeated siblings become list[T], and empty elements become Optional fields, because absence in XML is a fact the type system should admit. The output is idiomatic v2 — no legacy Config classes, no v1 quirks to strip before committing.", "Configuration is generated too: model_config settings for populating by alias are emitted where the source requires them, so populate_by_name behaves the way the XML expects rather than the way a template defaulted. Small detail, real consequence — it is the difference between a model that imports clean and a model that round-trips."],
      },
      {
        heading: "Typed honestly from evidence, not optimism",
        body: ["The type choices are conservative where wrong guesses are expensive: xs:boolean-style text (true/false) becomes bool, round-trippable numbers become int or float, and everything else stays str — including 007, version strings, and anything numeric-looking that does not round-trip. CDATA is always str, verbatim. ISO-8601 timestamps become datetime because Pydantic coerces them natively and they are the one text format where the payoff is unambiguous.", "The known limit is stated rather than hidden: fields absent from your sample will not appear in the model, and a field seen once is typed as a scalar even if other documents repeat it. Feed the generator your richest instance — or two — and the merge is a five-minute edit in plain, readable model code.", "A workflow worth copying: generate the models from a production sample, put them in a models.py beside the parser, and let Pydantic v2's validation errors become your integration tests. The first time an upstream feed quietly changes a type, the ValidationError names the field, the alias points back to the exact tag, and the fix is a one-line change instead of a debugging session."],
      },
      {
        heading: "Why offline conversion matters for XML payloads with PII",
        body: ["Enterprise XML is a compliance surface: purchase orders, patient feeds, identity payloads. This generator runs in a Web Worker inside your browser with no upload endpoint, no logging, and no account — the document is parsed on your machine and the models are generated on your machine, which is the only architecture where the privacy claim is unfalsifiable. Load the page, go offline, and it still converts. Feeds carrying PII — patient records, payroll, identity documents — are exactly what this tool keeps on your machine.", "Every conversion is bounded by a 3-second watchdog and a nesting-depth limit, and malformed input produces a named diagnosis — mismatched tag, unknown entity, unterminated CDATA — with line and column, never a partial model that validates the wrong thing."],
      },
    ],
    faqs: [
      {
            question: "How do I convert XML to a Pydantic model?",
            answer: "Paste the XML into the input pane, pick Pydantic as the target, and the BaseModel classes generate live as you type. Set the root name in the workspace to control the top-level class name, then copy the output into your project."
      },
      {
            question: "How are XML attributes represented?",
            answer: "Attributes become model fields with clean names and Field(alias=...) mappings back to the original @-prefixed or kebab-case source names, so validation and serialization round-trip without losing the wire format. Attribute values are sniffed conservatively: true/false and round-trippable numbers get bool/int/float types, everything else stays str."
      },
      {
            question: "Do ISO timestamps become datetime fields?",
            answer: "Yes — text matching ISO-8601 maps to datetime, which Pydantic coerces natively on validation. Non-ISO dates (\"01/15/2024\", \"15 Oct 26\") stay str, because guessing formats is how validators reject the data they were written to accept."
      },
      {
            question: "Can it handle SOAP envelopes and namespaced tags?",
            answer: "Yes — namespaced tags are preserved through parsing and renamed to valid Python identifiers with aliases recording the original, so soap:Body and atom:feed stay distinguishable. The namespace itself is treated as part of the name rather than stripped, which is what keeps two same-named elements from different namespaces from collapsing into one field."
      },
      {
            question: "Is my XML uploaded anywhere?",
            answer: "Never. Parsing and model generation run entirely in your browser inside a Web Worker — no upload endpoint exists, nothing is logged, and the page keeps working offline. Malformed XML yields precise line-and-column errors instead of a wrong model."
      }
],
  },
  {
    slug: "xml-to-go-struct",
    target: "go",
    title: "XML to Go Struct Converter | SyntaxFiddle",
    heading: "XML to Go Struct Generator — Offline & Private",
    description: "Convert XML documents to Go structs with xml tags instantly. Repeated elements become slices, namespaces preserved — 100% client-side, zero uploads.",
    heroDescription: "Paste an XML document and get Go structs with struct tags in milliseconds: nested elements become nested structs, repeated siblings become slices, attributes become tagged fields, and the original names live in the tags where encoding/xml expects them. The generator runs in a Web Worker inside your browser — nothing is uploaded, ever.",
    keywords: ["xml to go", "xml to go struct", "convert xml to go", "go struct from xml", "xml to golang", "go xml tags generator", "xml to go online", "golang struct from xml"],
    featureList: ["Generates Go structs with xml struct tags from any well-formed XML document", "Nested elements become nested structs; repeated siblings become slices ([])", "Attributes become fields tagged xml:\"attr,attr\" with valid Go field names", "Empty elements infer pointer fields to represent absence honestly", "100% client-side generation in a Web Worker — zero uploads, zero logging"],
    facts: [PRIVACY_FACT, SPEED_FACT,
      {
        icon: "code",
        title: "Idiomatic Go Structs output",
        description: "Generated with target-native conventions — renamed identifiers, preserved original-key mappings, and imports you would have written by hand.",
      },
    ],
    sections: [
      {
        heading: "Structs encoding/xml can actually unmarshal into",
        body: ["A Go struct is only as good as its tags when XML is on the other end, so this generator emits both halves: exported field names that satisfy Go's conventions and xml tags that satisfy the document's. Attributes become fields tagged with the ,attr option, character data becomes ,chardata where it appears, repeated elements become slices, and the root element name becomes the struct the unmarshaller starts from — the output is not inspired by the document, it is derived from it.", "The element-to-field mapping is explicit in every tag, which is what makes the structs survive contact with real documents: when a feed adds an element, the diff shows the new tagged field, and when a tag name changes, the tag is where the fix lands. No reflection magic, no code generation beyond the structs themselves — paste, copy, unmarshal.", "Pointers deserve one clarification: only empty elements infer pointer fields, not every optional-looking one. Go's nil is reserved for what the document actually showed as absent, which keeps JSON marshalling of the same structs predictable — pointers serialize as null, zero values serialize as values, and the XML told you which is which."],
      },
      {
        heading: "Slices, pointers, and Go's honest treatment of absence",
        body: ["Go distinguishes zero values from absence better than most type systems, and the generator leans on it: empty XML elements infer pointer fields so nil means absent, repeated elements become slices so one-or-many is encoded once, and text fields stay string unless the evidence is unambiguous — true/false becomes bool and round-trippable numbers become float64 or int, while 007 and version strings stay strings.", "The limitation of instance inference applies here as everywhere: fields missing from your sample are missing from the struct, and a once-seen element types as a scalar even where other documents repeat it. The output is plain, gofmt-shaped struct code — paste the richest document you have, and hand-merging a second sample is a mechanical edit, not a rewrite.", "The workflow that earns its keep: check the richest document you have into a testdata directory, generate the struct, and write the unmarshal test beside it. When a vendor changes the feed, the test fails before production does, and the struct tags show exactly which field moved. The generated code is ordinary Go — reviewable in a PR, diffable in a revert, and deletable without ceremony."],
      },
      {
        heading: "Why offline conversion matters for XML payloads with PII",
        body: ["The XML documents Go services consume — bank feeds, logistics manifests, SOAP intermediaries — are the documents you least want leaving your machine. This converter is architecturally incapable of exfiltrating them: parsing and generation run in a browser Web Worker, there is no upload path in the code, and the page functions offline as proof. No account, no telemetry, no quotes-about-security — just no network call. Manifests and bank feeds saturated with PII are exactly what this tool is architected to keep local.", "Runaway documents hit a 3-second watchdog instead of a frozen tab, and malformed input is rejected with a line-and-column diagnosis — mismatched closing tags, unknown entities, unterminated CDATA — so you fix the document instead of debugging a struct that was generated from a misread."],
      },
    ],
    faqs: [
      {
            question: "How do I convert XML to a Go struct?",
            answer: "Paste the XML document into the input pane and the struct generates live as you type, complete with xml struct tags. Set the root name in the workspace to control the top-level struct's name, then copy the output into your project and unmarshal straight into it."
      },
      {
            question: "Do the structs include xml tags?",
            answer: "Yes — every field carries an xml tag derived from the source document: attributes use the ,attr option, element names that are not valid Go identifiers are mapped through their tag, and repeated elements become slices. The tags are what make encoding/xml unmarshal the original document without manual field mapping."
      },
      {
            question: "How are repeated elements handled?",
            answer: "Elements that appear multiple times as siblings become slices in the struct; an element seen once becomes a plain field. That is inference from evidence — if another document repeats an element your sample shows once, paste that document too and promote the field to a slice by hand; the output is plain Go, so the edit is mechanical."
      },
      {
            question: "What about namespaces in the Go output?",
            answer: "Namespaced tags are preserved through parsing and the namespace prefix is carried into the struct tag mapping, so soap:Body and atom:feed remain distinguishable fields. Stripping prefixes silently is how two unrelated elements collapse into one field, so it never happens."
      },
      {
            question: "Is my XML uploaded to a server?",
            answer: "No. Parsing and struct generation run in a Web Worker inside your browser — no upload endpoint exists, nothing is logged, and the converter keeps working offline once the page is loaded. Malformed XML produces precise line-and-column errors rather than a wrong struct."
      }
],
  },
]

export const XML_SCHEMA_TARGET_SLUGS = [
  "xml-to-zod",
  "xml-to-typescript",
  "xml-to-pydantic",
  "xml-to-go-struct",
] as const;

export function getXmlSchemaSeoTarget(slug: string): XmlSchemaSeoTarget | undefined {
  return XML_SCHEMA_SEO_TARGETS.find((target) => target.slug === slug);
}
