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

/** Identical chrome to the blog diagram generator — the house card style.
 * Footer baseline sits at H-40 so content above (chips end ≈544) keeps a
 * ~30px clear gap above the domain line, with 35px below it.
 */
function chrome(title, subtitle) {
  return `
  <rect x="0" y="0" width="${W}" height="${H}" fill="#09090b"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#10b981"/>
  <text x="64" y="100" font-family="${SANS}" font-size="46" font-weight="700" fill="#fafafa">${title}</text>
  <text x="64" y="144" font-family="${SANS}" font-size="25" fill="#a1a1aa">${subtitle}</text>
  <text x="64" y="${H - 40}" font-family="${SANS}" font-size="22" fill="#52525b">syntaxfiddle.com — 100% client-side dev utilities</text>`;
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

/* 2. Salesforce tools hub — every tool as an equal chip, no favoritism.
 *
 * Three rows of chips must end well above the domain footer line (baseline
 * y=584, visual top ≈568): rows at y=180/310/440 with 104px-tall boxes end
 * at y=544, leaving ~24px of clear padding above the footer text.
 */
function hubCard() {
  const tools = [
    "Debug Log Analyzer",
    "SOQL Formatter",
    "JSON to Apex",
    "ID Converter",
    "Cron Builder",
    "CSV to SOQL",
    "Excel to SOQL",
    "cURL to Apex",
  ];
  const boxes = tools
    .map((label, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 64 + column * 366;
      const y = 180 + row * 130;
      return `
  <rect x="${x}" y="${y}" width="340" height="104" rx="14" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="${x + 24}" y="${y + 44}" font-family="${SANS}" font-size="25" font-weight="700" fill="#e4e4e7">${label}</text>
  <text x="${x + 24}" y="${y + 76}" font-family="${SANS}" font-size="18" fill="#71717a">free · online · client-side</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "Salesforce Developer Tools",
    "Eight free tools — no org login, nothing ever uploaded",
  )}
  ${boxes}
  </svg>`;
}

/* 3. ID Converter — a 15-char Id flowing into its case-safe 18-char form,
 * with three object-prefix chips underneath.
 */
function idConverterCard() {
  const chips = [
    { x: 64, text: "001 → Account", stroke: "#10b981" },
    { x: 438, text: "003 → Contact", stroke: "#3f3f46" },
    { x: 812, text: "500 → Case", stroke: "#3f3f46" },
  ]
    .map(
      (chip) => `
  <rect x="${chip.x}" y="488" width="324" height="46" rx="10" fill="#18181b" stroke="${chip.stroke}" stroke-width="2"/>
  <text x="${chip.x + 22}" y="518" font-family="${MONO}" font-size="20" fill="#a1a1aa">${chip.text}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "Salesforce ID Converter",
    "15 → 18 character record Ids · case-safe · bulk mode",
  )}
  <rect x="64" y="170" width="1072" height="290" rx="16" fill="#101012" stroke="#27272a" stroke-width="2"/>
  <text x="96" y="240" font-family="${SANS}" font-size="20" fill="#71717a">15-character (case-sensitive)</text>
  <text x="96" y="284" font-family="${MONO}" font-size="30" font-weight="700" fill="#e4e4e7">0033000001QyXb5</text>
  <path d="M 600 268 L 668 268 M 648 248 L 672 268 L 648 288" stroke="#10b981" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="700" y="240" font-family="${SANS}" font-size="20" fill="#71717a">18-character (case-safe)</text>
  <text x="700" y="284" font-family="${MONO}" font-size="30" font-weight="700" fill="#10b981">0033000001QyXb5<tspan fill="#fafafa">AAF</tspan></text>
  <text x="96" y="356" font-family="${SANS}" font-size="19" fill="#52525b">Checksum verified · Excel &amp; Apex recipes included · nothing uploaded</text>
  ${chips}
  </svg>`;
}

/* 4. Salesforce cron landing — a System.schedule expression front and center. */
function salesforceCronCard() {
  const chips = [
    { x: 64, text: "6 fields + optional year", stroke: "#10b981" },
    { x: 500, text: "Apex System.schedule ready", stroke: "#3f3f46" },
    { x: 936, text: "1 = SUN", stroke: "#3f3f46" },
  ]
    .map(
      (chip) => `
  <rect x="${chip.x}" y="488" width="${chip.text.length * 12 + 44}" height="46" rx="10" fill="#18181b" stroke="${chip.stroke}" stroke-width="2"/>
  <text x="${chip.x + 22}" y="518" font-family="${SANS}" font-size="20" fill="#a1a1aa">${chip.text}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(
    "Salesforce Cron Expression Builder",
    "System.schedule · seconds-first · timezone-true run preview",
  )}
  <rect x="64" y="170" width="1072" height="290" rx="16" fill="#101012" stroke="#27272a" stroke-width="2"/>
  <text x="96" y="228" font-family="${SANS}" font-size="20" fill="#71717a">Every 5 minutes, in System.schedule form:</text>
  <text x="96" y="296" font-family="${MONO}" font-size="46" font-weight="700" fill="#10b981">0 0/5 * * * ?</text>
  <text x="96" y="352" font-family="${SANS}" font-size="21" fill="#a1a1aa">Live next-run preview · plain-English output · copy-paste Apex</text>
  <text x="96" y="398" font-family="${MONO}" font-size="20" fill="#52525b">System.schedule('My Job', '0 0/5 * * * ?', new MySchedulable());</text>
  ${chips}
  </svg>`;
}

const IMAGES = [
  { file: "salesforce-debug-log-analyzer.jpg", svg: debugLogCard() },
  { file: "salesforce-id-converter.jpg", svg: idConverterCard() },
  { file: "salesforce-cron.jpg", svg: salesforceCronCard() },
  { file: "salesforce.jpg", svg: hubCard() },
];

for (const { file, svg } of IMAGES) {
  const outPath = path.join(process.cwd(), "public", "og", file);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  console.log(`wrote public/og/${file}  ${meta.width}x${meta.height}  ${meta.format}`);
}
