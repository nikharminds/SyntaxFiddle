import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, Hash } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { CodeSnippets } from "@/components/cron/code-snippets";
import { CronPlayground } from "@/components/cron/cron-playground";
import { RelatedRecipes } from "@/components/cron/related-recipes";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRecipe } from "@/lib/cron/recipes";
import { buildRecipeSnippets } from "@/lib/cron/seo";
import {
  SALESFORCE_FAQS,
  SALESFORCE_FIELDS,
  SALESFORCE_RECIPE_SLUGS,
  SALESFORCE_SECTIONS,
  SALESFORCE_SPECIAL_CHARS,
} from "@/lib/cron/salesforce-content";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/cron/salesforce/`;
const TITLE = "Salesforce Cron Expression Builder & Tester | SyntaxFiddle";
const DESCRIPTION =
  "Build and test Salesforce System.schedule cron expressions with live next-run previews, plain-English output, and copy-paste Apex snippets. Free and 100% client-side.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "salesforce cron expression",
    "salesforce cron expression generator",
    "system.schedule",
    "scheduled apex",
    "salesforce cron format",
    "salesforce cron builder",
    "salesforce cron every 5 minutes",
    "salesforce scheduled apex",
    "apex scheduler",
    "cron salesforce",
  ],
  alternates: { canonical: "/cron/salesforce/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [{ url: `${SITE_URL}/og/salesforce-cron.jpg`, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og/salesforce-cron.jpg`],
  },
};

const FEATURE_LIST = [
  "Full System.schedule dialect: mandatory seconds field, 1-based weekdays, and the optional 7th year field (1970-2099)",
  "Live next-run simulation in any IANA timezone — model the scheduling user's timezone before you ship",
  "Plain-English translation as you type, with per-field validation and fix suggestions",
  "Auto-conversion between Unix, Quartz, AWS EventBridge, Cloudflare, and Salesforce dialects",
  "Copy-paste Apex: Schedulable class skeleton with the System.schedule call for every recipe",
];

