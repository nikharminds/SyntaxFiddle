/**
 * Landing page definitions for SyntaxFiddle's client-side converters. Each
 * entry pairs a converter workspace with demo input and page copy.
 *
 * Importing this module runs `assertConverterRouteIntegrity()`, which throws
 * if a slug collides with an existing route or violates registry invariants,
 * so consumers (build, dev, or test) fail fast instead of shipping
 * conflicting URLs.
 */

/** A single converter landing page definition. */
export interface SeoConverterRoute {
  /** URL segment under which this landing page is served, e.g. "curl-to-salesforce-apex". */
  slug: string;
  /** Which underlying tool workspace backs this landing page. */
  toolType: "curl" | "schema" | "csv";
  /** Human name of the input format, e.g. "cURL". */
  sourceName: string;
  /** Human name of the output format, e.g. "Salesforce Apex HttpRequest". */
  targetName: string;
  /** Page <title> content (~55 chars). */
  metaTitle: string;
  /** Meta description (~150 chars). */
  metaDescription: string;
  /** The page's single <h1>. */
  h1: string;
  /** Short hero paragraph under the <h1>. */
  tagline: string;
  /** Demo input preloaded into the workspace. */
  preloadedInput: string;
  /**
   * Rendered explanation of the preloaded conversion. The conversion itself
   * runs client-side, so this paragraph statically describes what the demo
   * input produces.
   */
  staticSeoExplanation: string;
  /** Short, syntax-focused callouts describing the generated target code. */
  syntaxHighlights: {
    title: string;
    description: string;
  }[];
  /** FAQ entries rendered on the page. */
  faq: {
    question: string;
    answer: string;
  }[];
  /** Long-form documentation sections rendered below the FAQ. */
  sections?: {
    heading: string;
    body: string[];
  }[];
  /** Search phrases this page targets. */
  keywords?: string[];
  /** Sibling converter pages linked from this one. */
  relatedSlugs: string[];
}

/**
 * Route segments that must never be claimed by a converter landing page.
 * `""` guards the root route `/`; `sitemap.xml` guards the generated sitemap.
 */
