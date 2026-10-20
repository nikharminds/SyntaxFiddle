# SyntaxFiddle

Enterprise-grade, 100% client-side developer utility platform. Built with Next.js (static export), React 19, and Tailwind CSS. No backend, no accounts, no data logged — every tool runs entirely in your browser, with heavy parsing offloaded to Web Workers.

**Live:** [syntaxfiddle.com](https://syntaxfiddle.com)

## Tools

| Tool | Description |
| --- | --- |
| [Cron Visualizer](https://syntaxfiddle.com/cron/) | Parse, explain, and simulate cron schedules in plain English. Supports Unix, Quartz, AWS EventBridge, and Cloudflare dialects with next-run previews. |
| [CSV & Excel Converter](https://syntaxfiddle.com/csv/) | Convert spreadsheets to typed SQL INSERTs, clean JSON, Salesforce SOQL IN clauses, or XML — with delimiter sniffing and column type inference. |
| [Regex Tester](https://syntaxfiddle.com/regex/) | Interactive regular expression playground with live match highlighting. |
| [JWT Decoder](https://syntaxfiddle.com/jwt/) | Decode and inspect JSON Web Tokens, header/payload/signature breakdown. |

## Getting started

Requires Node.js 18.18+.

```bash
npm install
npm run dev        # start dev server at http://localhost:3000
```

## Available scripts

```bash
npm run dev        # Next.js dev server
npm run build      # production static export to ./out
npm run typecheck  # TypeScript, no emit
npm run test       # vitest unit tests
npm run preview    # serve the static export locally
npm run deploy     # deploy ./out to Cloudflare Pages
```

## Tech stack

- **Next.js 15** with `output: "export"` — fully static, hostable anywhere
- **React 19** + **TypeScript**
- **Tailwind CSS 3** with `@tailwindcss/typography`
- **Web Workers** for converter and regex processing off the main thread
- Libraries: `cronstrue`, `cron-parser`, `papaparse`, `xlsx`, `lucide-react`

## Project structure

```
app/          # Next.js App Router pages (one folder per tool)
components/   # UI, converter, cron, jwt, regex, ads components
hooks/        # React hooks (converter, JWT, regex state)
lib/          # Core logic, tool registry, site config, tests
workers/      # Web Workers for heavy parsing
public/       # Static assets, _headers, _redirects, robots.txt
```

## Deployment

The site is a static export deployed to Cloudflare Pages:

```bash
npm run build
npm run deploy   # npx wrangler pages deploy out --project-name syntaxfiddle
```

Set `NEXT_PUBLIC_SITE_URL` to override the canonical site URL at build time.

## Privacy

All processing happens locally in the browser. No input data, telemetry, or personal information is transmitted or logged.

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/my-tool`).
2. Make your changes; add tests in `lib/__tests__/` for new logic.
3. Run `npm run typecheck && npm run test` before opening a PR.

## License

Released under the [MIT License](LICENSE).
