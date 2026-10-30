/**
 * Blog featured-image generator.
 *
 * Renders the branded SVG diagrams for content/blog posts to WebP files
 * under public/blog/<slug>/ (1600×900). The site statically exports with no
 * image server, so figures are committed as optimized WebP — this script
 * regenerates them deterministically whenever a diagram changes.
 *
 *   npm run blog:images
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 1600;
const H = 900;

const SANS = "-apple-system, Helvetica, Arial, sans-serif";
const MONO = "Menlo, Monaco, Courier New, monospace";

function chrome(title, subtitle) {
  return `
  <rect x="0" y="0" width="${W}" height="${H}" fill="#09090b"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#10b981"/>
  <text x="72" y="100" font-family="${SANS}" font-size="46" font-weight="700" fill="#fafafa">${title}</text>
  <text x="72" y="144" font-family="${SANS}" font-size="25" fill="#a1a1aa">${subtitle}</text>
  <text x="72" y="${H - 46}" font-family="${SANS}" font-size="22" fill="#52525b">syntaxfiddle.com — 100% client-side dev utilities</text>`;
}

/* 1. Cron syntax — five labeled fields + step-value callout + macros panel */
function cronDiagram() {
  const fields = [
    { value: "*/5", name: "minute", range: "0–59", hot: true },
    { value: "*", name: "hour", range: "0–23" },
    { value: "*", name: "day of month", range: "1–31" },
    { value: "*", name: "month", range: "1–12" },
    { value: "*", name: "day of week", range: "0–7  Sun=0" },
  ];
  const boxes = fields
    .map((field, index) => {
      const x = 72 + index * 190;
      const border = field.hot ? "#10b981" : "#27272a";
      const fill = field.hot ? "#064e3b" : "#18181b";
      const valueColor = field.hot ? "#34d399" : "#e4e4e7";
      return `
  <rect x="${x}" y="220" width="150" height="100" rx="14" fill="${fill}" stroke="${border}" stroke-width="${field.hot ? 4 : 2}"/>
  <text x="${x + 75}" y="284" font-family="${MONO}" font-size="40" font-weight="700" fill="${valueColor}" text-anchor="middle">${field.value}</text>
  <text x="${x + 75}" y="360" font-family="${SANS}" font-size="24" font-weight="600" fill="#e4e4e7" text-anchor="middle">${field.name}</text>
  <text x="${x + 75}" y="388" font-family="${SANS}" font-size="20" fill="#71717a" text-anchor="middle">${field.range}</text>`;
    })
    .join("");

  const macros = [
    ["@yearly", "Jan 1, 00:00"],
    ["@monthly", "1st, 00:00"],
    ["@weekly", "Sun 00:00"],
    ["@daily", "00:00 daily"],
    ["@hourly", "top of hour"],
    ["@reboot", "on daemon start"],
  ]
    .map(
      ([macro, meaning], index) => `
  <text x="1090" y="${300 + index * 52}" font-family="${MONO}" font-size="25" font-weight="700" fill="#34d399">${macro}</text>
  <text x="1300" y="${300 + index * 52}" font-family="${SANS}" font-size="23" fill="#a1a1aa">${meaning}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "Cron Expression Syntax",
    "The five fields of a schedule expression, left to right",
  )}
  ${boxes}
  <text x="72" y="470" font-family="${SANS}" font-size="24" fill="#34d399">*/5 = every 5 minutes — a step modifier applied to the minute range</text>
  <text x="72" y="560" font-family="${SANS}" font-size="26" font-weight="600" fill="#e4e4e7">Special characters</text>
  <text x="72" y="606" font-family="${MONO}" font-size="25" fill="#a1a1aa"><tspan fill="#34d399">  *  </tspan>any value      <tspan fill="#34d399">,  </tspan>value list      <tspan fill="#34d399">-  </tspan>range      <tspan fill="#34d399">/  </tspan>step</text>
  <rect x="1060" y="210" width="468" height="360" rx="16" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="1090" y="258" font-family="${SANS}" font-size="26" font-weight="600" fill="#e4e4e7">Shortcut macros</text>
  ${macros}
  </svg>`;
}

/* 2. cURL → fetch flag mapping */
function curlDiagram() {
  const rows = [
    ['-H "Auth: Bearer tok"', 'headers: { Auth: "Bearer tok" }'],
    ["-d '{\"name\": \"Ada\"}'", "body: JSON.stringify({ name: \"Ada\" })"],
    ["-X POST", 'method: "POST"'],
    ["-u user:pass", 'Authorization: "Basic " + btoa(...)'],
    ["--max-time 10", "AbortSignal.timeout(10_000)"],
  ];
  const rowSvg = rows
    .map(
      ([curl, fetchOption], index) => `
  <rect x="72" y="${210 + index * 104}" width="640" height="76" rx="12" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="96" y="${258 + index * 104}" font-family="${MONO}" font-size="24" fill="#34d399">${curl}</text>
  <text x="762" y="${258 + index * 104}" font-family="${SANS}" font-size="30" fill="#10b981">→</text>
  <rect x="820" y="${210 + index * 104}" width="708" height="76" rx="12" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="844" y="${258 + index * 104}" font-family="${MONO}" font-size="24" fill="#e4e4e7">${fetchOption}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "cURL → fetch() Mapping",
    "Every common cURL flag has a direct JavaScript fetch() equivalent",
  )}
  ${rowSvg}
  </svg>`;
}

/* 3. CSV row → escaped SQL INSERT */
function csvDiagram() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "CSV Row → SQL INSERT",
    "Escaping, quoting, and batching during conversion",
  )}
  <rect x="72" y="190" width="1456" height="150" rx="16" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="100" y="252" font-family="${MONO}" font-size="26" fill="#71717a">id,name,hire_date,salary</text>
  <text x="100" y="300" font-family="${MONO}" font-size="26" fill="#e4e4e7">1,"O'Brien, Ada",2024-03-14,152000.50</text>
  <text x="800" y="382" font-family="${SANS}" font-size="26" fill="#34d399" text-anchor="middle">convert · escape · batch ↓</text>
  <rect x="72" y="420" width="1456" height="240" rx="16" fill="#18181b" stroke="#10b981" stroke-opacity="0.35" stroke-width="2"/>
  <text x="100" y="478" font-family="${MONO}" font-size="26" fill="#a1a1aa">INSERT INTO employees (id, name, hire_date, salary) VALUES</text>
  <text x="100" y="530" font-family="${MONO}" font-size="26" fill="#e4e4e7">  (1, <tspan fill="#34d399" font-weight="700">'O''Brien, Ada'</tspan>, <tspan fill="#60a5fa">'2024-03-14'</tspan>, <tspan fill="#f59e0b">152000.50</tspan>),</text>
  <text x="100" y="582" font-family="${MONO}" font-size="26" fill="#e4e4e7">  (2, 'Linus T.', '2023-11-01', <tspan fill="#f59e0b">143000</tspan>);</text>
  <text x="100" y="710" font-family="${SANS}" font-size="22" fill="#71717a">  <tspan fill="#34d399">'O''Brien, Ada'</tspan> apostrophe doubled      <tspan fill="#60a5fa">'2024-03-14'</tspan> ISO date quoted      <tspan fill="#f59e0b">152000.50</tspan> numeric, unquoted</text>
  <text x="72" y="790" font-family="${SANS}" font-size="25" fill="#e4e4e7">Multi-row VALUES batches load 10–100× faster than one INSERT per row.</text>
  </svg>`;
}

/* 4. JSON → Zod → TypeScript flow */
function zodDiagram() {
  const panel = (x, header, lines) => `
  <rect x="${x}" y="220" width="410" height="380" rx="16" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <rect x="${x}" y="220" width="8" height="380" rx="4" fill="#10b981"/>
  <text x="${x + 32}" y="268" font-family="${SANS}" font-size="24" font-weight="600" fill="#71717a">${header}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="${x + 32}" y="${326 + index * 46}" font-family="${MONO}" font-size="23" fill="#e4e4e7">${line}</text>`,
    )
    .join("")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "JSON → Zod → TypeScript",
    "One payload, one source of truth for runtime validation and static types",
  )}
  ${panel(
    72,
    "JSON payload",
    [
      '{',
      '  "id": "usr_2048",',
      '  "verified": true,',
      '  "roles": ["admin"]',
      '}',
    ],
  )}
  <text x="516" y="425" font-family="${SANS}" font-size="34" fill="#10b981">→</text>
  <text x="516" y="466" font-family="${SANS}" font-size="21" fill="#34d399" text-anchor="middle">generate</text>
  ${panel(
    585,
    "Zod schema",
    [
      "z.object({",
      "  id: z.string(),",
      "  verified: z.boolean(),",
      "  roles: z.array(z.string()),",
      "})",
    ],
  )}
  <text x="1029" y="425" font-family="${SANS}" font-size="34" fill="#10b981">→</text>
  <text x="1029" y="466" font-family="${SANS}" font-size="21" fill="#34d399" text-anchor="middle">z.infer</text>
  ${panel(
    1098,
    "TypeScript",
    [
      "type User = {",
      "  id: string;",
      "  verified: boolean;",
      "  roles: string[];",
      "}",
    ],
  )}
  <text x="72" y="700" font-family="${SANS}" font-size="25" fill="#a1a1aa"><tspan fill="#34d399">.optional()</tspan> when a key is missing      <tspan fill="#34d399">.nullable()</tspan> when a value is null</text>
  </svg>`;
}

