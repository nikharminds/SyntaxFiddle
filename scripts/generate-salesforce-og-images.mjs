/**
 * OG / social-card image generator for the Salesforce tool cluster.
 *
 * Renders branded SVG cards to 1200×630 JPGs under public/og/ — the exact
 * dimensions Open Graph and Twitter cards expect. Uses the same chrome
 * template as scripts/generate-blog-images.mjs so every share card on the
 * site reads as one family. Regenerate deterministically after changes:
 *
 *   node scripts/generate-salesforce-og-images.mjs
 */
import path from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 630;

const SANS = "-apple-system, Helvetica, Arial, sans-serif";
const MONO = "Menlo, Monaco, Courier New, monospace";

/** Identical chrome to the blog diagram generator — the house card style. */
function chrome(title, subtitle) {
  return `
  <rect x="0" y="0" width="${W}" height="${H}" fill="#09090b"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#10b981"/>
  <text x="64" y="100" font-family="${SANS}" font-size="46" font-weight="700" fill="#fafafa">${title}</text>
  <text x="64" y="144" font-family="${SANS}" font-size="25" fill="#a1a1aa">${subtitle}</text>
  <text x="64" y="${H - 46}" font-family="${SANS}" font-size="22" fill="#52525b">syntaxfiddle.com — 100% client-side dev utilities</text>`;
}

/* 1. Debug Log Analyzer — mock log panel + two finding chips below it.
 *
 * Column geometry is chosen against conservative monospace metrics
 * (~0.6em/char at 20px ≈ 12px per char) so no line can escape the panel:
 *   time  x=96  (≤ 21 chars → ends ≈348)   panel spans x 64…1136
 *   event x=380 (≤ 21 chars → ends ≈632)
 *   rest  x=690 (≤ 22 chars → ends ≈954)
 */
function debugLogCard() {
  const lines = [
    ["12:31:07.0 (11598292)", "SOQL_EXECUTE_BEGIN[9]", "SELECT Id FROM Account", "#a1a1aa"],
    ["12:31:07.0 (12391154)", "SOQL_EXECUTE_END[9]", "Rows:42", "#a1a1aa"],
    ["12:31:07.0 (16881143)", "DML_BEGIN[12]", "Contact · 9,500 rows", "#fbbf24"],
    ["12:31:07.2 (39075687)", "LIMIT_USAGE_FOR_NS", "9,501 / 10,000 · 95%", "#f87171"],
    ["12:31:07.2 (39127512)", "EXECUTION_FINISHED", "wall time 41.3 s", "#71717a"],
  ]
    .map(
      ([time, event, rest, color], index) => `
  <text x="96" y="${232 + index * 50}" font-family="${MONO}" font-size="20" fill="#52525b">${time}</text>
  <text x="380" y="${232 + index * 50}" font-family="${MONO}" font-size="20" font-weight="700" fill="${color}">${event}</text>
  <text x="690" y="${232 + index * 50}" font-family="${MONO}" font-size="20" fill="${color === "#a1a1aa" ? "#71717a" : color}">${rest}</text>`,
    )
    .join("");

  const chips = [
    {
      x: 64,
      width: 500,
      stroke: "#fbbf24",
      text: "⚠ N+1 detected — same query shape ran 3×",
      color: "#fbbf24",
    },
    {
      x: 592,
      width: 500,
      stroke: "#f87171",
      text: "DML rows 9,501 / 10,000 — CLOSE TO LIMIT",
      color: "#f87171",
    },
  ]
    .map(
      (chip) => `
  <rect x="${chip.x}" y="488" width="${chip.width}" height="46" rx="10" fill="#18181b" stroke="${chip.stroke}" stroke-width="2"/>
  <text x="${chip.x + 22}" y="518" font-family="${SANS}" font-size="21" font-weight="600" fill="${chip.color}">${chip.text}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "Salesforce Debug Log Analyzer",
    "N+1 detection · governor limits · exceptions &amp; stack traces",
  )}
  <rect x="64" y="170" width="1072" height="300" rx="16" fill="#101012" stroke="#27272a" stroke-width="2"/>
  ${lines}
  ${chips}
  </svg>`;
}

/* 2. Salesforce tools hub — six equal tool chips, no favoritism. */
function hubCard() {
  const tools = [
    "Debug Log Analyzer",
    "SOQL Formatter",
    "JSON to Apex",
    "CSV to SOQL",
    "Excel to SOQL",
    "cURL to Apex",
  ];
  const boxes = tools
    .map((label, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 64 + column * 366;
      const y = 240 + row * 146;
      return `
  <rect x="${x}" y="${y}" width="340" height="110" rx="14" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="${x + 24}" y="${y + 46}" font-family="${SANS}" font-size="25" font-weight="700" fill="#e4e4e7">${label}</text>
  <text x="${x + 24}" y="${y + 78}" font-family="${SANS}" font-size="18" fill="#71717a">free · online · client-side</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "Salesforce Developer Tools",
    "Six free tools — no org login, nothing ever uploaded",
  )}
  ${boxes}
  </svg>`;
}

const IMAGES = [
  { file: "salesforce-debug-log-analyzer.jpg", svg: debugLogCard() },
  { file: "salesforce.jpg", svg: hubCard() },
];

for (const { file, svg } of IMAGES) {
  const outPath = path.join(process.cwd(), "public", "og", file);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  console.log(`wrote public/og/${file}  ${meta.width}x${meta.height}  ${meta.format}`);
}
