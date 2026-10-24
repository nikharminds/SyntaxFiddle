export type XmlSchemaSeoSection = {
  heading: string;
  body: string[];
};

export type XmlSchemaSeoFaq = {
  question: string;
  answer: string;
};

export function buildXmlSchemaSeoSections(): XmlSchemaSeoSection[] {
  return [
    {
      heading: "From angle brackets to types: how the XML-to-schema pipeline works",
      body: [
        "The converter parses your XML instance into a structured value, applies the documented XML-to-JSON conventions (attributes become @-prefixed properties, repeated sibling elements become arrays, mixed text becomes #text), and feeds the result through the same inference engine that powers the JSON to Schema tool. That means everything the JSON path already does well — mixed arrays inferring unions, partial records inferring optional fields, ISO-8601 timestamps mapping to real date types, and snake_case or kebab-case keys renamed with their original mapping preserved — works identically on XML-derived structures.",
        "The output targets are the same four: Zod schemas, TypeScript interfaces, Pydantic v2 models, and Go structs, each generated with target-native conventions, aliases, tags, and imports. One SOAP envelope or RSS feed in, production-ready validation code out — no intermediate JSON file to babysit, no copy-paste between two different tools.",
      ],
    },
    {
      heading: "The XML conventions, stated honestly",
      body: [
        "Every XML-to-anything converter has to make judgment calls, and this one documents them instead of hiding them. Attributes become properties prefixed with @ (id=\"1\" becomes @id), because attributes and child elements live in the same namespace collision space and the prefix keeps them distinguishable. Repeated sibling elements with the same tag become arrays; a tag appearing once stays a single value. Elements carrying both text and structure put the text in a #text property alongside its children.",
        "Scalar sniffing is deliberately conservative: text that reads as a round-trippable number or the literals true/false converts to those types, and everything else — including leading-zero identifiers like 007 — stays a string, because guessing otherwise corrupts data. CDATA content is preserved verbatim with no sniffing at all. Empty elements and empty self-closing tags become null, which the inference engine surfaces as nullable fields rather than silently dropping them.",
      ],
    },
    {
      heading: "Why generate typed schemas from legacy XML",
      body: [
        "XML is not dead — it is load-bearing. SOAP services, Sitemaps, RSS and Atom feeds, enterprise config files, and a long tail of banking and logistics APIs still speak it fluently, while new code wants Zod validators, TypeScript interfaces, Pydantic models, and Go structs. Converting an instance document to a typed schema is the fastest honest bridge: paste a representative payload from the system you cannot change, and get the types for the system you are building.",
        "The instance-based approach has a known limit this tool states up front: it infers from the sample you give it, so a field that happens to be absent from your payload will not appear in the schema. Feed it the richest instance you can find — the one with every optional element populated — or paste a couple of variations and merge the results by hand. For DTD or XSD-driven conversions there are dedicated XSD tools; this one is for real documents.",
      ],
    },
    {
      heading: "Client-side by architecture, not by promise",
      body: [
        "Parsing and generation run in a Web Worker inside your browser, guarded by a 3-second watchdog and a nesting-depth limit so the tab never freezes on pathological input. There is no upload endpoint to disable, no telemetry payload carrying your XML, and no account — the tool keeps working offline once the page is loaded. That matters doubly for XML, which in the wild tends to carry exactly the invoices, patient records, and internal payloads you should not paste into a random website.",
        "Errors are precise rather than generic: a mismatched closing tag reports the expected and actual tag names with line and column, an unknown entity is named, an unterminated CDATA section is pointed at. Malformed XML produces a diagnosis, never a silently-wrong schema — the same honesty rule that governs every converter on this site.",
      ],
    },
  ];
}

export const XML_SCHEMA_FAQS: XmlSchemaSeoFaq[] = [
  {
    question: "How do I convert XML to a JSON Schema, Zod schema, or TypeScript type?",
    answer:
      "Paste your XML document into the input pane and pick a target — Zod, TypeScript, Pydantic, or Go. The parser runs in a Web Worker, applies the documented XML-to-JSON conventions (attributes as @properties, repeated elements as arrays, text as #text), and the inference engine generates the typed schema live as you type. Copy the result with the button or Ctrl/Cmd+Enter.",
  },
  {
    question: "How are XML attributes handled in the generated schema?",
    answer:
      "Attributes become properties prefixed with @ — an id=\"1\" attribute becomes an @id property — so attributes and child elements never collide and the mapping back to the source document is unambiguous. Attribute values go through the same conservative scalar sniffing as text content: \"true\" becomes a boolean, \"42\" becomes a number, and anything else stays a string. The @ prefix matches the convention used by mainstream XML-to-JSON libraries.",
  },
  {
    question: "What happens with namespaces, prefixes, and mixed content?",
    answer:
      "Namespaced tag names are kept exactly as written — atom:feed stays atom:feed — because silently stripping prefixes is how converters lose the distinction between two elements that happen to share a local name. The generators rename keys to valid identifiers for the target language and preserve the original mapping, the same way they handle kebab-case JSON keys. Mixed content (text interleaved with child elements) is concatenated into the #text property rather than dropped.",
  },
  {
    question: "Does the converter support XSD or DTD files?",
    answer:
      "No — this tool infers from XML instance documents, the actual payloads your systems exchange, not from schema definition files. DTDs are skipped during parsing, and XSD-to-JSON-Schema translation is a different problem with dedicated tools. Instance-based inference is the right fit when you have real documents and need types fast; if you have a formal XSD, an XSD-aware converter will encode cardinality and constraints this tool can only observe.",
  },
  {
    question: "Why do some fields show up as nullable in the generated schema?",
    answer:
      "Because empty XML elements and self-closing tags convert to null, and the inference engine reports what it sees honestly: a field that is null in the sample becomes nullable in the schema. If you know a field is always present in real payloads, pick a richer sample where it is populated, or tighten the generated type by hand — the output is idiomatic, readable code, not a black-box artifact you cannot edit.",
  },
  {
    question: "Is my XML uploaded to a server?",
    answer:
      "Never. Parsing, convention application, and code generation all run in a Web Worker inside your browser — there is no upload endpoint, nothing is logged, and the page works offline once loaded. A 3-second watchdog aborts runaway conversions to keep the tab responsive, and precise line-and-column errors mean malformed input gets a diagnosis instead of a wrong schema.",
  },
];