export default function SalesforceCronPage() {
  const anchorRecipe = getRecipe("salesforce-every-5-minutes");
  const snippets = anchorRecipe ? buildRecipeSnippets(anchorRecipe) : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name="Salesforce Cron Expression Builder & Tester (System.schedule)"
        description={DESCRIPTION}
        url={PAGE_URL}
        featureList={FEATURE_LIST}
        faqs={SALESFORCE_FAQS}
        breadcrumbs={[
          { name: "Home", item: `${SITE_URL}/` },
          { name: "Cron Directory", item: `${SITE_URL}/cron/` },
          { name: "Salesforce (System.schedule)", item: PAGE_URL },
        ]}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cron Directory", href: "/cron/" },
          { label: "Salesforce (System.schedule)" },
        ]}
      />

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">System.schedule</Badge>
              <Badge variant="outline">Seconds-first · 1 = SUN</Badge>
            </>
          }
          title="Salesforce Cron Expression Builder & Tester"
          description="Type a System.schedule expression — or paste one that keeps failing — and get instant validation, the plain-English translation, and the next 50 fire times in any timezone. Switching dialects converts Unix, Quartz, and EventBridge expressions into the Salesforce format for you."
          facts={[
            {
              icon: Clock,
              title: "Seconds-first format",
              description: "Six mandatory fields plus an optional year, exactly as System.schedule parses them.",
            },
            {
              icon: Hash,
              title: "1-based weekdays",
              description: "1 = Sunday like Quartz — the classic off-by-one when pasting Unix cron.",
            },
            {
              icon: CalendarClock,
              title: "Timezone-true runs",
              description: "Simulate in the scheduling user's timezone, DST shifts included.",
            },
          ]}
        />
      </header>

      <section aria-label="Salesforce cron playground" className="mt-8">
        <CronPlayground initialExpression="0 0/5 * * * ?" initialDialect="salesforce" />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="sf-fields-heading" className="mt-14">
        <h2 id="sf-fields-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          The System.schedule field reference
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          System.schedule(jobName, cronExpression, schedulable) reads{" "}
          <span className="font-mono text-emerald-400">
            seconds minutes hours day-of-month month day-of-week [optional year]
          </span>
          . Every field below is validated live in the playground above.
        </p>
        <Card className="mt-4 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Salesforce System.schedule cron fields</caption>
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th scope="col" className="px-4 py-3 font-medium">#</th>
                  <th scope="col" className="px-4 py-3 font-medium">Field</th>
                  <th scope="col" className="px-4 py-3 font-medium">Allowed values</th>
                  <th scope="col" className="px-4 py-3 font-medium">Required</th>
                  <th scope="col" className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SALESFORCE_FIELDS.map((field) => (
                  <tr key={field.position} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-3 text-zinc-500">{field.position}</td>
                    <td className="px-4 py-3 font-medium text-zinc-200">{field.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">{field.allowed}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {field.required ? "Yes" : "Optional"}
                    </td>
                    <td className="px-4 py-3 text-xs leading-5 text-zinc-400">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section aria-labelledby="sf-chars-heading" className="mt-14">
        <h2 id="sf-chars-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Salesforce cron special characters (?, L, W, #)
        </h2>
        <Card className="mt-4 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Special characters in Salesforce cron expressions</caption>
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th scope="col" className="px-4 py-3 font-medium">Char</th>
                  <th scope="col" className="px-4 py-3 font-medium">Applies to</th>
                  <th scope="col" className="px-4 py-3 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {SALESFORCE_SPECIAL_CHARS.map((char) => (
                  <tr key={char.char} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-base font-semibold text-emerald-400">
                      {char.char}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{char.appliesTo}</td>
                    <td className="px-4 py-3 text-xs leading-5 text-zinc-300">{char.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section aria-labelledby="sf-snippets-heading" className="mt-14">
        <h2 id="sf-snippets-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Schedule it in Apex (System.schedule)
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          A complete example for <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-emerald-400">0 0/5 * * ?</code>{" "}
          (every 5 minutes): the Schedulable class, the System.schedule call, and the equivalent
          syntax for other schedulers — switch tabs to copy each one.
        </p>
        <div className="mt-4">
          <CodeSnippets snippets={snippets} />
        </div>
      </section>

      <section aria-labelledby="sf-docs-heading" className="mt-14 max-w-3xl">
        <h2 id="sf-docs-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          How the Salesforce cron dialect works
        </h2>
        <div className="mt-6 space-y-10">
          {SALESFORCE_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-base font-semibold text-zinc-100">{section.heading}</h3>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mt-3 text-sm leading-6 text-zinc-400">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sf-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="sf-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {SALESFORCE_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sf-recipes-heading" className="mt-14">
        <h2 id="sf-recipes-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Copy a ready-made Salesforce cron expression
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Every common interval as a validated System.schedule expression, each with its Apex
          snippet and cross-dialect equivalents.
        </p>
        <RelatedRecipes slugs={SALESFORCE_RECIPE_SLUGS} />
      </section>

      <section aria-labelledby="sf-tools-heading" className="mt-14">
        <h2 id="sf-tools-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          More Salesforce developer tools
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/salesforce/", label: "All Salesforce Developer Tools" },
              { href: "/salesforce-id-converter/", label: "Salesforce ID Converter — 15 to 18 Digit" },
              { href: "/salesforce-debug-log-analyzer/", label: "Debug Log Analyzer" },
              { href: "/soql-formatter/", label: "SOQL Formatter — Beautify Queries" },
              { href: "/json-to-apex/", label: "JSON to Apex Class Generator" },
              { href: "/tools/curl-to-salesforce-apex/", label: "cURL to Salesforce Apex" },
            ].map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">{tool.label}</span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
