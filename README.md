<div align="center">

<img src="public/og/site.jpg" alt="SyntaxFiddle — free, open-source developer tools that run 100% in your browser" width="800">

# SyntaxFiddle

**Free, open-source developer tools that run entirely in your browser.**
No accounts · No servers · No telemetry — 0 bytes of your input ever leave the tab.

[![Live site](https://img.shields.io/badge/Live-syntaxfiddle.com-10b981?style=flat-square)](https://syntaxfiddle.com)
[![CI](https://github.com/nikharminds/SyntaxFiddle/actions/workflows/ci.yml/badge.svg?style=flat-square)](https://github.com/nikharminds/SyntaxFiddle/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-8b5cf6?style=flat-square)](CONTRIBUTING.md)

**👉 Use the tools at [syntaxfiddle.com](https://syntaxfiddle.com)**

</div>

---

Most web-based developer tools quietly ship your input to a backend: you paste a cron
schedule or a customer CSV, the browser POSTs it to an API, and copies land in logs you
will never audit. SyntaxFiddle eliminates that entire class of risk through architecture —
it is a fully static application where every parser, converter, and simulator executes
inside your browser tab.

You can verify this yourself: open your browser's network panel and watch it after a page
loads. Nothing is ever sent. This makes SyntaxFiddle safe for production crontabs,
customer exports, internal schedules, and live auth tokens.

## Tools

| Tool | What it does |
| --- | --- |
| [Cron Expression Tester & Generator](https://syntaxfiddle.com/cron/) | Parse, explain, and simulate cron schedules across **Unix, Quartz, AWS EventBridge, and Cloudflare** dialects — plain-English translation, run timeline, timezone-aware next runs, and 100+ [ready-made cron recipes](https://syntaxfiddle.com/cron/every-5-minutes/). |
| [CSV & Excel Converter](https://syntaxfiddle.com/csv/) | Convert spreadsheets to typed SQL INSERT statements, clean JSON, Salesforce SOQL `IN` clauses, or XML — with delimiter sniffing and column type inference. |
| [cURL Converter](https://syntaxfiddle.com/curl-converter/) | Transpile cURL commands to idiomatic [fetch](https://syntaxfiddle.com/curl-to-fetch/), [axios](https://syntaxfiddle.com/curl-to-axios/), [Python requests](https://syntaxfiddle.com/curl-to-python/), [PHP](https://syntaxfiddle.com/curl-to-php/), [Go](https://syntaxfiddle.com/curl-to-go/), [C#](https://syntaxfiddle.com/curl-to-csharp/), [Java](https://syntaxfiddle.com/curl-to-java/), and [Salesforce Apex](https://syntaxfiddle.com/curl-to-apex/). Headers, JSON bodies, basic auth included. |
| [Regex Tester](https://syntaxfiddle.com/regex/) | Evaluate patterns with live match highlighting, capture groups, and flags — sandboxed in a Web Worker with ReDoS protection. |
| [JWT Decoder](https://syntaxfiddle.com/jwt/) | Inspect JSON Web Tokens locally: color-coded segments, syntax-highlighted claims, and expiry checks. Decode-only, zero network calls. |
| [JSON to Schema Converter](https://syntaxfiddle.com/json-to-schema/) | Infer types from raw JSON into [Zod](https://syntaxfiddle.com/json-to-zod/), [TypeScript](https://syntaxfiddle.com/json-to-typescript/), [Pydantic](https://syntaxfiddle.com/json-to-pydantic/), and [Go structs](https://syntaxfiddle.com/json-to-go-struct/). |

## How it works

- **Static export, zero backend** — every page is pre-rendered HTML at build time (`next build` → `./out`), served from any CDN edge. No cold starts, no server round trips, nothing to attack.
- **Deterministic TypeScript engines** — the cron engine (4 dialects), CSV/Excel parser, cURL transpiler, and JSON type-inferrer are hand-written, code-split per route, and covered by **235+ unit tests**.
- **Web Workers for heavy lifting** — regex evaluation and file conversion run off the main thread, with ReDoS protection on pattern input.
- **Privacy by architecture, not by policy** — we cannot log what we never receive.

## Quick start

Requires Node.js 18.18+.

```bash
git clone https://github.com/nikharminds/SyntaxFiddle.git
cd SyntaxFiddle
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # static export to ./out
npm run typecheck    # TypeScript, no emit
npm run test         # vitest unit tests
npm run preview      # serve ./out locally
```

## Self-hosting

The entire site is a static folder — host it anywhere: Cloudflare Pages, GitHub Pages,
Netlify, S3, or your own nginx.

```bash
npm run build
npx serve out        # or deploy ./out to any static host
```

Optional build-time environment variables (both have safe defaults):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used in sitemap, canonicals, OG tags) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID — omit for a fully script-free build |

## Project structure

```
app/           # Next.js App Router — one folder per tool, statically exported
components/    # UI primitives + per-tool components (cron, converter, regex, JWT, ads)
hooks/         # React hooks for tool state
lib/           # Core logic: cron engine & recipes, cURL transpiler, converters, tests
workers/       # Web Workers for heavy parsing
public/        # Static assets, robots.txt, OG images
tests/         # Integration tests
```

## Contributing

Contributions are welcome — especially **new cron dialects** (Salesforce `System.schedule`
is on the [roadmap](https://github.com/nikharminds/SyntaxFiddle/issues)), **new cron
recipes**, and **new conversion targets**. Adding a recipe takes one line of data; the
page, FAQ, schema markup, and sitemap entry are generated automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the guide, and look for
[`good first issue`](https://github.com/nikharminds/SyntaxFiddle/labels/good%20first%20issue)
labels. Hacktoberfest PRs are welcome.

## Security & privacy

All processing happens locally in the browser. No input data, telemetry, or personal
information is transmitted or logged. Found a vulnerability? See
[SECURITY.md](SECURITY.md) for responsible disclosure.

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

**If SyntaxFiddle saved you a round-trip to a sketchy server-backed tool, ⭐ star the repo — it helps other developers find it.**

[Use the tools →](https://syntaxfiddle.com)

</div>
