import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileCode2, Lock, ShieldCheck, Terminal, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { PageHero } from "@/components/shared/page-hero";
import { RegexLayout } from "@/components/regex/RegexLayout";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRegexFlavor, REGEX_FLAVORS } from "@/lib/regex/dialects";
import { getRegexFlavorContent, type RegexFlavorIcon } from "@/lib/regex/flavors";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

const FACT_ICONS: Record<RegexFlavorIcon, typeof Lock> = {
  lock: Lock,
  zap: Zap,
  terminal: Terminal,
  shield: ShieldCheck,
  code: FileCode2,
};

export function generateStaticParams(): { flavor: string }[] {
  return REGEX_FLAVORS.map((flavor) => ({ flavor: flavor.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ flavor: string }>;
}): Promise<Metadata> {
  const { flavor: slug } = await params;
  const meta = getRegexFlavor(slug);
  const content = getRegexFlavorContent(slug);
  if (!meta || !content) return {};

  const url = `${SITE_URL}/regex/${meta.slug}/`;
  return {
    title: { absolute: content.title },
    description: content.description,
    keywords: content.keywords,
    alternates: { canonical: `/regex/${meta.slug}/` },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      siteName: "SyntaxFiddle",
      type: "website",
      images: [{ url: `${SITE_URL}/og/regex.jpg`, width: 1200, height: 630, alt: content.heading }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: [`${SITE_URL}/og/regex.jpg`],
    },
  };
}

export default async function RegexFlavorPage({
  params,
}: {
  params: Promise<{ flavor: string }>;
}) {
  const { flavor: slug } = await params;
  const meta = getRegexFlavor(slug);
  const content = getRegexFlavorContent(slug);
  if (!meta || !content) notFound();

  const url = `${SITE_URL}/regex/${meta.slug}/`;
  const otherFlavors = REGEX_FLAVORS.filter((flavor) => flavor.slug !== meta.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name={content.heading}
        description={content.description}
        url={url}
        featureList={content.featureList}
        faqs={content.faqs}
      />

      <nav aria-label="Breadcrumb">
        <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li>
            <Link href="/" className="transition-colors hover:text-emerald-400">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/regex-tester/" className="transition-colors hover:text-emerald-400">
              Regex Tester
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-zinc-300">
            {meta.label}
          </li>
        </ol>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">{meta.languageLabel}</Badge>
              <Badge variant="outline">Dialect-Aware Translation</Badge>
            </>
          }
          title={content.heading}
          description={content.heroDescription}
          facts={content.facts.map((fact) => ({
            icon: FACT_ICONS[fact.icon],
            title: fact.title,
            description: fact.description,
          }))}
        />
      </header>

      <section aria-label={`${meta.label} regex playground`} className="mt-8">
        <RegexLayout
          dialect={meta.id}
          sample={{
            initialPattern: meta.sample.pattern,
            initialFlags: meta.sample.flags,
            initialTestString: meta.sample.testString,
          }}
        />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby={`${meta.slug}-docs-heading`} className="mt-14 max-w-3xl">
        <h2
          id={`${meta.slug}-docs-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          {meta.label} regular expressions, in depth
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Engine: {meta.engineNote}. The tester translates your pattern for live
          evaluation — these sections document how {meta.label}&apos;s engine really
          behaves and where it differs from the evaluation engine.
        </p>
        <div className="mt-6 space-y-10">
          {content.sections.map((section) => (
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

      <section aria-labelledby={`${meta.slug}-diff-heading`} className="mt-14">
        <h2 id={`${meta.slug}-diff-heading`} className="text-xl font-bold tracking-tight text-zinc-100">
          {meta.label} versus the evaluation engine
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          What translates automatically, what carries a caveat, and what is
          rejected — construct by construct.
        </p>
        <Card className="mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <caption className="sr-only">
              Syntax differences between {meta.label} regex and JavaScript RegExp
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Construct
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  {meta.label}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  This tester
                </th>
              </tr>
            </thead>
            <tbody>
              {content.differences.map((row) => (
                <tr key={row.construct} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-300">{row.construct}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-amber-200/90">
                    {row.flavor}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-emerald-300">
                    {row.javascript}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby={`${meta.slug}-cheatsheet-heading`} className="mt-14">
        <h2
          id={`${meta.slug}-cheatsheet-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          {meta.label} regex cheat sheet
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          The {meta.label}-specific tokens, with the constructs that cannot be
          translated marked explicitly.
        </p>
        <Card className="mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">{meta.label} regex token cheat sheet</caption>
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Token
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Meaning
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-zinc-300">
                  Example
                </th>
              </tr>
            </thead>
            <tbody>
              {content.cheatSheet.map((row) => (
                <tr key={row.token} className="border-b border-zinc-800/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-emerald-300">
                    {row.token}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300">{row.meaning}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby={`${meta.slug}-faq-heading`} className="mt-14 max-w-3xl">
        <h2 id={`${meta.slug}-faq-heading`} className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {content.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby={`${meta.slug}-related-heading`} className="mt-14">
        <h2
          id={`${meta.slug}-related-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Test in another flavor
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li>
              <Link
                href="/regex-tester/"
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <span className="font-medium">JavaScript Regex Tester</span>
                <ArrowRight size={14} className="shrink-0 text-zinc-600" />
              </Link>
            </li>
            {otherFlavors.map((flavor) => (
              <li key={flavor.slug}>
                <Link
                  href={`/regex/${flavor.slug}/`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">{flavor.label} Regex Tester</span>
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