export const RESERVED_ROUTES: readonly string[] = [
  "",
  "curl",
  "cron",
  "csv",
  "json-to-schema",
  "jwt",
  "regex",
  "tools",
  "sitemap.xml",
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CURL_TO_SALESFORCE_APEX_INPUT = [
  "curl -X POST https://api.example.com/v2/accounts \\",
  "  -H 'Authorization: Bearer sk-live-9f3k2j8dQw7x' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -d '{\"name\":\"Acme Corp\",\"industry\":\"Manufacturing\",\"employees\":250}'",
].join("\n");

const CURL_TO_PYTHON_REQUESTS_INPUT = [
  "curl -X POST https://api.example.com/v2/orders \\",
  "  -u 'admin:s3cr3t-hunter2' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -d '{\"sku\":\"SF-001\",\"quantity\":3,\"gift_wrap\":true}'",
].join("\n");

const CURL_TO_JAVASCRIPT_FETCH_INPUT = [
  "curl -X PUT https://api.example.com/v2/users/42 \\",
  "  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.demo.sig' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -d '{\"name\":\"Ada Lovelace\",\"email\":\"ada@example.com\"}'",
].join("\n");

const JSON_TO_ZOD_INPUT = JSON.stringify(
  {
    id: "usr_123",
    name: "Grace Hopper",
    email: "grace@example.com",
    isActive: true,
    tags: ["admin", "beta"],
    profile: { plan: "pro", seats: 5 },
    lastLogin: null,
  },
  null,
  2,
);

const JSON_TO_PYDANTIC_INPUT = JSON.stringify(
  {
    orderId: "ord_2049",
    customer: { fullName: "Alan Turing", email: "alan@example.com" },
    lineItems: [{ sku: "SCHEMA-01", quantity: 2, unitPrice: 19.5 }],
    discountCode: null,
    shipped: false,
  },
  null,
  2,
);

/** Ordered list; `CONVERTER_ROUTES` below is derived from it. */
const CONVERTER_ROUTE_LIST: readonly SeoConverterRoute[] = [
  {
    slug: "curl-to-salesforce-apex",
    toolType: "curl",
    sourceName: "cURL",
    targetName: "Salesforce Apex HttpRequest",
    metaTitle: "cURL to Salesforce Apex Converter — Private & Free",
    metaDescription:
      "Convert cURL to Apex — Salesforce Apex HttpRequest code generated entirely in your browser. Tokens never leave your machine. Zero upload, free.",
    h1: "cURL to Salesforce Apex HttpRequest Converter",
    tagline:
      "Paste a cURL command and get anonymous-Apex-ready HttpRequest code — endpoint, method, headers, and body mapped to the canonical Salesforce callout shape.",
    preloadedInput: CURL_TO_SALESFORCE_APEX_INPUT,
    staticSeoExplanation:
      "In this example, the cURL command with a Bearer token is translated into an Apex HttpRequest object. We use `req.setEndpoint()`, `req.setMethod('POST')`, and `req.setHeader('Authorization', 'Bearer ...')`.",
    syntaxHighlights: [
      {
        title: "The HttpRequest builder chain",
        description:
          "Every conversion follows the canonical callout shape: HttpRequest req = new HttpRequest();, then req.setEndpoint(), req.setMethod('POST'), and one req.setHeader() per -H flag — in the same order curl sends them.",
      },
      {
        title: "Bodies via req.setBody()",
        description:
          "JSON payloads are compacted to a single line and escaped into a single-quoted Apex string literal, so the snippet pastes cleanly into the Developer Console's Execute Anonymous window.",
      },
      {
        title: "Basic auth the Apex way",
        description:
          "-u credentials become req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf('user:pass'))); — encoded at runtime inside your org, not baked into the snippet.",
      },
      {
        title: "Send, then System.debug",
        description:
          "Http http = new Http(); HttpResponse res = http.send(req); with System.debug lines printing the status code and body — runnable as-is.",
      },
    ],
    faq: [
      {
        question: "Is my Salesforce token safe when converting cURL to Apex?",
        answer:
          "Yes. The transpiler is a static client-side script — your command, including bearer tokens and session IDs, is parsed by your own browser and never uploaded, stored, or logged.",
      },
      {
        question:
          "Why does my callout fail with an unauthorized-endpoint error?",
        answer:
          "Salesforce blocks callouts to hosts that are not whitelisted. Add the endpoint under Setup → Remote Site Settings, or configure a Named Credential and reference it as callout:My_Credential in setEndpoint() — the generated code works unchanged.",
      },
      {
        question: "How do I run the generated Apex?",
        answer:
          "Paste it into the Developer Console (Debug → Open Execute Anonymous Window) and execute. To productionize, lift the request-building block into an Apex class method — it transfers unchanged.",
      },
      {
        question: "How are JSON bodies converted?",
        answer:
          "The payload is compacted and escaped into an Apex string literal passed to req.setBody(), with Content-Type carried over from your -H flag, so the wire request matches what curl sent.",
      },
      {
        question: "Does it convert PUT, PATCH, and DELETE requests?",
        answer:
          "Yes. The verb comes from -X/--request or is inferred (POST when a body flag is present), and setMethod() uppercases it — Apex expects uppercase HTTP method names.",
      },
      {
        question: "How is basic auth (-u) converted for Apex?",
        answer:
          "The converter emits an Authorization header built with EncodingUtil.base64Encode(Blob.valueOf('user:pass')), so the base64 encoding runs at runtime inside Salesforce with correct UTF-8 handling — the same pattern the Apex documentation uses.",
      },
      {
        question: "How does the converter escape quotes for Apex strings?",
        answer:
          "Apex uses single-quoted strings, so every single quote in your URL, headers, or body is escaped to \\' and every backslash is doubled. Newlines become \\n escapes so each literal stays on one source line.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to Apex HttpRequest",
        body: [
          "The generated code follows the canonical Salesforce callout shape: HttpRequest req = new HttpRequest(); followed by req.setEndpoint(...) with your URL, req.setMethod(...) with the verb uppercased, and one req.setHeader(name, value) call per -H flag, in the same order curl sends them. Execution uses the standard Http http = new Http(); HttpResponse res = http.send(req); pair, with System.debug lines printing the status code and response body.",
          "The output is valid anonymous Apex: copy it into the Developer Console (Debug → Open Execute Anonymous Window) and run it as-is, or lift the request-building block into a class method. Bare GET requests simply omit setBody and setHeader when your command carried no headers or data.",
        ],
      },
      {
        heading: "Single-quote escaping and Apex string-literal limits",
        body: [
          "Apex string literals are delimited by single quotes, which is exactly where naive converters break. This tool escapes every single quote as \\' and doubles every backslash to \\\\ across the URL, header values, and body, so pasted JSON with apostrophes, Windows paths, or regex fragments compiles cleanly. Newlines inside raw bodies are emitted as \\n escapes, keeping every literal on a single source line.",
          "JSON bodies are re-serialized in minified form onto that single line — no multi-line literals that break mid-string when pasted into the Developer Console, and no pretty-print padding that inflates the payload toward Apex's compiled string-literal length limits. The bytes you send are exactly the bytes curl would send.",
        ],
      },
      {
        heading: "Basic auth through EncodingUtil",
        body: [
          "When your command carries -u user:pass — or credentials embedded in the URL — the converter emits req.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf('user:pass')));, the idiomatic Apex pattern. The base64 encoding happens at runtime inside your org, computed by Salesforce with correct UTF-8 semantics instead of being baked into the snippet as an opaque precomputed string.",
          "An explicit Authorization header from your cURL command always wins: bearer tokens and API keys pass through untouched, and the generated Basic header is suppressed so the request never carries two conflicting credentials.",
        ],
      },
      {
        heading: "Running the generated callout in Salesforce",
        body: [
          "Apex callouts can only reach endpoints you have whitelisted: add the host under Setup → Remote Site Settings, or configure a Named Credential and swap the endpoint for callout:My_Credential/path. Wrap http.send(req) in a try/catch for System.CalloutException so DNS failures, timeouts, and unexpected redirects surface the way production code expects.",
          "Keep Salesforce governor limits in mind when adapting the snippet: Apex allows 100 callouts per transaction, req.setTimeout() accepts up to 120,000 milliseconds, and a callout cannot follow uncommitted DML in the same transaction. It is a stricter environment than curl, but the generated request itself transfers unchanged.",
        ],
      },
    ],
    keywords: [
      "curl to apex",
      "curl to salesforce apex",
      "curl to apex converter",
      "convert curl to apex",
      "curl to httprequest",
      "salesforce apex http request generator",
      "apex callout generator",
      "curl command to apex code",
    ],
    relatedSlugs: [
      "curl-to-python-requests",
      "curl-to-javascript-fetch",
      "json-to-pydantic",
    ],
  },
  {
    slug: "curl-to-python-requests",
    toolType: "curl",
    sourceName: "cURL",
    targetName: "Python requests",
    metaTitle: "cURL to Python Requests Converter — Private & Free",
    metaDescription:
      "Convert cURL to Python requests code entirely in your browser — json= bodies, auth tuples, and headers mapped automatically. Zero upload, zero logging.",
    h1: "cURL to Python Requests Converter",
    tagline:
      "Paste a cURL command and get clean Python 3 requests code — json=json_data payloads, auth=(user, pass) tuples, and True/False/None literals, generated offline in your browser.",
    preloadedInput: CURL_TO_PYTHON_REQUESTS_INPUT,
    staticSeoExplanation:
      "In this example, the cURL command with basic auth and a JSON body becomes a Python requests call. The -u credentials map to auth=('admin', 's3cr3t-hunter2'), the JSON payload maps to json=json_data (with true becoming True), and the POST verb maps to requests.post(url, headers=headers, json=json_data, auth=auth).",
    syntaxHighlights: [
      {
        title: "json= instead of data=",
        description:
          "When the body is JSON (by Content-Type, the --json flag, or shape), it is emitted as a json_data dictionary — requests serializes it and sets Content-Type for you.",
      },
      {
        title: "auth=(user, pass) tuples",
        description:
          "Basic auth from -u becomes the idiomatic requests auth tuple; the Authorization header is built at request time, not hand-encoded.",
      },
      {
        title: "Python-native literals",
        description:
          "JSON true/false/null are rewritten to True/False/None, and nested objects and arrays become dictionaries and lists with their structure preserved.",
      },
      {
        title: "Standard verbs, standard functions",
        description:
          "GET/POST/PUT/PATCH/DELETE map to their requests.get()/post()/… functions; exotic verbs fall back to requests.request(\"VERB\", url, …).",
      },
    ],
    faq: [
      {
        question: "Is my cURL command uploaded anywhere?",
        answer:
          "No. Conversion is 100% client-side — the page is static HTML and JavaScript, and your command (including credentials and cookies) never leaves the browser.",
      },
      {
        question: "When does the output use json= instead of data=?",
        answer:
          "json= is emitted when Content-Type is application/json, the --json flag is used, or an untyped body parses as valid JSON. Form pairs and raw text become data= with the original content type preserved.",
      },
      {
        question: "Which Python version does the generated code require?",
        answer:
          "Python 3.7 or newer plus the requests library (pip install requests). Nothing else — the snippet uses only requests and the standard library.",
      },
      {
        question: "Does the converter work offline?",
        answer:
          "Yes. Once the page has loaded, the transpiler needs no network — convenient for air-gapped machines and locked-down corporate laptops.",
      },
      {
        question: "Are multi-line cURL commands supported?",
        answer:
          "Yes. Commands pasted with trailing backslash continuations — and ANSI-C $'…' quoting from Chrome DevTools — are normalized before parsing.",
      },
      {
        question: "How are JSON booleans and null translated to Python?",
        answer:
          "Literals are rewritten during conversion: JSON true and false become Python True and False, and null becomes None. Nesting, lists, and dictionaries are preserved exactly.",
      },
      {
        question: "How is basic auth converted for Python?",
        answer:
          "The -u flag becomes the requests auth=(username, password) tuple. If the command already carries an Authorization header (for example a bearer token), it is kept in the headers dict instead.",
      },
      {
        question: "Does it handle custom HTTP methods?",
        answer:
          "Yes. Common verbs become requests.get/post/put/etc., and anything else is emitted as requests.request(\"VERB\", url, …), which supports arbitrary methods.",
      },
    ],
    sections: [
      {
        heading: "json= versus data= — chosen for you",
        body: [
          "Python's requests library has two body parameters, and picking the wrong one causes subtle bugs. json=payload serializes the object and sets Content-Type: application/json automatically, while data=payload sends form-encoded or raw bytes. The converter inspects the Content-Type header, the --json shorthand, and the body's shape, then picks the correct parameter — JSON bodies become a json_data dictionary, everything else becomes a data string.",
          "Nested JSON survives faithfully: arrays become lists, objects become dictionaries, and the literals are rewritten to Python — true and false become True and False, null becomes None, and strings are escaped with Python-safe quoting.",
        ],
      },
      {
        heading: "Auth, headers, and cookies",
        body: [
          "Basic auth from -u (or credentials embedded in the URL) becomes the idiomatic auth=(username, password) tuple, letting requests build the Authorization header at runtime. Bearer tokens and API keys sent via -H pass straight through into the headers dictionary unchanged.",
          "Convenience flags translate naturally: -A/--user-agent fills a User-Agent header, -e/--referer becomes Referer, and -b/--cookie becomes Cookie — so the generated headers dict matches what curl would have sent on the wire.",
        ],
      },
      {
        heading: "Running the generated Python code",
        body: [
          "The snippet targets Python 3.7+ with the requests library — install it once with pip install requests. Each generated script prints the response body, using response.json() for JSON APIs or response.text otherwise, so you can paste it into a REPL and iterate immediately.",
          "Standard verbs map to their requests functions (requests.get, requests.post, requests.put, requests.patch, requests.delete, requests.head, requests.options), while unusual methods fall back to requests.request(\"VERB\", url, …) — the same fallback requests itself documents.",
        ],
      },
      {
        heading: "Query strings, encoding, and edge cases",
        body: [
          "URLs keep their query strings verbatim — no params dictionary needed — and -G with data flags is merged into the URL exactly like curl does. --data-urlencode values are percent-encoded during conversion, and repeated -d flags are joined with & the same way curl joins them before sending.",
          "Multi-line cURL commands with backslash continuations, ANSI-C $'…' quoting from Chrome DevTools, and escaped quotes inside JSON bodies are all normalized before conversion, so pasting straight from a terminal or the macOS pbpaste buffer just works.",
        ],
      },
    ],
    keywords: [
      "curl to python",
      "curl to python requests",
      "curl to python converter",
      "convert curl to python",
      "curl to requests",
      "curl python requests online",
      "curl to pip requests",
    ],
    relatedSlugs: [
      "curl-to-salesforce-apex",
      "curl-to-javascript-fetch",
      "json-to-pydantic",
    ],
  },
  {
    slug: "curl-to-javascript-fetch",
    toolType: "curl",
    sourceName: "cURL",
    targetName: "JavaScript fetch()",
    metaTitle: "cURL to JavaScript fetch() Converter — Zero Upload",
    metaDescription:
      "Convert cURL to modern JavaScript fetch() with async/await entirely in your browser. Headers, JSON bodies, and auth mapped — zero upload, zero logging.",
    h1: "cURL to JavaScript fetch() Converter",
    tagline:
      "Paste a cURL command and get async/await fetch() code — headers as a plain object, JSON bodies wrapped in a pretty JSON.stringify literal, ready for the browser or Node.js 18+.",
    preloadedInput: CURL_TO_JAVASCRIPT_FETCH_INPUT,
    staticSeoExplanation:
      "In this example, the cURL PUT command becomes an async JavaScript fetch() call. The verb maps to method: \"PUT\", each -H flag becomes an entry in the headers object, and the JSON body is embedded as a pretty-printed object literal inside JSON.stringify({...}) — so the snippet runs unchanged in every modern browser and Node.js 18+.",
    syntaxHighlights: [
      {
        title: "async/await by default",
        description:
          "The output is a modern async function: const response = await fetch(url, { method, headers, body }); — no .then() pyramids, no dependencies.",
      },
      {
        title: "JSON.stringify({...}) bodies",
        description:
          "JSON payloads are re-serialized as a formatted object literal wrapped in JSON.stringify — readable, editable, and byte-identical on the wire.",
      },
      {
        title: "Basic auth pre-encoded",
        description:
          "-u credentials are base64-encoded at conversion time and emitted as an Authorization header — no btoa() or Buffer polyfill in the snippet.",
      },
      {
        title: "response.json() consumption",
        description:
          "The snippet awaits response.json() and logs the parsed body, so it demonstrates the full request/response cycle as you would write it by hand.",
      },
    ],
    faq: [
      {
        question: "Is my API token safe when converting cURL to fetch?",
        answer:
          "Yes. The conversion runs entirely in your browser — the command is never sent to a server, stored, or logged.",
      },
      {
        question: "Can I run the generated fetch() code in Node.js?",
        answer:
          "Yes — Node.js 18 and later include fetch natively. Use an ES module for top-level await, or wrap the snippet in an async function for CommonJS projects.",
      },
      {
        question: "What happens to a GET request with -d data?",
        answer:
          "The data is moved into the URL's query string, because the Fetch spec forbids GET bodies and browsers throw a TypeError — the wire request stays equivalent.",
      },
      {
        question: "Why is Content-Length missing from the headers object?",
        answer:
          "fetch computes Content-Length itself; setting it manually is ignored or rejected. The converter drops it, along with headers unset via -H 'Header:'.",
      },
      {
        question: "Does the converter support POST, PUT, PATCH, and DELETE?",
        answer:
          "Yes. The verb is taken from -X/--request, or inferred automatically: POST when a body flag like -d or --data-raw is present, HEAD for -I, and GET otherwise. Custom verbs pass through verbatim.",
      },
      {
        question: "Why does the output use JSON.stringify instead of a raw string?",
        answer:
          "Wrapping a pretty-printed object literal in JSON.stringify keeps the snippet readable and editable while producing byte-identical request bodies. If the body is not valid JSON, the converter falls back to a plain string body.",
      },
      {
        question: "How is basic auth (-u) converted?",
        answer:
          "The user:password pair is base64-encoded during conversion and emitted as an Authorization: Basic header, matching exactly what curl sends on the wire — with no runtime encoding code in the snippet.",
      },
      {
        question: "What cURL flags are converted to fetch features?",
        answer:
          "-H becomes headers, -d/--data-raw/--data-binary become body, -X sets method, -u becomes an Authorization header, -G moves data into the query string, -A/-e/-b map to User-Agent, Referer, and Cookie headers, and --json sets both JSON content type and body.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to fetch()",
        body: [
          "Every -H flag becomes an entry in the headers object, -X or --request sets the method property, and data flags become the body. When the Content-Type is application/json (or the body parses as JSON), the payload is embedded as a formatted object literal inside JSON.stringify — readable, diffable, and safe to edit. Form data keeps a plain string body with the urlencoded content type curl would send.",
          "Basic auth from -u is converted to an Authorization: Basic header using base64 computed at conversion time, so the generated snippet has zero runtime dependencies — no btoa call, no Buffer polyfill. Credentials embedded in the URL are extracted into the same header automatically.",
        ],
      },
      {
        heading: "Quoting edge cases the converter handles",
        body: [
          "cURL commands copied from Chrome DevTools often arrive with $'…' ANSI-C quoting, escaped double quotes inside JSON bodies, and trailing backslashes joining multi-line commands. The tokenizer processes all of these the way bash would, then unescapes your body once — so '{\"name\": \"John \\\"Doe\\\"\"}' arrives in the generated code exactly as curl would transmit it.",
          "The parser also drops the Content-Length header (fetch computes it), merges repeated headers case-insensitively with the last value winning, and removes headers set with an empty value using curl's -H 'Header:' unset syntax.",
        ],
      },
      {
        heading: "Using the output in Node.js and TypeScript",
        body: [
          "The generated code runs in every modern browser and in Node.js 18+, where fetch is built in via undici. Top-level await needs an ES module context (type: module, or a .js file in a modern setup); otherwise wrap the snippet in an async function as shown.",
          "In TypeScript the snippet type-checks as-is; the parsed JSON literal infers its type structurally. For stricter APIs, type response data with a generic helper such as response.json() as Promise<MyType> — the shape is already visible in the snippet.",
        ],
      },
      {
        heading: "fetch() versus curl behavior to know about",
        body: [
          "fetch follows redirects by default (like curl -L) and does not verify the same TLS options, so flags such as -k/--insecure have no equivalent and are ignored during conversion. Similarly, curl's --compressed becomes fetch's automatic decompression — nothing to configure.",
          "One deliberate difference: a GET request carrying -d data is converted to query parameters, because the Fetch spec forbids GET bodies and browsers throw a TypeError. The wire request stays equivalent to what curl sent.",
        ],
      },
    ],
    keywords: [
      "curl to fetch",
      "curl to fetch converter",
      "curl to javascript fetch",
      "curl to fetch online",
      "convert curl to fetch",
      "curl to async await",
      "curl to typescript fetch",
      "fetch api generator",
    ],
    relatedSlugs: [
      "curl-to-python-requests",
      "curl-to-salesforce-apex",
      "json-to-zod",
    ],
  },
  {
    slug: "json-to-zod",
    toolType: "schema",
    sourceName: "JSON",
    targetName: "Zod schema",
    metaTitle: "JSON to Zod Schema Generator — 100% Client-Side",
    metaDescription:
      "Generate Zod schemas from JSON instantly, entirely in your browser — nested objects, optional keys, and unions inferred. Your data never leaves your machine.",
    h1: "JSON to Zod Schema Generator",
    tagline:
      "Paste any JSON payload and get a ready-to-import Zod schema — nested z.object() trees, .optional() for keys that may be missing, and z.union() for mixed values.",
    preloadedInput: JSON_TO_ZOD_INPUT,
    staticSeoExplanation:
      "In this example, the pasted JSON object is inferred into a Zod schema: every string becomes z.string(), the boolean becomes z.boolean(), the array becomes z.array(z.string()), and the nested profile object becomes its own z.object({ plan: z.string(), seats: z.number() }). The null-valued key maps to z.null(), so the generated schema validates the exact shape you pasted.",
    syntaxHighlights: [
      {
        title: "z.object() at every level",
        description:
          "Nested objects become nested z.object({...}) schemas, preserving the payload's structure one-to-one instead of flattening it.",
      },
      {
        title: ".optional() from evidence",
        description:
          "Keys that are sometimes absent across the pasted sample are marked .optional(), so the schema accepts the real-world shape of your API responses.",
      },
      {
        title: "z.union() and .nullable()",
        description:
          "Mixed-type values become z.union([...]) and keys that can be null become .nullable() — the two shapes Zod uses to keep validation honest.",
      },
      {
        title: ".transform() for awkward keys",
        description:
          "Keys that are not valid JavaScript identifiers are kept verbatim and remapped inside a .transform() step, so even exotic payloads round-trip.",
      },
    ],
    faq: [
      {
        question: "Is my JSON uploaded to a server?",
        answer:
          "No. Schema inference and generation run entirely in your browser — nothing is transmitted, stored, or logged, which matters for payloads containing customer data.",
      },
      {
        question: "Which Zod version is the generated schema for?",
        answer:
          "The output uses the stable Zod 3 API surface (z.object, z.string, z.union, .optional(), .nullable()) and works with Zod 3 and later.",
      },
      {
        question: "What happens if my JSON has inconsistent types?",
        answer:
          "A key holding different types across the sample is inferred as a z.union() of the observed variants instead of silently picking one — the schema reflects reality.",
      },
      {
        question: "Is the generator really free?",
        answer:
          "Yes — no sign-up, no rate limits, no logging. Because everything runs client-side there is no backend cost to pass on.",
      },
    ],
    relatedSlugs: [
      "json-to-pydantic",
      "curl-to-javascript-fetch",
      "curl-to-salesforce-apex",
    ],
  },
  {
    slug: "json-to-pydantic",
    toolType: "schema",
    sourceName: "JSON",
    targetName: "Pydantic v2 model",
    metaTitle: "JSON to Pydantic v2 Model Generator — Private",
    metaDescription:
      "Turn JSON into Pydantic v2 models instantly, entirely in your browser — snake_case fields, Field aliases, and Optional types. Zero upload, zero logging.",
    h1: "JSON to Pydantic v2 Model Generator",
    tagline:
      "Paste a JSON payload and get runnable Pydantic v2 models — camelCase keys become snake_case fields with Field(alias=...), and nested objects become their own BaseModel classes.",
    preloadedInput: JSON_TO_PYDANTIC_INPUT,
    staticSeoExplanation:
      "In this example, the camelCase JSON keys are inferred into Pydantic v2 models: orderId becomes order_id: str = Field(alias=\"orderId\") with model_config = ConfigDict(populate_by_name=True), the nested customer object becomes its own BaseModel class, and the null-valued discountCode becomes Optional[str] = None — so the models parse the original payload as-is.",
    syntaxHighlights: [
      {
        title: "One BaseModel per nested object",
        description:
          "Every nested object in the payload becomes its own class inheriting from BaseModel, with names deduplicated and derived from the JSON keys.",
      },
      {
        title: "snake_case with Field(alias=...)",
        description:
          "camelCase keys become idiomatic snake_case fields, and model_config = ConfigDict(populate_by_name=True) lets the models validate the original payload without renaming anything.",
      },
      {
        title: "Optional[...] = None for nulls",
        description:
          "Keys observed as null become Optional[type] = None — the Pydantic convention for values that may be missing from an API response.",
      },
      {
        title: "datetime and list[...] typing",
        description:
          "ISO 8601 date strings are inferred as datetime fields, arrays become list[...] of the item type, and the correct typing imports are emitted for you.",
      },
    ],
    faq: [
      {
        question: "Is my JSON uploaded anywhere?",
        answer:
          "Never. Inference and code generation run entirely in your browser — there is no upload endpoint, nothing is logged, and the page works offline once loaded.",
      },
      {
        question: "Does the output target Pydantic v1 or v2?",
        answer:
          "Pydantic v2 — the output uses ConfigDict and modern typing syntax, the patterns current FastAPI applications expect.",
      },
      {
        question: "Can the models validate my original camelCase payload?",
        answer:
          "Yes. Renamed fields carry Field(alias=\"originalKey\") and the model sets populate_by_name=True, so both the original JSON keys and the snake_case names validate.",
      },
      {
        question: "How are date strings handled?",
        answer:
          "Strings that parse as ISO 8601 dates or timestamps are inferred as datetime fields with the right import; everything else stays str — no silent coercion.",
      },
    ],
    relatedSlugs: [
      "json-to-zod",
      "curl-to-python-requests",
      "curl-to-javascript-fetch",
    ],
  },
];

/** Lookup table keyed by slug. */
export const CONVERTER_ROUTES: Record<string, SeoConverterRoute> =
  Object.fromEntries(CONVERTER_ROUTE_LIST.map((route) => [route.slug, route]));

/** All registered converter slugs, in registry order. */
export function getAllConverterSlugs(): string[] {
  return CONVERTER_ROUTE_LIST.map((route) => route.slug);
}

/**
 * Throws if the registry is invalid: a slug collides with a reserved route,
 * is not lowercase kebab-case, is duplicated, drifts from its Record key, or
 * references a relatedSlug that is missing or self-referencing.
 */
export function assertConverterRouteIntegrity(
  routes: readonly SeoConverterRoute[] = CONVERTER_ROUTE_LIST,
): void {
  const violations: string[] = [];
  const seenSlugs = new Set<string>();
  const routeSlugs = new Set(routes.map((route) => route.slug));

  for (const route of routes) {
    if (RESERVED_ROUTES.includes(route.slug)) {
      violations.push(
        `Slug "${route.slug}" collides with a reserved route (${RESERVED_ROUTES.filter((r) => r !== "").join(", ")}).`,
      );
    }
    if (!SLUG_PATTERN.test(route.slug)) {
      violations.push(
        `Slug "${route.slug}" is not lowercase kebab-case (expected pattern ${SLUG_PATTERN}).`,
      );
    }
    if (seenSlugs.has(route.slug)) {
      violations.push(`Duplicate slug "${route.slug}".`);
    }
    seenSlugs.add(route.slug);

    for (const related of route.relatedSlugs) {
      if (related === route.slug) {
        violations.push(`Route "${route.slug}" links to itself in relatedSlugs.`);
      } else if (!routeSlugs.has(related)) {
        violations.push(
          `Route "${route.slug}" references unknown relatedSlug "${related}" — add it to the registry or fix the typo.`,
        );
      }
    }
  }

  for (const [key, route] of Object.entries(CONVERTER_ROUTES)) {
    if (key !== route.slug) {
      violations.push(`Record key "${key}" does not match entry slug "${route.slug}".`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `lib/config/converters.ts: converter registry integrity check failed (${violations.length} violation${violations.length === 1 ? "" : "s"}):\n` +
        violations.map((violation) => `  - ${violation}`).join("\n"),
    );
  }
}

// Validate on import so any consumer (build, dev, or test) fails fast.
assertConverterRouteIntegrity();
