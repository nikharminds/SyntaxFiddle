import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, EyeOff, KeyRound, WifiOff } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { JwtLayout } from "@/components/jwt/JwtLayout";
import { SecurityNotice } from "@/components/jwt/SecurityNotice";
import { PageHero } from "@/components/shared/page-hero";
import { ToolSchema } from "@/components/schema/ToolSchema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildJwtSeoSections, JWT_FAQS } from "@/lib/jwt/copy";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/jwt-decoder/`;
const TITLE = "JWT Decoder - Secure, Offline, Client-Side Only | SyntaxFiddle";
const DESCRIPTION =
  "Decode JSON Web Tokens entirely in your browser — color-coded header, payload, and signature, syntax-highlighted claims, and live expiry checks. Decode-only, zero network calls, nothing logged.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "jwt decoder",
    "jwt debugger online",
    "decode json web token",
    "jwt parser",
    "base64url decode",
    "jwt claims inspector",
    "jwt exp checker",
    "offline jwt decoder",
    "client-side jwt tool",
  ],
  alternates: { canonical: "/jwt-decoder/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
  },
};

const FEATURE_LIST = [
  "Decode header, payload, and signature segments instantly as you type",
  "Base64Url + UTF-8 pipeline that preserves multibyte Unicode claims",
  "Color-coded segments following the standard red/purple/blue convention",
  "Live expiry badge computed from the exp claim",
  "100% client-side — no uploads, no logging, decode-only by design",
];

export default function JwtDecoderPage() {
  const sections = buildJwtSeoSections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolSchema
        name="JWT Decoder — Secure, Offline, Client-Side Only"
        description={DESCRIPTION}
        url={PAGE_URL}
        featureList={FEATURE_LIST}
        faqs={JWT_FAQS}
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/jwt/"
          className="inline-flex items-center gap-1 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft size={13} />
          JWT Decoder workspace
        </Link>
        <span aria-hidden>/</span>
        <span className="text-zinc-400">Guide &amp; FAQ</span>
      </nav>

      <header className="mt-6">
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Zero Network Calls</Badge>
              <Badge variant="outline">Decode-Only</Badge>
            </>
          }
          title="JWT Decoder — Secure, Offline, Client-Side Only"
          description="Paste a token and inspect its header, payload, and claims without it ever leaving your browser. Below the tool: how Base64Url works, what each of the three segments contains, and why server-backed decoders are a credential-leak risk."
          facts={[
            {
              icon: WifiOff,
              title: "Offline-proof",
              description: "Disable your Wi-Fi and the decoder still works.",
            },
            {
              icon: EyeOff,
              title: "Nothing transmitted",
              description: "Parsing happens in your tab — watch the Network panel stay empty.",
            },
            {
              icon: KeyRound,
              title: "No key required",
              description: "JWTs are encoded, not encrypted — signatures stay unverified.",
            },
          ]}
        />
      </header>

      <section aria-label="JWT decoder" className="mt-8">
        <JwtLayout />
      </section>

      <div className="mt-6">
        <SecurityNotice />
      </div>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-labelledby="jwt-docs-heading" className="mt-14 max-w-3xl">
        <h2 id="jwt-docs-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          How JWT decoding works
        </h2>
        <div className="mt-6 space-y-10">
          {sections.map((section) => (
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

      <section aria-labelledby="jwt-faq-heading" className="mt-14 max-w-3xl">
        <h2 id="jwt-faq-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-6">
          {JWT_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-base font-semibold text-zinc-100">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdUnit format="bottom-content" className="mt-10" />

      <section aria-labelledby="jwt-related-heading" className="mt-14">
        <h2 id="jwt-related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
          Related tools
        </h2>
        <Card className="mt-5 p-4 sm:p-5">
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/regex-tester/", label: "Regex Tester & Visualizer" },
              { href: "/jwt/", label: "JWT Decoder workspace" },
              { href: "/cron/", label: "Cron Expression Visualizer" },
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
