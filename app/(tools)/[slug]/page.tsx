import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileCode2, Lock, ShieldCheck, Terminal, Zap } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { CurlConverterWorkspace } from "@/components/tools/curl-converter/workspace";
import { JsonConverterWorkspace } from "@/components/tools/json-converter/workspace";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CURL_SEO_TARGETS, getCurlSeoTarget } from "@/lib/curl/seo-targets";
import type { CurlSeoFactIcon } from "@/lib/curl/seo-targets";
import type { TranspileTarget } from "@/lib/curl";
import {
  getJsonSchemaSeoTarget,
  JSON_SCHEMA_SEO_TARGETS,
} from "@/lib/json-schema/seo-targets";
import type { JsonSchemaSeoFactIcon } from "@/lib/json-schema/seo-targets";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

const FACT_ICONS: Record<CurlSeoFactIcon | JsonSchemaSeoFactIcon, typeof Lock> = {
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

const JSON_TARGET_BADGES: Record<string, string> = {
  zod: "Zod Schema Output",
  ts: "TypeScript Interface Output",
  pydantic: "Pydantic v2 Output",
  go: "Go Struct Output",
};

type Landing =
  | { kind: "curl"; data: (typeof CURL_SEO_TARGETS)[number] }
  | { kind: "json-schema"; data: (typeof JSON_SCHEMA_SEO_TARGETS)[number] };

function resolveLanding(slug: string): Landing | undefined {
  const jsonTarget = getJsonSchemaSeoTarget(slug);
  if (jsonTarget) return { kind: "json-schema", data: jsonTarget };
  const curlTarget = getCurlSeoTarget(slug);
  if (curlTarget) return { kind: "curl", data: curlTarget };
  return undefined;
}

export function generateStaticParams(): { slug: string }[] {
  return [
    ...CURL_SEO_TARGETS.map((target) => ({ slug: target.slug })),
    ...JSON_SCHEMA_SEO_TARGETS.map((target) => ({ slug: target.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = resolveLanding(slug);
  if (!landing) return {};

  const { data } = landing;
  const url = `${SITE_URL}/${data.slug}/`;
  const ogImage = `${SITE_URL}/og/${data.slug}.jpg`;
  const privacyDescription =
    landing.kind === "curl"
      ? `${data.description} Free, offline, and zero-upload — conversion happens entirely in your browser.`
      : `${data.description} Zero-upload by design: your JSON never leaves this browser tab.`;

  return {
    title: { absolute: data.title },
    description: data.description,
    keywords: data.keywords,
    alternates: { canonical: `/${data.slug}/` },
    openGraph: {
      title: data.title,
      description: privacyDescription,
      url,
      siteName: "SyntaxFiddle",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: data.heading }],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: privacyDescription,
      images: [ogImage],
    },
  };
}

export default async function ToolLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = resolveLanding(slug);
  if (!landing) notFound();

  const { kind, data } = landing;
  const url = `${SITE_URL}/${data.slug}/`;
  const isCurl = kind === "curl";
  const relatedTargets = isCurl
    ? CURL_SEO_TARGETS.filter((entry) => entry.slug !== data.slug)
    : JSON_SCHEMA_SEO_TARGETS.filter((entry) => entry.slug !== data.slug);
  const targetBadge = isCurl
    ? data.target
      ? TARGET_BADGES[data.target]
      : "7 Code Targets"
    : JSON_TARGET_BADGES[data.target] ?? "Schema Output";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name={data.heading}
        description={`${data.description} Executes fully offline in the browser and is free to use.`}
        url={url}
        featureList={data.featureList}
        faqs={data.faqs}
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
            {data.heading}
          </li>
        </ol>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Zero Upload</Badge>
              <Badge variant="outline">{targetBadge}</Badge>
            </>
          }
          title={data.heading}
          description={data.heroDescription}
          facts={data.facts.map((fact) => ({
            icon: FACT_ICONS[fact.icon],
            title: fact.title,
            description: fact.description,
          }))}
        />
      </header>

      <section
        aria-label={isCurl ? "cURL converter workspace" : "JSON to schema workspace"}
        className="mt-8"
      >
        {isCurl ? (
          <CurlConverterWorkspace initialTarget={data.target ?? "fetch"} />
        ) : (
          <JsonConverterWorkspace defaultTab={data.target} />
        )}
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby={`${data.slug}-docs-heading`} className="mt-14 max-w-3xl">
        <h2
          id={`${data.slug}-docs-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Technical documentation
        </h2>
        <div className="mt-6 space-y-10">
          {data.sections.map((section) => (
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

      <section aria-labelledby={`${data.slug}-faq-heading`} className="mt-14 max-w-3xl">
        <h2
          id={`${data.slug}-faq-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {data.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby={`${data.slug}-related-heading`} className="mt-14">
        <h2
          id={`${data.slug}-related-heading`}
          className="text-xl font-bold tracking-tight text-zinc-100"
        >
          {isCurl ? "Convert cURL to another target" : "Generate another schema target"}
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
