import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Clock,
  Cloud,
  Database,
  FileCode2,
  FileJson,
  FileSpreadsheet,
  KeyRound,
  SquareTerminal,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";
import { CURL_SEO_TARGETS } from "@/lib/curl/seo-targets";
import { JSON_SCHEMA_SEO_TARGETS } from "@/lib/json-schema/seo-targets";
import { XML_SCHEMA_SEO_TARGETS } from "@/lib/xml-schema/seo-targets";
import { SITE_URL } from "@/lib/site";

interface DirectoryLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hubs get the emerald treatment, mirroring the homepage's featured card. */
  hub?: boolean;
}

/**
 * Every tool on SyntaxFiddle, one directory, grouped by category. Registry
 * driven wherever a registry exists so new entries appear automatically.
 * Card styling mirrors the homepage ToolGrid (icon square + emerald hover).
 */

const CORE_TOOLS: DirectoryLink[] = [
  { href: "/cron/", label: "Cron Expression Tester & Generator", icon: Clock, hub: true },
  { href: "/regex-tester/", label: "Regex Tester & Debugger", icon: Braces },
  { href: "/jwt-decoder/", label: "JWT Decoder", icon: KeyRound },
];

/** Conversion Studio pairs, grouped by source format (registry order). */
function conversionGroups(): {
  label: string;
  icon: LucideIcon;
  links: DirectoryLink[];
}[] {
  const SOURCE_ICONS: Record<string, LucideIcon> = {
    csv: Table2,
    excel: FileSpreadsheet,
    json: FileJson,
    sql: Database,
    xml: FileCode2,
  };
  const sources = [...new Set(CONVERSION_PAIRS.map((pair) => pair.source))];
  return sources.map((source) => {
    const pairs = CONVERSION_PAIRS.filter((pair) => pair.source === source);
    const sourceLabel = pairs[0]?.sourceLabel ?? source;
    const icon = SOURCE_ICONS[source] ?? FileCode2;
    return {
      label: `From ${sourceLabel}`,
      icon,
      links: pairs.map((pair) => ({
        href: `/${pair.slug}/`,
        label: `${pair.sourceLabel} to ${pair.targetLabel}`,
        icon,
      })),
    };
  });
}

const STUDIO_HUB: DirectoryLink = {
  href: "/csv/",
  label: "Conversion Studio — All-in-One Workspace",
  icon: Table2,
  hub: true,
};

const CURL_TOOLS_LINKS: DirectoryLink[] = [
  { href: "/curl-converter/", label: "cURL Converter — Hub (All 10 Targets)", icon: SquareTerminal, hub: true },
  ...CURL_SEO_TARGETS.filter((target) => target.slug !== "curl-converter").map(
    (target) => ({
      href: `/${target.slug}/`,
      label: target.heading.split("—")[0]?.trim() ?? target.slug,
      icon: SquareTerminal as LucideIcon,
    }),
  ),
  { href: "/tools/curl-to-javascript-fetch/", label: "cURL to JavaScript fetch()", icon: SquareTerminal },
  { href: "/tools/curl-to-python-requests/", label: "cURL to Python requests", icon: SquareTerminal },
  { href: "/tools/curl-to-salesforce-apex/", label: "cURL to Salesforce Apex", icon: SquareTerminal },
];

const JSON_SCHEMA_LINKS: DirectoryLink[] = [
  { href: "/json-to-schema/", label: "JSON to Schema — Hub", icon: FileJson, hub: true },
  { href: "/tools/json-to-zod/", label: "JSON to Zod", icon: FileJson },
  ...JSON_SCHEMA_SEO_TARGETS.map((target) => ({
    href: `/${target.slug}/`,
    label: target.heading.split("—")[0]?.trim() ?? target.slug,
    icon: FileJson as LucideIcon,
  })),
  { href: "/tools/json-to-pydantic/", label: "JSON to Pydantic", icon: FileJson },
];

const XML_SCHEMA_LINKS: DirectoryLink[] = [
  { href: "/xml-to-schema/", label: "XML to Schema — Hub", icon: FileCode2, hub: true },
  ...XML_SCHEMA_SEO_TARGETS.map((target) => ({
    href: `/${target.slug}/`,
    label: target.heading.split("—")[0]?.trim() ?? target.slug,
    icon: FileCode2 as LucideIcon,
  })),
];

const SALESFORCE_TOOLS: DirectoryLink[] = [
  { href: "/json-to-apex/", label: "JSON to Apex Class Generator", icon: Cloud, hub: true },
  { href: "/soql-formatter/", label: "SOQL Formatter & Beautifier", icon: Database },
  { href: "/csv-to-soql/", label: "CSV to SOQL IN Clauses", icon: Table2 },
  { href: "/excel-to-soql/", label: "Excel to SOQL IN Clauses", icon: FileSpreadsheet },
  { href: "/tools/curl-to-salesforce-apex/", label: "cURL to Salesforce Apex", icon: SquareTerminal },
];

