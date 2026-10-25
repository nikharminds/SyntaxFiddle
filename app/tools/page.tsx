import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CONVERTER_ROUTES,
  getAllConverterSlugs,
  type SeoConverterRoute,
} from "@/lib/config/converters";
import { SITE_URL } from "@/lib/site";

const TOOL_TYPE_SECTIONS: { toolType: SeoConverterRoute["toolType"]; heading: string }[] = [
  { toolType: "curl", heading: "cURL Converters" },
  { toolType: "schema", heading: "JSON Schema Generators" },
  { toolType: "csv", heading: "CSV Converters" },
];

const PAGE_TITLE = "Developer Tools Directory | SyntaxFiddle";
const PAGE_DESCRIPTION =
  "Every SyntaxFiddle converter in one directory — cURL to code, JSON to schemas, and CSV to SOQL. 100% client-side, zero upload, free forever.";

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

export default function ToolsIndexPage() {
  const routes = getAllConverterSlugs()
    .map((slug) => CONVERTER_ROUTES[slug])
    .filter((route): route is SeoConverterRoute => route !== undefined);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
        Developer Tools Directory
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
        Every dedicated converter on SyntaxFiddle, grouped by tool. Each page ships
        with a preloaded example and converts instantly in your browser — nothing you
        paste is ever uploaded.
      </p>

      {TOOL_TYPE_SECTIONS.filter((section) =>
        routes.some((route) => route.toolType === section.toolType),
      ).map((section) => (
        <section key={section.toolType} aria-labelledby={`${section.toolType}-tools-heading`}>
          <h2
            id={`${section.toolType}-tools-heading`}
            className="mt-10 text-xl font-bold tracking-tight text-zinc-100"
          >
            {section.heading}
          </h2>
          <ul className="mt-4 grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {routes
              .filter((route) => route.toolType === section.toolType)
              .map((route) => (
                <li key={route.slug}>
                  <Link
                    href={`/tools/${route.slug}/`}
                    className="flex h-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                  >
                    <span className="font-medium">
                      {route.sourceName} to {route.targetName}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
