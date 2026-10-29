import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileJson, Lock, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { JsonConverterWorkspace } from "@/components/tools/json-converter/workspace";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  buildJsonSchemaSeoSections,
  JSON_SCHEMA_FAQS,
} from "@/lib/json-schema/copy";
import { JSON_SCHEMA_SEO_TARGETS } from "@/lib/json-schema/seo-targets";
import { CONVERTER_ROUTES } from "@/lib/config/converters";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/json-to-schema/`;

export const metadata: Metadata = {
  title: {
    absolute:
      "JSON to JSON Schema Converter Online — Zod, TypeScript & Pydantic | SyntaxFiddle",
  },
  description:
    "Convert JSON to JSON Schema online — generate Zod schemas, TypeScript interfaces, Pydantic v2 models, or Go structs instantly. Mixed-array unions, optional fields, ISO dates, int64 for whole numbers, and verbatim keys by default — 100% client-side, zero uploads.",
  keywords: [
    "json to schema",
    "json to json schema",
    "json to schema converter online",
    "json to zod",
    "json to typescript",
    "json to pydantic",
    "json to go struct",
    "json schema generator",
    "type inference from json",
  ],
  alternates: { canonical: "/json-to-schema/" },
  openGraph: {
    title: "JSON to JSON Schema Converter Online — Zod, TypeScript & Pydantic | SyntaxFiddle",
    description:
      "Convert JSON to JSON Schema online — Zod, TypeScript, Pydantic, and Go output, entirely in your browser. Payloads with PII never leave your machine.",
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og/json-to-schema.jpg`,
        width: 1200,
        height: 630,
        alt: "JSON to Schema Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JSON to JSON Schema Converter Online — Zod, TypeScript & Pydantic",
    description:
      "Convert JSON to JSON Schema online — Zod, TypeScript, Pydantic, and Go schemas, entirely in your browser, zero uploads.",
    images: [`${SITE_URL}/og/json-to-schema.jpg`],
  },
};

const SECTIONS = buildJsonSchemaSeoSections();

export default function JsonToSchemaPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name="JSON to JSON Schema Converter"
        description="Paste JSON and generate Zod schemas, TypeScript interfaces, Pydantic v2 models, or Go structs instantly. Runs fully offline in the browser — payloads with PII are never uploaded."
        url={PAGE_URL}
        featureList={[
          "Generates Zod schemas, TypeScript interfaces, Pydantic v2 models, and Go structs from any JSON",
          "Mixed arrays infer unions; partial records infer optional fields",
          "Whole numbers infer int, int64, and z.number().int() — no float64 precision loss on IDs",
          "ISO-8601 strings map to z.coerce.date(), datetime, and time.Time",
          "Keys preserved verbatim by default; opt-in camelCase renaming keeps the original mapping",
          "100% client-side generation in a Web Worker — zero uploads, zero logging",
        ]}
        faqs={JSON_SCHEMA_FAQS}
      />

      <header>
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Zero Upload</Badge>
              <Badge variant="outline">4 Schema Targets</Badge>
            </>
          }
          title="JSON to JSON Schema Converter — Zod, TypeScript, Pydantic & Go"
          description="Convert JSON to JSON Schema and get a Zod schema, TypeScript interfaces, Pydantic v2 models, or Go structs in milliseconds. The inference engine runs in a Web Worker inside your browser — mixed arrays become unions, partial records infer optional fields, ISO-8601 strings map to real date types, whole numbers infer int64, and keys are kept verbatim by default with optional camelCase renaming that preserves the original mapping."
          facts={[
            {
              icon: Lock,
              title: "PII never uploaded",
              description:
                "Parsing and generation run in a local Web Worker — production payloads with names, emails, and tokens never touch a server.",
            },
            {
              icon: Zap,
              title: "Live 300 ms conversion",
              description:
                "Output refreshes as you type, guarded by a 3-second watchdog and a nesting-depth limit so the tab never freezes.",
            },
            {
              icon: FileJson,
              title: "Four idiomatic targets",
              description:
                "Zod, TypeScript, Pydantic v2, and Go — each generated with target-native conventions, aliases, tags, and imports.",
            },
          ]}
        />
      </header>

      <section aria-label="JSON to schema workspace" className="mt-8">
        <JsonConverterWorkspace defaultTab="ts" />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section
        aria-labelledby="json-schema-docs-heading"
        className="mt-14 max-w-3xl"
      >
        <h2
          id="json-schema-docs-heading"
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          How JSON becomes a schema
        </h2>
        <div className="mt-6 space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-base font-semibold text-zinc-100">
                {section.heading}
              </h3>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-3 text-sm leading-6 text-zinc-400"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="json-targets-heading" className="mt-14">
        <h2
          id="json-targets-heading"
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Generate a specific schema target
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2">
            {[
              ...JSON_SCHEMA_SEO_TARGETS.map((target) => ({
                href: `/${target.slug}/`,
                label: target.heading.split("—")[0]?.trim(),
              })),
              ...["json-to-zod", "json-to-pydantic"].flatMap((slug) => {
                const route = CONVERTER_ROUTES[slug];
                return route
                  ? [
                      {
                        href: `/tools/${slug}/`,
                        label: `${route.sourceName} to ${route.targetName}`,
                      },
                    ]
                  : [];
              }),
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">{link.label}</span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section
        aria-labelledby="json-schema-faq-heading"
        className="mt-14 max-w-3xl"
      >
        <h2
          id="json-schema-faq-heading"
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {JSON_SCHEMA_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />
    </div>
  );
}
