import type { TranspileTarget } from "./index";

export type CurlSeoFactIcon = "lock" | "zap" | "terminal" | "shield" | "code";

export type CurlSeoFact = {
  icon: CurlSeoFactIcon;
  title: string;
  description: string;
};

export type CurlSeoSection = {
  heading: string;
  body: string[];
};

export type CurlSeoFaq = {
  question: string;
  answer: string;
};

export type CurlSeoTarget = {
  slug: string;
  target: TranspileTarget | null;
  title: string;
  heading: string;
  description: string;
  heroDescription: string;
  keywords: string[];
  featureList: string[];
  facts: CurlSeoFact[];
  sections: CurlSeoSection[];
  faqs: CurlSeoFaq[];
};

const PRIVACY_FACT: CurlSeoFact = {
  icon: "lock",
  title: "Zero upload, ever",
  description: "Parsing and code generation run in your browser — URLs, headers, and tokens never touch a server.",
};

const SPEED_FACT: CurlSeoFact = {
  icon: "zap",
  title: "Live 100 ms conversion",
  description: "Output updates as you type or paste, with one-keystroke copy via Cmd/Ctrl + Enter.",
};

export const CURL_SEO_TARGETS: CurlSeoTarget[] = [
  {
    slug: "curl-converter",
    target: null,
    title: "cURL Converter — To Fetch, Axios & Python Requests | SyntaxFiddle",
    heading: "cURL Converter — To Fetch, Axios & Python Requests",
    description:
      "Paste a cURL command and instantly convert it to idiomatic JavaScript fetch(), axios, or Python requests code. 100% client-side — commands, headers, and tokens never leave your browser.",
    heroDescription:
      "One input, ten targets: paste any cURL command and switch between fetch(), axios, Python requests, PHP Guzzle, Go, C#, Java OkHttp, PowerShell, HTTPie, and Salesforce Apex output instantly. The parser understands quoting rules, line continuations, data flags, and basic auth — and the whole pipeline runs offline in your browser.",
    keywords: [
      "curl converter",
      "curl to code",
      "curl to javascript",
      "curl to python",
      "curl to fetch",
      "curl to axios",
      "convert curl command",
      "curl command generator",
      "curl transpiler",
    ],
    featureList: [
      "Converts cURL to fetch(), axios, and Python requests in one place",
      "Shell-grade tokenizer: single, double, and ANSI-C $'...' quoting with escaped quotes",
      "Line-continuation backslashes and Windows cmd carets handled transparently",
      "Basic auth, bearer tokens, cookies, user agents, and JSON bodies mapped to idiomatic code",
      "100% client-side conversion with zero uploads and zero logging",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "terminal",
        title: "Three idiomatic targets",
        description: "fetch() with async/await, axios.request config, or Python requests — not naive string wrappers.",
      },
    ],
    sections: [
      {
        heading: "What this cURL converter supports",
        body: [
          "The parser covers the flags you actually paste from terminals and browser DevTools: -X/--request, -H/--header, -d/--data, --data-raw, --data-binary, --data-urlencode, -u/--user, -G/--get, -I/--head, --json, -A/--user-agent, -e/--referer, and -b/--cookie. Cosmetic flags like -s, -L, -k, and --compressed are ignored safely, and credentials embedded in a URL (https://user:pass@host/) are extracted automatically.",
          "Quoting is handled the way bash does it: single quotes pass through literally, double quotes honor backslash escapes, ANSI-C $'…' strings decode \\n and \\t, and the '\'' idiom for embedded apostrophes works. Multi-line commands pasted with trailing backslashes — or Windows caret continuations — are joined into a single command before parsing.",
        ],
      },
      {
        heading: "Method, body, and query-string intelligence",
        body: [
          "If no -X flag is present, the converter infers the verb: GET for bare commands, POST when a body flag exists, and HEAD for -I. With -G, body data is moved into the query string exactly like curl does, and GET requests carrying -d data are converted to query parameters as well — because browsers reject GET request bodies.",
          "JSON is detected from the Content-Type header, the --json shorthand, or the shape of the body itself. JSON payloads are re-serialized as pretty-printed object literals — JSON.stringify({...}) in JavaScript, json= in Python — while form data keeps application/x-www-form-urlencoded semantics with a raw string body.",
        ],
      },
      {
        heading: "Why client-side matters for a cURL converter",
        body: [
          "Real cURL commands routinely contain bearer tokens, session cookies, API keys, and basic-auth credentials. Uploading those to a conversion API means trusting a third party with production secrets. This tool ships as pre-rendered HTML plus a static JavaScript bundle; the transpiler itself is pure TypeScript with no network calls, so your command is parsed by your own browser and never transmitted, stored, or logged.",
          "Because everything is static and pre-rendered, the tool also works offline once the page has loaded — convenient for air-gapped machines, locked-down corporate laptops, and quick conversions from a train.",
        ],
      },
      {
        heading: " Graceful failure instead of silent wrong code",
        body: [
          "Malformed input produces a readable amber explanation — unterminated quotes, headers missing a colon, flags without values, or unsupported file-backed data like -d @payload.json and -F multipart uploads — instead of silently generating broken code. The last successful conversion stays visible so you never lose work mid-edit.",
          "When a command uses features that genuinely require filesystem or stdin access, the error tells you which flag caused it and why, so you can inline the payload yourself and re-convert.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is this cURL converter really free and private?",
        answer:
          "Yes. The converter runs entirely in your browser as a static page — there is no backend API to receive your command. It is free to use with no sign-up, no rate limits, and no logging of any kind.",
      },
      {
        question: "Which programming languages can I convert cURL to?",
        answer:
          "Ten targets are supported: JavaScript fetch(), axios, Python requests, PHP Guzzle, Go net/http, C# HttpClient, Java OkHttp, PowerShell Invoke-RestMethod, HTTPie, and Salesforce Apex HttpRequest. Dedicated landing pages for each target are linked below.",
      },
      {
        question: "What happens if my cURL command is malformed?",
        answer:
          "You get an inline amber alert explaining exactly what failed — for example an unterminated quote or a header missing its colon — and the last successful conversion remains on screen so you can fix the command without losing the output.",
      },
      {
        question: "Does it support file uploads with -F or -d @file?",
        answer:
          "No. Reading local files requires filesystem access that a client-side converter cannot provide. The parser detects these flags and raises a clear error instead of generating code that would silently send the wrong thing.",
      },
      {
        question: "Are query parameters and URL fragments preserved?",
        answer:
          "Yes. Query strings are passed through verbatim, and --data-urlencode plus -G combinations are merged into the URL exactly the way curl would, with each value percent-encoded on your behalf.",
      },
      {
        question: "Can I use the output commercially?",
        answer:
          "Yes — the generated code is yours. It is plain, dependency-free source (except axios/requests, which are open source) with no attribution required.",
      },
    ],
  },
  {
    slug: "curl-to-fetch",
    target: "fetch",
    title: "cURL to Fetch Converter (Client-Side & Secure) | SyntaxFiddle",
    heading: "cURL to Fetch Converter — Client-Side & Secure",
    description:
      "Convert cURL commands to modern JavaScript fetch() with async/await instantly. Headers, JSON bodies, basic auth, and query strings mapped to clean code. 100% client-side — your token never leaves the browser.",
    heroDescription:
      "Paste a cURL command and get production-ready fetch() code: async/await by default, headers as a plain object, JSON bodies wrapped in JSON.stringify with a pretty-printed literal, and basic auth pre-encoded as an Authorization header. Conversion happens entirely in your browser.",
    keywords: [
      "curl to fetch",
      "curl to fetch converter",
      "curl to javascript",
      "curl to fetch online",
      "convert curl to fetch",
      "curl to async await",
      "curl to typescript fetch",
      "fetch api generator",
    ],
    featureList: [
      "Generates modern async/await fetch() with no dependencies",
      "JSON bodies become pretty JSON.stringify literals instead of escaped strings",
      "-u basic auth pre-encoded as an Authorization: Basic header at conversion time",
      "Query strings preserved verbatim; -G data merged into the URL",
      "100% client-side conversion — tokens and URLs are never uploaded",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Idiomatic output",
        description: "async/await, JSON.stringify, and response.json() — the way you would write it by hand.",
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
    faqs: [
      {
        question: "Is my API token safe when converting cURL to fetch?",
        answer:
          "Yes. The conversion runs entirely in your browser — the command is never sent to a server, stored, or logged. The padlock badge in the workspace confirms the zero-network guarantee.",
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
        question: "Can I run the generated fetch() code in Node.js?",
        answer:
          "Yes — Node.js 18 and later include fetch natively. Use an ES module for top-level await, or wrap the snippet in an async function for CommonJS projects.",
      },
      {
        question: "What cURL flags are converted to fetch features?",
        answer:
          "-H becomes headers, -d/--data-raw/--data-binary become body, -X sets method, -u becomes an Authorization header, -G moves data into the query string, -A/-e/-b map to User-Agent, Referer, and Cookie headers, and --json sets both JSON content type and body.",
      },
    ],
  },
  {
    slug: "curl-to-axios",
    target: "axios",
    title: "cURL to Axios Converter Online (Zero-Upload) | SyntaxFiddle",
    heading: "cURL to Axios Converter — Online & Zero-Upload",
    description:
      "Convert cURL commands to clean axios.request() configuration objects instantly. JSON bodies, headers, and basic auth mapped to idiomatic axios options. Fully client-side — nothing is uploaded.",
    heroDescription:
      "Turn any cURL command into a tidy axios.request() call: lowercase method, headers object, data as a parsed object literal, and -u credentials mapped to axios's native auth option. The entire conversion runs in your browser — zero upload, zero logging.",
    keywords: [
      "curl to axios",
      "curl to axios converter",
      "convert curl to axios",
      "curl to axios online",
      "axios request generator",
      "curl to nodejs axios",
      "axios code generator",
    ],
    featureList: [
      "Emits a single axios.request() call with a fully typed config object",
      "JSON bodies embedded as parsed object literals — axios serializes them automatically",
      "-u basic auth mapped to the native auth: { username, password } option",
      "Headers, query strings, and methods translated with curl-faithful semantics",
      "100% client-side conversion — credentials never leave the browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Config-object output",
        description: "One declarative axios.request({...}) — easy to extend with interceptors and retries.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to axios configuration",
        body: [
          "Each cURL flag has a natural home in the axios config: -X/--request becomes a lowercase method, -H flags populate headers, data flags become data, and the URL (with its query string preserved verbatim) becomes url. The result is one declarative axios.request() call you can read top to bottom.",
          "When the body is JSON, it is parsed and embedded as a formatted object literal — axios serializes objects automatically and sets Content-Length for you, so the snippet stays clean. Non-JSON bodies are emitted as plain strings with their content type intact.",
        ],
      },
      {
        heading: "Basic auth the axios way",
        body: [
          "Instead of hand-building an Authorization header, -u user:pass is converted to axios's native auth: { username, password } option, which encodes and sets the header at request time — the idiomatic pattern most codebases prefer. If your command already includes an explicit Authorization header (a bearer token, for example), it is passed through untouched and the auth option is skipped to avoid conflicts.",
          "Credentials embedded in the request URL, like https://user:pass@api.example.com/, are extracted into the same auth option, leaving a clean URL in the generated config.",
        ],
      },
      {
        heading: "From snippet to production code",
        body: [
          "The output assumes a default axios instance; run npm install axios first if your project does not already depend on it. Because everything is a config object, it is trivial to lift into a shared instance: move method, url, headers, and data into axios.create() defaults, or attach the object to interceptors for auth refresh and retry logic.",
          "The snippet logs response.data, which is the parsed body — axios handles JSON deserialization automatically, so there is no await response.json() step like in fetch-based code.",
        ],
      },
      {
        heading: "Semantics preserved from curl",
        body: [
          "The converter keeps curl's wire behavior: --data-urlencode values are percent-encoded before being placed in the body or query string, -G forces data into the URL query with a GET method, and repeated -d flags are joined with & exactly as curl joins them. Repeated headers collapse to the last value, matching curl's behavior.",
          "Like curl, axios follows redirects for GET/HEAD by default; -k/--insecure and other TLS flags have no safe equivalent in the browser and are ignored. A GET with body data is converted to query parameters because servers and fetch-based runtimes reject GET bodies.",
        ],
      },
      {
        heading: "Error handling the axios way: AxiosError, validateStatus, and typed failures",
        body: [
          "axios throws on every non-2xx status by default — behavior curl does not have — so the honest conversion of a curl command into production axios code adds a try/catch around the call and inspects the thrown AxiosError: error.response (the server answered with a 4xx/5xx), error.request (no answer arrived), and error.code (timeout, connection reset, and the ERR_ family). That triage replaces curl's exit codes: curl --fail is roughly validateStatus restricted to <400, and curl's silent timeout is axios's error.code === 'ECONNABORTED' with the config.timeout you set on the instance.",
          "When a 404 or 4xx is an expected outcome rather than an exception, validateStatus moves the decision into the config object — validateStatus: (status) => status < 500 — so the response flows into your then-branch with its status intact. Both patterns attach naturally to the generated axios.request(config) shape: add the key to the config object, wrap the call, and the snippet graduates from request-replicator to production citizen without restructuring.",
        ],
      },
      {
        heading: "Interceptors, retries, and shared instances",
        body: [
          "The config-object output composes cleanly with axios's extension points. Retry logic belongs in an adapter or an interceptor — response interceptors on a shared instance see every failed request in one place, with error.config carrying the original config object this converter emitted, making a bounded retry loop a few lines rather than a rewrite. Auth refresh is the canonical interceptor use case: a 401 interceptor re-fetches a token, mutates config.headers.Authorization, and replays the original request — impossible to express in a single curl command, natural in the axios model.",
          "For anything beyond a one-off script, lift the generated config into a shared axios.create({...}) instance: baseURL from the command's origin, timeout from your SLO, headers common to every call. The per-request config the converter produces transfers unchanged — method, url, params, data — because axios.create defaults and per-request configs merge exactly the way the two-layer structure suggests. TypeScript users get the rest for free: annotate with axios.request<ResponseShape>(config) and the interceptor-augmented instance keeps its types.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to install anything to convert cURL to axios?",
        answer:
          "No. The converter itself is a static web page that runs in your browser. The generated snippet does assume the axios package in your project — npm install axios — since it emits axios.request() calls.",
      },
      {
        question: "How is basic auth handled in the axios output?",
        answer:
          "The -u flag maps to axios's native auth: { username, password } option rather than a manually encoded header. Bearer tokens sent via -H 'Authorization: Bearer …' are kept as plain headers.",
      },
      {
        question: "Why is the method lowercase in the generated code?",
        answer:
          "axios normalizes methods to lowercase internally, and the community style guide recommends lowercase verbs in config objects. The converter emits method: \"post\" style values for idiomatic consistency.",
      },
      {
        question: "Does the axios output include TypeScript types?",
        answer:
          "The snippet is plain, type-checkable JavaScript that works unchanged in TypeScript. For typed responses, annotate with a generic such as axios.request<MyType>(config).",
      },
      {
        question: "How do I handle 404 and other 4xx responses without a try/catch?",
        answer:
          "Add validateStatus to the generated config object — validateStatus: (status) => status < 500 — and axios resolves the promise for 4xx responses instead of throwing, handing you response.status in the then-branch. That is the idiomatic translation of curl's behavior, where every response regardless of status prints and the exit code is the only signal. Keep the try/catch for genuine network failures, which no validateStatus can absorb.",
      },
      {
        question: "How do I add retry logic to the generated axios code?",
        answer:
          "Attach a response interceptor to a shared axios instance: it receives error.config (the exact config object this converter emits), increments a retry counter stored on the config, and re-calls axios.request(error.config) with a delay — bounded to 2-3 attempts for idempotent verbs only (GET, PUT, DELETE; not POST unless your API deduplicates). axios-retry packages the same pattern if you prefer a dependency; either way the generated config never changes, because retries compose at the instance level, not the request level.",
      },
      {
        question: "Is my cURL command uploaded anywhere?",
        answer:
          "No. Conversion is 100% client-side — the page is static HTML and JavaScript, and your command (including tokens and cookies) never leaves the browser.",
      },
      {
        question: "Can I convert commands with query parameters?",
        answer:
          "Yes. Query strings are preserved exactly as pasted, and -G with data flags is merged into the URL the same way curl does it. --data-urlencode parts are percent-encoded for you.",
      },
    ],
  },
  {
    slug: "curl-to-python",
    target: "python",
    title: "cURL to Python Requests Converter (Offline) | SyntaxFiddle",
    heading: "cURL to Python Requests Converter — Offline & Private",
    description:
      "Convert cURL commands to Python 3 requests code instantly. JSON bodies become json= payloads, form data becomes data=, and basic auth maps to the auth tuple. Runs fully offline in your browser.",
    heroDescription:
      "Paste a cURL command and get clean Python 3 requests code: json=json_data for JSON bodies, data= for form payloads, auth=(user, pass) for basic credentials, and True/False/None literals mapped from JSON. The converter runs completely offline in your browser.",
    keywords: [
      "curl to python",
      "curl to python requests",
      "curl to python converter",
      "convert curl to python",
      "curl to requests",
      "curl python requests online",
      "curl to pip requests",
    ],
    featureList: [
      "Emits Python 3 requests code with json= for JSON and data= for form bodies",
      "JSON literals translated to Python syntax: true/false/null become True/False/None",
      "-u basic auth mapped to the auth=(username, password) tuple",
      "requests.request() fallback for custom HTTP verbs like PROPFIND",
      "Offline, client-side conversion — nothing is uploaded or logged",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "requests-native output",
        description: "json= and data= chosen automatically, exactly like hand-written requests code.",
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
    faqs: [
      {
        question: "Does the converter run offline?",
        answer:
          "Yes. The page is pre-rendered static HTML with a client-side transpiler — once loaded it needs no network, so commands with production tokens and cookies are converted entirely on your machine.",
      },
      {
        question: "When does the output use json= instead of data=?",
        answer:
          "json= is emitted when Content-Type is application/json, the --json flag is used, or an untyped body parses as valid JSON. Anything else — form pairs, plain text, XML — becomes data= with the original content type preserved.",
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
        question: "Which Python version does the generated code require?",
        answer:
          "Python 3.7 or newer, plus the requests library via pip install requests. No other dependencies are needed — the snippet uses only requests and the standard library.",
      },
      {
        question: "Does it handle custom HTTP methods?",
        answer:
          "Yes. Common verbs become requests.get/post/put/etc., and anything else is emitted as requests.request(\"VERB\", url, …), which supports arbitrary methods.",
      },
    ],
  },
  {
    slug: "curl-to-php",
    target: "php",
    title: "cURL to PHP Guzzle Converter (Private & Offline) | SyntaxFiddle",
    heading: "cURL to PHP Guzzle Converter — Private & Offline",
    description:
      "Convert cURL commands to PHP Guzzle code instantly — headers, JSON payloads, and basic auth mapped to clean $client->request() calls. 100% client-side, nothing is uploaded.",
    heroDescription:
      "Paste a cURL command and get idiomatic Guzzle 7 code: $client->request() with a typed options array, 'json' for JSON bodies, 'body' for raw payloads, and 'auth' for basic credentials. The conversion runs entirely in your browser — private and offline.",
    keywords: [
      "curl to php",
      "curl to php converter",
      "curl to guzzle",
      "curl to guzzle converter",
      "convert curl to php",
      "curl php guzzle online",
      "curl command to php",
    ],
    featureList: [
      "Emits Guzzle 7 $client->request() calls with a clean options array",
      "JSON bodies become nested PHP arrays via the 'json' option",
      "-u basic auth mapped to the 'auth' => [user, pass] option",
      "Raw string bodies preserved verbatim for non-JSON payloads",
      "Private, client-side conversion — commands never leave the browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Guzzle-native output",
        description: "json, body, and auth options chosen the way Guzzle documentation does.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to Guzzle",
        body: [
          "Guzzle exposes almost everything through a single request method: $client->request($method, $uri, $options). The converter maps -X/--request to the method argument, the URL to $uri, every -H flag into the 'headers' array, data flags into 'json' or 'body', and -u into the 'auth' option — producing one declarative call with no boilerplate.",
          "When the body is JSON (detected from Content-Type, the --json shorthand, or the payload's shape), it is parsed and emitted as a formatted PHP array under the 'json' option, which Guzzle serializes and content-types automatically. Anything else — form pairs, XML, plain text — is passed as a raw string under 'body' with the original headers intact.",
        ],
      },
      {
        heading: "Literals translated to PHP conventions",
        body: [
          "JSON values are rewritten to their PHP equivalents during conversion: true and false become lowercase true and false (PHP booleans are case-insensitive, but modern style is lowercase), null becomes null, and nested objects become associative arrays with => syntax.",
          "Strings are emitted as single-quoted PHP literals with backslash and quote escaping applied, so the snippet never depends on double-quote interpolation — no accidental $variable interpolation from payload contents.",
        ],
      },
      {
        heading: "Running the generated PHP code",
        body: [
          "The snippet targets PHP 7.2.5+ with Guzzle 7, the version required to keep PSR-7 and PSR-18 contracts current. Install it with Composer: composer require guzzlehttp/guzzle. The output is a runnable script with a try/catch around RequestException, echoing the response body — paste it into a file and run php script.php.",
          "Because the call uses a plain Client instance, it lifts cleanly into frameworks: Laravel and Symfony applications typically register a shared Guzzle client in a container and inject it — the options array transfers unchanged.",
        ],
      },
      {
        heading: "Auth, headers, and wire fidelity",
        body: [
          "Basic auth from -u or credentials embedded in the URL becomes the 'auth' => [username, password] option; Guzzle builds the Authorization header at runtime. Bearer tokens and API keys sent via -H pass straight into the headers array untouched, and when an explicit Authorization header exists the auth option is skipped to avoid conflicts.",
          "Query strings are preserved verbatim in the URL, repeated -d flags are joined with & exactly as curl joins them, and --data-urlencode values are percent-encoded during conversion — so the emitted request matches what curl would have put on the wire.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is my cURL command uploaded to a server during conversion?",
        answer:
          "No. The converter is a static page that transpiles in your browser — commands with production tokens, cookies, or basic-auth credentials are never transmitted, stored, or logged.",
      },
      {
        question: "Which Guzzle version does the generated PHP target?",
        answer:
          "Guzzle 7 on PHP 7.2.5 or newer. Install with composer require guzzlehttp/guzzle. The snippet also works unchanged when the client is injected via a framework container.",
      },
      {
        question: "When does the output use 'json' versus 'body'?",
        answer:
          "'json' is emitted for valid JSON bodies with a JSON content type — as a nested PHP array Guzzle serializes for you. Everything else becomes 'body' with the raw string, preserving the original content type.",
      },
      {
        question: "How is basic auth (-u) converted for PHP?",
        answer:
          "It becomes the 'auth' => [username, password] option. If your command already carries an Authorization header (for example a bearer token), that header is kept instead and the auth option is omitted.",
      },
      {
        question: "Does the PHP output handle custom HTTP methods?",
        answer:
          "Yes — the method string from -X is passed directly to $client->request(), so PROPFIND, MERGE, or any verb your API defines works as-is.",
      },
      {
        question: "Can I use the generated code in Laravel or Symfony?",
        answer:
          "Yes. The options array (headers, json, body, auth) transfers directly to a container-managed Guzzle client — copy the array into your service call and adjust error handling to your framework's conventions.",
      },
    ],
  },
  {
    slug: "curl-to-go",
    target: "go",
    title: "cURL to Go net/http Converter (Client-Side & Free) | SyntaxFiddle",
    heading: "cURL to Go net/http Converter — Client-Side & Free",
    description:
      "Convert cURL commands to idiomatic Go net/http code instantly — json.Marshal bodies, req.Header.Set calls, and SetBasicAuth. Fully client-side conversion, zero uploads, free forever.",
    heroDescription:
      "Paste a cURL command and get a complete Go program: http.NewRequest with the right method constant, headers via req.Header.Set, JSON payloads marshalled from map[string]any literals, and basic auth via SetBasicAuth — generated entirely in your browser.",
    keywords: [
      "curl to go",
      "curl to golang",
      "curl to go converter",
      "curl to golang converter",
      "convert curl to go",
      "curl to net/http",
      "curl command to golang",
    ],
    featureList: [
      "Generates a complete, runnable Go program around net/http",
      "JSON bodies emitted as map[string]any literals marshalled with json.Marshal",
      "Standard verbs use http.MethodGet/Post/Put constants; custom verbs pass through",
      "-u basic auth mapped to the idiomatic req.SetBasicAuth call",
      "Free, client-side conversion — nothing leaves your browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "gofmt-shaped output",
        description: "Tab-indented, import-grouped code that looks like it came out of gofmt.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to Go's net/http",
        body: [
          "Go's standard library builds requests in three steps — construct, decorate, execute — and the generated code follows exactly that shape: http.NewRequest(method, url, body) from the -X flag and URL, req.Header.Set(...) for every header, and http.DefaultClient.Do(req) to send it. The output is a full main package you can run with go run main.go.",
          "The import block is computed from what your command actually uses: bytes and encoding/json appear only for JSON bodies, strings only for raw string bodies, and the list stays alphabetized the way gofmt leaves it.",
        ],
      },
      {
        heading: "JSON bodies the Go way",
        body: [
          "Instead of embedding an opaque string, JSON payloads are emitted as map[string]any{...} literals — with nested objects, slices as []any{...}, true/false/null translated to true/false/nil — and marshalled through json.Marshal with the error checked. That keeps the payload editable as Go source and types it loosely, exactly like JSON unmarshalling into any.",
          "Non-JSON bodies skip the marshal step entirely and are wrapped in strings.NewReader so form data and raw text hit the wire byte-for-byte as curl sent them.",
        ],
      },
      {
        heading: "Methods, auth, and wire fidelity",
        body: [
          "Standard verbs map to the http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodHead, and http.MethodOptions constants; anything exotic is passed as a plain string literal, which http.NewRequest accepts. Basic auth from -u becomes req.SetBasicAuth(user, pass), the canonical one-liner.",
          "Query strings are preserved verbatim in the URL, repeated -d flags join with &, and --data-urlencode parts are percent-encoded during conversion. Content-Length is dropped because net/http computes it — just like curl does.",
        ],
      },
      {
        heading: "From snippet to production Go",
        body: [
          "The generated program prints the response body after checking every error — the minimal correct shape. To productionize: swap panic for your error strategy, add context via http.NewRequestWithContext, replace DefaultClient with a configured &http.Client{Timeout: ...}, and unmarshal into typed structs instead of printing.",
          "Because the output is plain standard library, it compiles anywhere Go does — no third-party dependencies, no generated code licenses, nothing to vendor.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is this cURL to Go converter free?",
        answer:
          "Yes — free with no sign-up, quotas, or ads on the tool itself, and the conversion runs entirely in your browser so there is no backend cost to pass on.",
      },
      {
        question: "Does the generated Go code need any dependencies?",
        answer:
          "No. It uses only the standard library (net/http, encoding/json, and friends), so it compiles with a bare Go toolchain and no go.mod requirements beyond the module itself.",
      },
      {
        question: "How are JSON bodies represented in the Go output?",
        answer:
          "As map[string]any literals marshalled with json.Marshal, with JSON booleans and null mapped to Go's true, false, and nil. You can then swap the loose literal for typed structs as your code matures.",
      },
      {
        question: "How is basic auth handled in Go?",
        answer:
          "The -u flag becomes req.SetBasicAuth(username, password), which net/http translates into the Authorization header at request time. Explicit Authorization headers from -H are passed through unchanged instead.",
      },
      {
        question: "Why does the output use http.DefaultClient?",
        answer:
          "It keeps the snippet dependency-free and short. In production, replace it with a configured client — most importantly one with a Timeout — as noted in the generated code's documentation section.",
      },
      {
        question: "Does the converter support custom HTTP methods?",
        answer:
          "Yes. Standard verbs use Go's http.Method* constants; anything else (PROPFIND, REPORT, and friends) is passed as a string literal, which http.NewRequest accepts directly.",
      },
    ],
  },
  {
    slug: "curl-to-csharp",
    target: "csharp",
    title: "cURL to C# HttpClient Converter (Online & Zero-Upload) | SyntaxFiddle",
    heading: "cURL to C# HttpClient Converter — Online & Zero-Upload",
    description:
      "Convert cURL commands to modern C# HttpClient code instantly — top-level statements, HttpRequestMessage, StringContent with raw string literals. 100% client-side, zero uploads.",
    heroDescription:
      "Paste a cURL command and get clean C# for .NET 6+: top-level statements, an HttpRequestMessage with the right HttpMethod, headers via request.Headers.Add, and JSON bodies in C# 11 raw string literals — converted entirely in your browser.",
    keywords: [
      "curl to c#",
      "curl to csharp",
      "curl to c# converter",
      "curl to httpclient",
      "convert curl to c#",
      "curl to csharp online",
      "curl to dotnet",
    ],
    featureList: [
      "Emits modern C# with top-level statements — no Program class boilerplate",
      "JSON bodies embedded in C# 11 raw string literals for copy-paste fidelity",
      "-u basic auth pre-encoded into an AuthenticationHeaderValue",
      "Standard verbs map to HttpMethod.Get/Post/Put constants; custom verbs use new HttpMethod(...)",
      "Zero-upload, client-side conversion — credentials never leave the browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Modern C# output",
        description: "Top-level statements, raw strings, and async/await — .NET 6+ by default.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to HttpClient",
        body: [
          "HttpClient sends HttpRequestMessage instances, and the converter mirrors that shape: one var request = new HttpRequestMessage(method, url) line, a request.Headers.Add(...) call per -H flag, and content attached with new StringContent(...). The method argument uses the HttpMethod.Get/Post/Put/Patch/Delete/Head/Options members, falling back to new HttpMethod(\"VERB\") for custom verbs.",
          "The response is consumed with await client.SendAsync(request) and ReadAsStringAsync, wrapped in using declarations so the snippet compiles clean under the latest analyzers.",
        ],
      },
      {
        heading: "Raw string literals keep JSON honest",
        body: [
          "Instead of escaping a JSON payload into a regular C# string — where every quote doubles and every typo hurts — the body is embedded in a C# 11 raw string literal (\"\"\"...\"\"\"). The JSON appears exactly as it travels over the wire, ready to inspect and edit. If a payload ever contains the triple-quote delimiter itself, the converter falls back to a fully escaped classic string.",
          "The media type argument of StringContent receives your Content-Type header automatically, so the Content-Type header is not duplicated across both content and headers — matching how HttpClient actually applies content headers.",
        ],
      },
      {
        heading: "Auth, headers, and content headers",
        body: [
          "Basic auth from -u is base64-encoded at conversion time and emitted as request.Headers.Authorization = new AuthenticationHeaderValue(\"Basic\", ...) — no runtime encoding code. Bearer tokens from -H pass through untouched, and when an explicit Authorization header exists, the precomputed header is skipped to avoid sending two.",
          "Note the split the converter handles for you: content headers like Content-Type belong to the StringContent, while request headers (Authorization, X-*, Accept) go on request.Headers — misplacing them is the number-one HttpClient beginner bug.",
        ],
      },
      {
        heading: "Running and evolving the snippet",
        body: [
          "The output targets .NET 6+ (C# 10 syntax) with raw strings requiring C# 11 / .NET 7 — drop it into Program.cs of a console project and run with dotnet run. For older language versions, replace the raw string with a regular escaped string; everything else is C# 8-compatible.",
          "In production code, prefer IHttpClientFactory registration over new HttpClient() to avoid socket exhaustion, and extend with Polly for retries — the request-building lines transfer unchanged.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is the cURL to C# conversion really private?",
        answer:
          "Yes. The page is static and the transpiler runs in your browser — commands with bearer tokens or basic-auth credentials are never uploaded, logged, or stored anywhere.",
      },
      {
        question: "Which .NET version does the generated C# require?",
        answer:
          "The snippet uses top-level statements (.NET 6+) and C# 11 raw string literals (.NET 7+). On older toolchains, swap the raw string for an escaped string and the rest compiles as-is.",
      },
      {
        question: "How is basic auth converted for C#?",
        answer:
          "-u credentials are base64-encoded during conversion and emitted as an AuthorizationHeaderValue on request.Headers.Authorization — matching curl's wire format with zero runtime encoding logic.",
      },
      {
        question: "Why is Content-Type on StringContent instead of the headers?",
        answer:
          "HttpClient treats Content-Type as a content header, not a request header — assigning it to request.Headers throws. The converter routes it to the StringContent media type automatically.",
      },
      {
        question: "Can I use the output with RestSharp or Refit instead?",
        answer:
          "The generated code targets the built-in HttpClient, which underpins both libraries — the URL, headers, and body mapping transfer directly if you adapt the syntax yourself.",
      },
      {
        question: "Does the converter handle custom HTTP methods?",
        answer:
          "Yes. Standard verbs map to HttpMethod members; anything else is emitted as new HttpMethod(\"VERB\"), which HttpClient sends verbatim.",
      },
    ],
  },
  {
    slug: "curl-to-java",
    target: "java",
    title: "cURL to Java OkHttp Converter (Offline & Secure) | SyntaxFiddle",
    heading: "cURL to Java OkHttp Converter — Offline & Secure",
    description:
      "Convert cURL commands to Java OkHttp code instantly — Request.Builder chains, RequestBody.create payloads, and basic auth headers. Runs fully offline in your browser, zero uploads.",
    heroDescription:
      "Paste a cURL command and get a ready-to-run OkHttp class: a Request.Builder chain with method and headers, RequestBody.create for the payload, and try-with-resources response handling — converted completely offline in your browser.",
    keywords: [
      "curl to java",
      "curl to okhttp",
      "curl to java converter",
      "curl to okhttp converter",
      "convert curl to java",
      "curl java http client",
      "curl command to java",
    ],
    featureList: [
      "Emits a runnable Main class around OkHttp's Request.Builder chain",
      "JSON bodies compacted into Java string literals for RequestBody.create",
      "-u basic auth pre-encoded as an Authorization header at conversion time",
      "Standard verbs use .get()/.post()/.put(); custom verbs use .method(...)",
      "Offline, client-side conversion — nothing is uploaded or logged",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Builder-chain output",
        description: "The fluent Request.Builder style every OkHttp codebase already uses.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to OkHttp",
        body: [
          "OkHttp builds requests with a fluent chain, and the generated code follows it literally: .url(...) from your endpoint, .get()/.post(body)/.put(body) from the method (or .method(\"VERB\", body) for exotic verbs), one .header(name, value) per -H flag, and .build(). The result reads top-to-bottom like the cURL command it came from.",
          "The snippet is wrapped in a Main class with try-with-resources on the Response — the pattern OkHttp's own documentation recommends — and prints the body via response.body().string().",
        ],
      },
      {
        heading: "Payloads, media types, and wire fidelity",
        body: [
          "Bodies are passed to RequestBody.create. JSON payloads are compacted to a single-line string literal — escaped to Java's rules — so the chain stays readable even for large documents. The MediaType.parse(...) declaration is emitted only when your command carries a Content-Type, keeping GET requests free of dead variables.",
          "Form data and raw text keep their exact bytes; query strings are preserved verbatim in the URL; repeated -d flags join with & the way curl joins them; and --data-urlencode values are percent-encoded during conversion.",
        ],
      },
      {
        heading: "Authentication and headers",
        body: [
          "Basic auth from -u — or credentials embedded in the URL — is base64-encoded at conversion time and attached as an Authorization: Basic header line in the chain, so the snippet carries no runtime encoding calls. Explicit Authorization headers (bearer tokens, API keys) pass through untouched and suppress the precomputed header to avoid duplicates.",
          "Because every header is a separate .header(...) call, adding signing headers, trace IDs, or tenant tags later is a one-line change in the same style.",
        ],
      },
      {
        heading: "Running the generated Java",
        body: [
          "Add OkHttp to your build — Maven: com.squareup.okhttp3:okhttp:4.12.0, or Gradle: implementation 'com.squareup.okhttp3:okhttp:4.12.0' — then drop the class into any project and run main. Java 8+ is sufficient.",
          "For Android or server code, move the OkHttpClient instance to a shared field or DI provider (a client should be reused), and extend with interceptors for auth refresh or logging — the request chain transfers unchanged.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does the converter work offline?",
        answer:
          "Yes. The page loads once as static HTML and JavaScript; the transpilation itself needs no network, so commands with production credentials never leave your machine.",
      },
      {
        question: "What do I need to run the generated Java code?",
        answer:
          "Java 8+ and the OkHttp dependency — com.squareup.okhttp3:okhttp:4.12.0 via Maven or Gradle. The snippet is otherwise self-contained with a runnable main method.",
      },
      {
        question: "How is basic auth (-u) converted for Java?",
        answer:
          "Credentials are base64-encoded during conversion and emitted as .header(\"Authorization\", \"Basic ...\") in the builder chain — byte-identical to what curl sends, with no runtime encoding logic.",
      },
      {
        question: "Why is the JSON body on one line in the output?",
        answer:
          "OkHttp takes the body as a string, and compacting valid JSON keeps the builder chain readable and the literal copy-paste safe. Pretty-print the payload after it arrives if you need it formatted.",
      },
      {
        question: "Does the output support custom HTTP methods?",
        answer:
          "Yes. Standard verbs map to .get(), .post(), .put(), .patch(), .delete(), and .head(); anything else is emitted as .method(\"VERB\", body), which OkHttp sends verbatim.",
      },
      {
        question: "Can I reuse the OkHttpClient across requests?",
        answer:
          "You should — OkHttp performs best when its client is shared. Move the OkHttpClient declaration to a field or DI provider; the request-building chain needs no changes.",
      },
    ],
  },
  {
    slug: "curl-to-apex",
    target: "apex",
    title: "cURL to Salesforce Apex HttpRequest Converter (Offline) | SyntaxFiddle",
    heading: "cURL to Salesforce Apex HttpRequest Converter — Offline & Secure",
    description:
      "Instantly convert cURL commands into Salesforce Apex HttpRequest code. 100% offline execution ensures your enterprise API tokens never leave your browser.",
    heroDescription:
      "Paste a cURL command and get a ready-to-run Apex script: a HttpRequest with setEndpoint, setMethod, and setHeader calls, an EncodingUtil-powered Authorization header when you pass -u, and Http.send with System.debug logging. The whole conversion runs in your browser, so org credentials and API tokens never leave your machine.",
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
    featureList: [
      "Emits a complete, runnable Apex script — HttpRequest setup, Http.send execution, and System.debug logging included",
      "Single quotes escaped to \\' and backslashes doubled so every generated string literal compiles in Apex",
      "-u basic auth becomes 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf('user:pass')) at Apex runtime",
      "JSON bodies minified onto a single line to stay inside Apex string-literal limits",
      "100% client-side conversion — enterprise tokens and org credentials never leave your browser",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code",
        title: "Anonymous-Apex ready",
        description:
          "Paste the output straight into the Developer Console — request setup, send, and debug lines included.",
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
    faqs: [
      {
        question: "Is this cURL to Apex converter really free and private?",
        answer:
          "Yes. The page ships as static HTML and JavaScript, and the transpiler runs entirely in your browser — commands containing org credentials, session IDs, or API tokens are never uploaded, stored, or logged.",
      },
      {
        question: "Where can I run the generated Apex code?",
        answer:
          "Anywhere Apex runs. The snippet is valid anonymous Apex — paste it into the Developer Console's Execute Anonymous Window — or move the request-building lines into an Apex class or test method unchanged.",
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
      {
        question: "Why is my JSON body minified to a single line?",
        answer:
          "Multi-line string literals are fragile to paste into the Developer Console, and padded bodies push against Apex's compiled string-literal length limits. Minifying keeps the payload byte-identical to what curl sends while staying safe to copy.",
      },
      {
        question: "Why does the generated callout fail with an 'unauthorized endpoint' error?",
        answer:
          "Salesforce blocks callouts to hosts that are not whitelisted. Add the endpoint under Setup → Remote Site Settings, or configure a Named Credential and reference it as callout:My_Credential in setEndpoint — the rest of the generated code works unchanged.",
      },
    ],
  },
  {
    slug: "curl-to-powershell",
    target: "powershell",
    title: "cURL to PowerShell Converter (Invoke-RestMethod) | SyntaxFiddle",
    heading: "cURL to PowerShell Converter — Invoke-RestMethod, Splatting-Ready",
    description:
      "Convert cURL commands to Windows PowerShell Invoke-RestMethod calls instantly — splatted parameter hashtables, here-string bodies, and basic auth pre-encoded. 100% client-side, nothing is uploaded.",
    heroDescription:
      "Paste a cURL command and get production-shaped PowerShell: an @{} parameter hashtable splatted into Invoke-RestMethod, JSON bodies in single-quoted here-strings (no interpolation), headers as a hashtable, and -u credentials pre-encoded as a Basic Authorization header. The whole conversion runs offline in your browser.",
    keywords: [
      "curl to powershell",
      "curl to powershell converter",
      "convert curl to powershell",
      "curl to invoke-restmethod",
      "curl to invoke-webrequest",
      "curl powershell online",
      "curl to pwsh",
      "powershell http request generator",
      "convert curl command to powershell",
      "curl to windows",
    ],
    featureList: [
      "Emits an @{} parameter hashtable splatted with @params — the idiomatic PowerShell 7 shape",
      "Bodies embedded in single-quoted here-strings: no interpolation, JSON stays verbatim",
      "Headers as a PowerShell hashtable with single-quote escaping handled",
      "-u basic auth pre-encoded into an Authorization: Basic header at conversion time",
      "Invoke-RestMethod output piped through ConvertTo-Json for readable printing",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "code" as const,
        title: "Splatting-native output",
        description:
          "A parameter hashtable you can extend with TimeoutSec, MaximumRedirection, or -SslProtocol in one line.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to Invoke-RestMethod",
        body: [
          "PowerShell's Invoke-RestMethod is the REST-native sibling of Invoke-WebRequest: it sends the request and parses the response for you — JSON arrives as objects, not strings — which is why the generated snippet ends with $response | ConvertTo-Json -Depth 10 rather than response-body plumbing. The converter maps your command onto a $params = @{...} hashtable — Uri, Method, Headers, Body, ContentType — and splats it with Invoke-RestMethod @params, the community style that keeps the call readable and trivially extensible with TimeoutSec, RetryCount logic, or session variables.",
          "Method names follow PowerShell's convention (Get, Post, Put, Patch, Delete, Head, Options; custom verbs pass through as written), and the Content-Type header routes into the -ContentType parameter the cmdlet actually consumes, matching how Invoke-RestMethod separates content headers from request headers. A GET with no body emits just Uri and Method — no dead parameters — and query strings survive verbatim in the URL exactly as curl would send them.",
        ],
      },
      {
        heading: "Here-strings, quoting, and the '@' edge case",
        body: [
          "The generated body uses a single-quoted here-string (@' ... '@) — PowerShell's verbatim multi-line literal with no interpolation — so JSON payloads appear exactly as they travel, with $characters and backslashes immune to PowerShell's parser. Header values and the URL use single-quoted strings with apostrophes doubled per PowerShell rules, the same escaping discipline the other generators apply for their languages. The one pathological input — a body containing a line that starts with '@ — falls back to a single-quoted one-line literal so the here-string can never terminate early.",
          "PowerShell's parsing quirk worth knowing when you adapt the snippet: the closing '@ of a here-string must be at the start of a line with nothing before it — which the generated formatting guarantees — and Invoke-RestMethod sends the here-string's bytes untouched, including the leading and trailing newlines the literal adds around your payload. Servers ignore trailing newlines in practice; the pedantically exact can trim inside the hashtable assignment.",
        ],
      },
      {
        heading: "Auth, TLS, and Windows PowerShell 5.1 versus PowerShell 7",
        body: [
          "Basic auth from -u — or credentials embedded in the URL — is base64-encoded at conversion time and emitted as an Authorization header entry in the Headers hashtable, byte-identical to what curl sends with no runtime encoding code in the snippet. Explicit Authorization headers (bearer tokens) pass through untouched, and when both exist the precomputed Basic header is suppressed to avoid sending two credentials. PowerShell's -Authentication Basic -Credential alternative needs a PSCredential object and prompts interactively in some hosts — the header form is the copy-paste-safe one.",
          "The output targets PowerShell 7+ (pwsh) on any OS and works unchanged on Windows PowerShell 5.1 for plain http/https endpoints. The 5.1 caveats live in TLS: older hosts default to TLS 1.0/1.1 and need [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 before the call, and some corporate proxies require -Proxy credentials. PowerShell 7 defaults sensibly and adds -SslProtocol and -SkipCertificateCheck for the -k/--insecure cases curl users ask about — one added hashtable line each.",
        ],
      },
      {
        heading: "From snippet to script: errors, pagination, and reuse",
        body: [
          "Wrap the call in try/catch for production use: Invoke-RestMethod throws on non-2xx (like curl --fail, unlike plain curl), and the catch receives $_.Exception.Response with status code and headers for retry decisions. The splat shape makes the natural next steps one-liners: add TimeoutSec = 30 for curl's --max-time, MaximumRedirection for --max-redirs, and -MaximumRetryCount with -RetryIntervalSec for the retry behavior curl users usually hand-roll.",
          "For repeated calls, lift $params into a function or a configuration file and splat from there; the hashtable composes with PowerShell's parameter binding exactly the way it reads. Response handling is already idiomatic — Invoke-RestMethod returns parsed objects, so $response.items | Where-Object {...} works directly — and ConvertTo-Json -Depth 10 in the snippet exists purely so a raw run prints something readable in the console.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does this converter produce Invoke-WebRequest or Invoke-RestMethod?",
        answer:
          "Invoke-RestMethod — the REST-optimized cmdlet that parses JSON, XML, and form responses into objects automatically. It is the right default for API calls and the closest single-command equivalent to curl's request-plus-body workflow. Invoke-WebRequest remains the tool for raw HTML scraping and full response-object access (status codes, headers, raw content); converting the generated hashtable between the two is a cmdlet-name swap because the parameters match.",
      },
      {
        question: "Is the output for Windows PowerShell 5.1 or PowerShell 7?",
        answer:
          "Both, for standard http/https requests — the generated splat and here-string syntax run unchanged in either. Two 5.1-specific gaps to know: older hosts may need [Net.ServicePointManager]::SecurityProtocol set to TLS 1.2 before the call, and -SslProtocol / -SkipCertificateCheck (the curl -k equivalents) exist only in PowerShell 7. On any OS with pwsh installed, the snippet works as generated.",
      },
      {
        question: "How is basic auth (-u) converted for PowerShell?",
        answer:
          "The user:password pair is base64-encoded during conversion and emitted as an Authorization: Basic entry inside the Headers hashtable — byte-identical to what curl puts on the wire, with zero runtime encoding code to maintain. If your command already carries an Authorization header (a bearer token, for example), it passes through untouched and the generated Basic header is skipped so two credentials never collide.",
      },
      {
        question: "Why is my JSON body in an @'...'@ here-string?",
        answer:
          "Single-quoted here-strings are PowerShell's verbatim literal: nothing interpolates, so $variables, backslashes, and quotes in your payload survive untouched — the same guarantee JSON needs. The alternative (a double-quoted string) would interpolate $tokens and require escaping every quote; the here-string keeps the payload copy-paste-safe and diff-friendly. The closing '@ always sits at the start of its line, exactly as PowerShell requires.",
      },
      {
        question: "How do I add a timeout or retry to the generated command?",
        answer:
          "Add hashtable entries — that is the point of the splat shape. TimeoutSec = 30 reproduces curl's --max-time; -MaximumRetryCount 3 -RetryIntervalSec 2 (switch-style parameters appended after @params) adds bounded retries; MaximumRedirection covers --max-redirs. Because $params is just a hashtable, versioning it in a config file or passing different values per environment is plain PowerShell, not a converter feature.",
      },
      {
        question: "Is my cURL command uploaded anywhere during conversion?",
        answer:
          "No. The converter is a static page that transpiles entirely in your browser — commands with production tokens, cookies, or basic-auth credentials are never transmitted, stored, or logged.",
      },
    ],
  },
  {
    slug: "curl-to-httpie",
    target: "httpie",
    title: "cURL to HTTPie Converter — Idiomatic CLI Commands | SyntaxFiddle",
    heading: "cURL to HTTPie Converter — Idiomatic Terminal Commands",
    description:
      "Convert cURL commands to readable HTTPie commands instantly: JSON bodies become key=value items, headers become Name:value tokens, and basic auth uses --auth. 100% client-side.",
    heroDescription:
      "Paste a cURL command and get the HTTPie equivalent that humans actually enjoy typing: JSON payloads as key=value and key:=value items instead of escaped --data strings, headers as Name:value tokens, -u credentials mapped to --auth, and non-JSON bodies passed verbatim with --raw. Conversion runs entirely in your browser.",
    keywords: [
      "curl to httpie",
      "curl to httpie converter",
      "convert curl to httpie",
      "curl to http",
      "httpie command generator",
      "curl to httpie online",
      "httpie equivalent",
      "translate curl to httpie",
      "httpie syntax converter",
      "curl vs httpie",
    ],
    featureList: [
      "JSON bodies become HTTPie items: key=value for strings, key:=value for numbers, booleans, and nested JSON",
      "Headers as Name:value tokens in the command line, no -H flags",
      "-u basic auth mapped to --auth user:pass",
      "Non-JSON bodies passed verbatim through --raw",
      "GET requests emit the bare http URL form; methods appear only when needed",
    ],
    facts: [
      PRIVACY_FACT,
      SPEED_FACT,
      {
        icon: "terminal" as const,
        title: "Human-readable output",
        description:
          "The command HTTPie users would have written by hand — items, not flags.",
      },
    ],
    sections: [
      {
        heading: "How cURL maps to HTTPie syntax",
        body: [
          "HTTPie's whole reason to exist is that API calls should read like English: http POST api.example.com/todos title=Ship done:=false sends JSON with the right Content-Type — no -X, no -H 'Content-Type: application/json', no shell-escaped --data blob. The converter applies each of those translations: the verb becomes a bare argument (omitted entirely for GET, HTTPie's default), every -H flag becomes a Name:value token, and the URL keeps its query string verbatim.",
          "JSON bodies get the deepest translation. A --data-raw '{\"title\": \"Ship it\", \"done\": false}' becomes title='Ship it' done:=false — strings as key=value items, non-strings (numbers, booleans, null, nested arrays and objects) as key:=value with the JSON preserved. HTTPie assembles the object, sets Content-Type: application/json, and serializes it — which is why the converter drops the Content-Type header when items take over. Any JSON body that is not a flat object of scalars (arrays, deeply nested roots) falls back to --raw, HTTPie's escape hatch for verbatim payloads.",
        ],
      },
      {
        heading: "Auth, forms, and what maps to what",
        body: [
          "Basic auth is a first-class citizen in HTTPie: -u user:pass becomes --auth user:pass, and HTTPie sends the Authorization header without you encoding anything. Bearer tokens stay as header tokens (Authorization:'Bearer ...') because that is the idiomatic HTTPie spelling too. Form data (--data 'a=1&b=2' with the urlencoded content type) maps to --raw or to a=form style depending on shape; HTTPie's = signals form fields just as : signals JSON raw values, and the converter keeps the wire format faithful either way.",
          "The flags that disappear are the point: -X vanishes into the bare verb, -H into tokens, -d into items, -s into nothing (HTTPie colorizes and formats responses by default), and --compressed into HTTPie's transparent gzip handling. Flags with no HTTPie equivalent — curl's intricate --resolve, --connect-to, DNS pinning — have no honest translation and simply do not appear; the generated command is the readable core of your request, not a flag-for-flag simulation.",
        ],
      },
      {
        heading: "Running, downloading, and streaming with HTTPie",
        body: [
          "The generated command is complete terminal syntax: install HTTPie (pip install httpie, brew install httpie, or your package manager), paste, and run. Responses arrive syntax-highlighted with headers and body separated by default — the --verbose curl users reach for is effectively always on. Add --download when the endpoint returns a file (HTTPie shows a progress bar and names the output), and --stream for server-sent events and chunked endpoints where curl users would add -N.",
          "For API exploration, the item syntax compounds nicely after conversion: add query parameters as key==value directly in the command, append --json to force JSON for GETs, and use --offline --print=H to preview the exact request HTTPie would send — the local echo of what you just converted. Sessions (--session=name) persist auth and cookies across calls, replacing curl's cookie-jar flag gymnastics with one readable switch.",
        ],
      },
      {
        heading: "When to stay with curl (and how this tool respects that)",
        body: [
          "curl remains the right tool for scripts that must run everywhere — it ships on effectively every Unix-like box, in every container image, and in CI runners where installing HTTPie is friction. HTTPie shines at the interactive end: exploring an API, debugging a webhook, teaching a teammate a request. Converting between them is not choosing a side; it is moving a request description between the tool that scripted it and the tool that displays it best.",
          "This converter keeps the translation conservative for that reason: nothing is invented, nothing is dropped silently, and the wire semantics — method, URL, headers, body bytes — are preserved exactly. When a construct has no HTTPie form, the output says so rather than approximating. The command you paste out of here behaves like the command you pasted in, just in the syntax designed for humans.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why did my -H 'Content-Type: application/json' disappear?",
        answer:
          "Because HTTPie sets it automatically when JSON items are used. When your body converts to key=value / key:=value items, HTTPie assembles the JSON object and sends the correct Content-Type itself — an explicit header would be redundant. For non-JSON bodies (XML, plain text, arbitrary payloads) the converter keeps all headers and passes the body through --raw verbatim.",
      },
      {
        question: "What is the difference between key=value, key:=value, and key==value?",
        answer:
          "key=value sends a JSON string field, key:=value sends a raw JSON value (number, boolean, null, nested object or array), and key==value appends a URL query parameter. done:=true sends the JSON boolean true while done=true would send the string \"true\" — the := form is how numbers and booleans survive conversion from your curl JSON body intact.",
      },
      {
        question: "How does basic auth (-u) convert to HTTPie?",
        answer:
          "-u user:pass becomes --auth user:pass. HTTPie builds and sends the Authorization: Basic header at runtime — no base64 step for you to manage — and prompts for the password interactively if you omit it after --auth, which is the convenient pattern for terminals (use --auth-type and session persistence for repeated calls). Bearer tokens convert as an Authorization header token, matching idiomatic HTTPie usage.",
      },
      {
        question: "Why does my GET command have no method in it?",
        answer:
          "Because GET is HTTPie's default: http example.com/api is a GET request, and adding the word GET would be noise. The converter omits the method for GET and includes it (POST, PUT, PATCH, DELETE, and anything custom) for every other verb — the same convention HTTPie's own documentation uses. If you prefer the explicit form, adding the method word to the generated command is always safe.",
      },
      {
        question: "What happens to flags like -k, -s, and --compressed?",
        answer:
          "They dissolve into HTTPie's defaults or dedicated flags. -s (silent) maps to nothing because HTTPie formats rather than dumps output; --compressed is handled transparently for gzip responses; -k (insecure TLS) has --verify=no in HTTPie when you truly need it — the converter leaves TLS verification on, the safe default, and the flag is a one-token addition if your environment requires it.",
      },
      {
        question: "Is my cURL command uploaded anywhere during conversion?",
        answer:
          "No. The page is static and the transpiler runs entirely in your browser — commands containing tokens, cookies, or credentials never leave your machine.",
      },
    ],
  },
];

export function getCurlSeoTarget(slug: string): CurlSeoTarget | undefined {
  return CURL_SEO_TARGETS.find((target) => target.slug === slug);
}

export const CURL_TARGET_SLUGS: string[] = CURL_SEO_TARGETS.map((target) => target.slug);