/* 5. JSON → Salesforce Apex wrapper class flow */
function apexDiagram() {
  const panel = (x, header, lines) => `
  <rect x="${x}" y="220" width="410" height="380" rx="16" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <rect x="${x}" y="220" width="8" height="380" rx="4" fill="#10b981"/>
  <text x="${x + 32}" y="268" font-family="${SANS}" font-size="24" font-weight="600" fill="#71717a">${header}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="${x + 32}" y="${322 + index * 44}" font-family="${MONO}" font-size="22" fill="#e4e4e7">${line}</text>`,
    )
    .join("")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "JSON → Apex Wrapper Class",
    "Generate strongly-typed Salesforce Apex from any payload — in your browser",
  )}
  ${panel(
    72,
    "JSON payload",
    [
      "{",
      '  "orderId": "8015g0…",',
      '  "account": { … },',
      '  "lineItems": [ … ],',
      '  "currency": "USD"',
      "}",
    ],
  )}
  <text x="516" y="415" font-family="${SANS}" font-size="34" fill="#10b981">→</text>
  <text x="516" y="456" font-family="${SANS}" font-size="21" fill="#34d399" text-anchor="middle">generate</text>
  ${panel(
    585,
    "Apex wrapper",
    [
      "public class OrderWrapper {",
      "  @AuraEnabled",
      "  public String orderId;",
      "  …",
      "  public static OrderWrapper",
      "    parse(String json)",
      "}",
    ],
  )}
  <text x="1029" y="415" font-family="${SANS}" font-size="34" fill="#10b981">→</text>
  <text x="1029" y="456" font-family="${SANS}" font-size="21" fill="#34d399" text-anchor="middle">deserialize</text>
  ${panel(
    1098,
    "Usage",
    [
      "OrderWrapper order =",
      "  (OrderWrapper)",
      "  JSON.deserialize(",
      "    json,",
      "    OrderWrapper.class);",
    ],
  )}
  <text x="72" y="688" font-family="${SANS}" font-size="24" fill="#a1a1aa">Reserved words sanitized automatically — <tspan fill="#34d399">currency</tspan> becomes <tspan fill="#34d399">currencyX</tspan> so the class compiles</text>
  <text x="72" y="730" font-family="${SANS}" font-size="24" fill="#a1a1aa">100% in-browser · zero upload · zero logging — <tspan fill="#34d399">syntaxfiddle.com/json-to-apex/</tspan></text>
  </svg>`;
}

const IMAGES = [
  {
    slug: "cron-expressions-explained",
    file: "cron-syntax-diagram.webp",
    svg: cronDiagram(),
  },
  { slug: "curl-to-fetch-guide", file: "curl-to-fetch-mapping.webp", svg: curlDiagram() },
  {
    slug: "csv-to-sql-insert-statements",
    file: "csv-to-sql-transformation.webp",
    svg: csvDiagram(),
  },
  { slug: "json-to-zod-guide", file: "json-to-zod-flow.webp", svg: zodDiagram() },
  { slug: "json-to-apex-guide", file: "json-to-apex-flow.webp", svg: apexDiagram() },
];

for (const { slug, file, svg } of IMAGES) {
  // Staggered publishing: skip diagrams for posts still in content/blog/drafts/
  // so unpublished assets never ship in public/.
  if (!existsSync(path.join(process.cwd(), "content", "blog", `${slug}.mdx`))) {
    console.log(`skipped ${slug} (post is in drafts/)`);
    continue;
  }
  const dir = path.join(process.cwd(), "public", "blog", slug);
  await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, file);
  await sharp(Buffer.from(svg)).webp({ quality: 92 }).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  console.log(`wrote public/blog/${slug}/${file}  ${meta.width}x${meta.height}  ${meta.format}`);
}
