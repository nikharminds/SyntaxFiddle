import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileCode2, Lock, ShieldCheck, Terminal, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { CurlConverterWorkspace } from "@/components/tools/curl-converter/workspace";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CURL_SEO_TARGETS, getCurlSeoTarget } from "@/lib/curl/seo-targets";
import type { CurlSeoFactIcon } from "@/lib/curl/seo-targets";
import type { TranspileTarget } from "@/lib/curl";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

const FACT_ICONS: Record<CurlSeoFactIcon, typeof Lock> = {
  lock: Lock,
  zap: Zap,
  terminal: Terminal,
  shield: ShieldCheck,
  code: FileCode2,
};

const TARGET_BADGES: Record<TranspileTarget, string> = {
  fetch: "fetch() Output",
  axios: "axios.request() Output",
  python: "Python requests Output",
  php: "PHP Guzzle Output",
  go: "Go net/http Output",
  csharp: "C# HttpClient Output",
  java: "Java OkHttp Output",
};

export function generateStaticParams(): { slug: string }[] {
  return CURL_SEO_TARGETS.map((target) => ({ slug: target.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const target = getCurlSeoTarget(slug);
  if (!target) return {};

  const url = `${SITE_URL}/${target.slug}/`;
  const ogImage = `${SITE_URL}/og/${target.slug}.jpg`;
  const privacyDescription = `${target.description} Free, offline, and zero-upload — conversion happens entirely in your browser.`;

  return {
    title: { absolute: target.title },
    description: target.description,
    keywords: target.keywords,
    alternates: { canonical: `/${target.slug}/` },
    openGraph: {
      title: target.title,
      description: privacyDescription,
      url,
      siteName: "SyntaxFiddle",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: target.heading }],
    },
    twitter: {
      card: "summary_large_image",
      title: target.title,
      description: privacyDescription,
      images: [ogImage],
    },
  };
}

export default async function CurlToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const target = getCurlSeoTarget(slug);
  if (!target) notFound();

  const url = `${SITE_URL}/${target.slug}/`;
  const relatedTargets = CURL_SEO_TARGETS.filter((entry) => entry.slug !== target.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name={target.heading}
        description={`${target.description} Executes fully offline in the browser and is free to use.`}
        url={url}
        featureList={target.featureList}
        faqs={target.faqs}
      />

      <nav aria-label="Breadcrumb">
        <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <li>
            <Link href="/" className="transition-colors hover:text-emerald-400">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-zinc-300">
            {target.heading}
          </li>
        </ol>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Zero Upload</Badge>
              <Badge variant="outline">{target.target ? TARGET_BADGES[target.target] : "7 Code Targets"}</Badge>
            </>
          }
          title={target.heading}
          description={target.heroDescription}
          facts={target.facts.map((fact) => ({
            icon: FACT_ICONS[fact.icon],
            title: fact.title,
            description: fact.description,
          }))}
        />
      </header>

      <section aria-label="cURL converter workspace" className="mt-8">
        <CurlConverterWorkspace initialTarget={target.target ?? "fetch"} />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby={`${target.slug}-docs-heading`} className="mt-14 max-w-3xl">
        <h2
          id={`${target.slug}-docs-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Technical documentation
        </h2>
        <div className="mt-6 space-y-10">
          {target.sections.map((section) => (
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

      <section aria-labelledby={`${target.slug}-faq-heading`} className="mt-14 max-w-3xl">
        <h2
          id={`${target.slug}-faq-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {target.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby={`${target.slug}-related-heading`} className="mt-14">
        <h2
          id={`${target.slug}-related-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Convert cURL to another target
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTargets.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/${related.slug}/`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <span className="font-medium">{related.heading.split("—")[0]?.trim()}</span>
                  <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />
    </div>
  );
}
