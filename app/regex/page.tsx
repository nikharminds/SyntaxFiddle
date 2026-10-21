import type { Metadata } from "next";
import { Cpu, Highlighter, ShieldCheck } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { PageHero } from "@/components/shared/page-hero";
import { RegexLayout } from "@/components/regex/RegexLayout";
import { Badge } from "@/components/ui/badge";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/regex-tester/`;

export const metadata: Metadata = {
  title: "Regex Tester — Live Match Highlighting & Capture Groups",
  description:
    "Test regular expressions with real-time match highlighting, named capture groups, flags, and execution timing. Evaluation runs in a sandboxed Web Worker with ReDoS protection — 100% client-side.",
  keywords: [
    "regex tester",
    "regexp tester",
    "regular expression online",
    "regex highlighter",
    "capture groups",
    "regex flags",
    "regex debugger",
    "pattern matcher",
  ],
  alternates: { canonical: "/regex-tester/" },
  openGraph: {
    title: "Regex Tester — Live Match Highlighting & Capture Groups | SyntaxFiddle",
    description:
      "Test regular expressions with real-time match highlighting, named capture groups, flags, and execution timing — 100% client-side.",
    url: PAGE_URL,
    siteName: "SyntaxFiddle",
    type: "website",
    images: [{ url: `${SITE_URL}/og/regex.jpg`, width: 1200, height: 630, alt: "Regex Tester" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regex Tester — Live Match Highlighting & Capture Groups | SyntaxFiddle",
    description:
      "Test regular expressions with real-time match highlighting — 100% client-side.",
    images: [`${SITE_URL}/og/regex.jpg`],
  },
};

export default function RegexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Sandboxed Web Worker</Badge>
              <Badge variant="outline">ReDoS Guarded</Badge>
            </>
          }
          title="Regex Tester & Debugger"
          description="Type a pattern and matches highlight in real time with alternating colors and underlined capture groups. Every evaluation runs off the main thread and is hard-terminated after two seconds, so even catastrophic patterns can never freeze your browser."
          facts={[
            {
              icon: Cpu,
              title: "Native JavaScript engine",
              description: "The same V8 RegExp your console runs — what you test is what ships.",
            },
            {
              icon: ShieldCheck,
              title: "ReDoS-guarded worker",
              description: "Sandboxed evaluation, hard-terminated at the 2-second budget.",
            },
            {
              icon: Highlighter,
              title: "Live highlighting",
              description: "Matches and named groups are colored as you type.",
            },
          ]}
        />
      </header>

      <section aria-label="Regex playground" className="mt-8">
        <RegexLayout />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />
    </div>
  );
}