const PAGE_TITLE = "Developer Tools Directory | SyntaxFiddle";
const PAGE_DESCRIPTION =
  "Every SyntaxFiddle tool in one directory — cron, regex, JWT, 20 data converters, 11 cURL transpiler targets, JSON/XML schema generators, and the Salesforce developer toolkit. 100% client-side, zero upload, free forever.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/tools/" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/tools/`,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [
      { url: `${SITE_URL}/og/site.jpg`, width: 1200, height: 630, alt: "SyntaxFiddle Developer Tools" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${SITE_URL}/og/site.jpg`],
  },
};

function DirectoryList({
  links,
  idPrefix,
}: {
  links: DirectoryLink[];
  idPrefix: string;
}) {
  return (
    <ul className="mt-4 grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`group flex h-full items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                link.hub
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-950 hover:border-emerald-500/40"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  link.hub
                    ? "border-emerald-500/40 bg-emerald-500/15"
                    : "border-emerald-500/30 bg-emerald-500/10"
                }`}
                aria-hidden
              >
                <Icon size={16} className="text-emerald-400" />
              </span>
              <span
                className={`min-w-0 flex-1 text-sm font-medium transition-colors ${
                  link.hub
                    ? "text-emerald-300"
                    : "text-zinc-300 group-hover:text-emerald-300"
                }`}
              >
                {link.label}
              </span>
              <ArrowRight
                size={14}
                className="shrink-0 text-zinc-600 transition-colors group-hover:text-emerald-400/70"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function ToolsIndexPage() {
  const groups = conversionGroups();
  const totalTools =
    CORE_TOOLS.length +
    1 + // studio hub
    CONVERSION_PAIRS.length +
    CURL_TOOLS_LINKS.length +
    JSON_SCHEMA_LINKS.length +
    XML_SCHEMA_LINKS.length +
    SALESFORCE_TOOLS.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
        Developer Tools Directory
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
        All {totalTools} tools on SyntaxFiddle, grouped by category. Every page
        ships as pre-rendered HTML and converts instantly in your browser —
        nothing you paste is ever uploaded.
      </p>

      <nav aria-label="Categories" className="mt-6">
        <ul className="flex list-none flex-wrap gap-2">
          {[
            { href: "#core-tools", label: "Core Tools" },
            { href: "#conversion-studio", label: "Conversion Studio" },
            { href: "#curl", label: "cURL Converter" },
            { href: "#json-schema", label: "JSON to Schema" },
            { href: "#xml-schema", label: "XML to Schema" },
            { href: "#salesforce", label: "Salesforce" },
          ].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="inline-flex h-8 items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="core-tools" aria-labelledby="core-tools-heading" className="scroll-mt-20">
        <h2
          id="core-tools-heading"
          className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
        >
          Core Developer Tools
        </h2>
        <DirectoryList links={CORE_TOOLS} idPrefix="core" />
      </section>

      <section
        id="conversion-studio"
        aria-labelledby="conversion-studio-heading"
        className="scroll-mt-20"
      >
        <h2
          id="conversion-studio-heading"
          className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
        >
          Conversion Studio — {CONVERSION_PAIRS.length} Converters
        </h2>
        <DirectoryList links={[STUDIO_HUB]} idPrefix="studio" />
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              {group.label}
            </h3>
            <DirectoryList links={group.links} idPrefix={group.label} />
          </div>
        ))}
      </section>

      <section id="curl" aria-labelledby="curl-heading" className="scroll-mt-20">
        <h2
          id="curl-heading"
          className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
        >
          cURL Converter — {CURL_TOOLS_LINKS.length - 1} Targets
        </h2>
        <DirectoryList links={CURL_TOOLS_LINKS} idPrefix="curl" />
      </section>

      <section
        id="json-schema"
        aria-labelledby="json-schema-heading"
        className="scroll-mt-20"
      >
        <h2
          id="json-schema-heading"
          className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
        >
          JSON to Schema Generators
        </h2>
        <DirectoryList links={JSON_SCHEMA_LINKS} idPrefix="json-schema" />
      </section>

      <section
        id="xml-schema"
        aria-labelledby="xml-schema-heading"
        className="scroll-mt-20"
      >
        <h2
          id="xml-schema-heading"
          className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
        >
          XML to Schema Generators
        </h2>
        <DirectoryList links={XML_SCHEMA_LINKS} idPrefix="xml-schema" />
      </section>

      <section
        id="salesforce"
        aria-labelledby="salesforce-tools-heading"
        className="scroll-mt-20"
      >
        <h2
          id="salesforce-tools-heading"
          className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
        >
          Salesforce Developer Tools
        </h2>
        <DirectoryList links={SALESFORCE_TOOLS} idPrefix="salesforce" />
      </section>
    </div>
  );
}
