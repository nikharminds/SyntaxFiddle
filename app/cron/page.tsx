"use client";

import Link from "next/link";
import { ArrowRight, AtSign, CalendarClock, Layers, Link2 } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { CronPlayground } from "@/components/cron/cron-playground";
import { RelatedRecipes } from "@/components/cron/related-recipes";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";

const CRON_FACTS = [
  {
    icon: Layers,
    title: "5 cron dialects",
    description: "Unix, Quartz, AWS EventBridge, Cloudflare, and Salesforce on one screen.",
  },
  {
    icon: CalendarClock,
    title: "Live run timeline",
    description: "The next 50 runs simulated locally, updating as you type.",
  },
  {
    icon: Link2,
    title: "URL-synced state",
    description: "Expression, dialect, and timezone live in the share link.",
  },
];

const POPULAR_SLUGS = [
  "every-5-minutes",
  "every-15-minutes",
  "every-hour",
  "daily-at-midnight",
  "weekdays-at-9am",
  "every-monday",
  "first-day-of-month",
  "last-day-of-month",
  "aws-eventbridge-every-hour",
  "aws-eventbridge-daily-at-8am",
  "quartz-every-10-seconds",
  "spring-boot-daily",
  "cloudflare-every-5-minutes",
  "salesforce-every-5-minutes",
  "salesforce-weekdays-at-noon",
  "salesforce-last-day-of-month",
];

const CRON_MACRO_LINKS = [
  { href: "/cron/at-daily/", macro: "@daily", label: "Every day at 00:00" },
  { href: "/cron/at-hourly/", macro: "@hourly", label: "Top of every hour" },
  { href: "/cron/at-weekly/", macro: "@weekly", label: "Sunday at 00:00" },
  { href: "/cron/at-monthly/", macro: "@monthly", label: "1st of the month" },
  { href: "/cron/at-yearly/", macro: "@yearly", label: "January 1st" },
  { href: "/cron/at-reboot/", macro: "@reboot", label: "Once at startup" },
];

export default function CronPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">URL-synced</Badge>
              <Badge variant="outline">Zero-latency parsing</Badge>
            </>
          }
          title="Cron Expression Generator & Tester"
          description={
            <>
              Type an expression — the plain-English translation, validation, and the run
              timeline update instantly as you type. Every field is explained inline, so the
              tool doubles as a cron syntax explainer. Looking for a specific schedule? Browse
              the{" "}
              <a href="#related" className="text-emerald-400 hover:underline">
                popular cron recipes
              </a>{" "}
              below.
            </>
          }
          facts={CRON_FACTS}
        />
      </header>

      <section aria-label="Cron playground" className="mt-8">
        <CronPlayground />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />

      <section aria-label="Salesforce cron builder" className="mt-10">
        <Link
          href="/cron/salesforce/"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-emerald-300">
              Working in Salesforce? Try the dedicated System.schedule builder
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Seconds-first format, 1-based weekdays, optional year — with copy-paste Apex snippets and a
              full field reference.
            </span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-emerald-400" aria-hidden />
        </Link>
      </section>

      <div id="related" className="mt-10">
        <RelatedRecipes slugs={POPULAR_SLUGS} />
      </div>

      <section id="macros" aria-labelledby="macros-heading" className="mt-14">
        <h2
          id="macros-heading"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100"
        >
          <AtSign size={18} className="text-emerald-400" aria-hidden />
          Cron shortcut macros
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          The tester expands <code className="font-mono text-emerald-400">@daily</code>,{" "}
          <code className="font-mono text-emerald-400">@hourly</code>,{" "}
          <code className="font-mono text-emerald-400">@weekly</code> and friends natively —
          each reference page explains the expansion, timezone behavior, and the Quartz and
          AWS EventBridge equivalents.
        </p>
        <ul className="mt-5 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRON_MACRO_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <span className="min-w-0">
                  <span className="block font-mono font-medium text-emerald-400">
                    {item.macro}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">{item.label}</span>
                </span>
                <span aria-hidden className="text-zinc-600">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cron-explainer-heading" className="mt-14">
        <h2
          id="cron-explainer-heading"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100"
        >
          <CalendarClock size={18} className="text-emerald-400" aria-hidden />
          A cron reader, validator, and calculator in one tool
        </h2>
        <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-zinc-400">
          <p>
            Paste any expression and the validator spells out what every field means in plain
            English — invalid patterns are flagged with the exact field that broke. Inherited a
            crontab line and wondering what{" "}
            <code className="font-mono text-emerald-400">*/15 * * * *</code> means? The reader
            translates it: every 15 minutes, on the quarter hour. Need the upcoming run times?
            The calculator lists the next 50 in your timezone as you type.
          </p>
          <p>
            Common schedules have dedicated reference pages —{" "}
            <Link
              href="/cron/every-15-minutes/"
              className="text-emerald-400 hover:underline"
            >
              */15 * * * * (every 15 minutes)
            </Link>
            ,{" "}
            <Link href="/cron/every-hour/" className="text-emerald-400 hover:underline">
              0 * * * * (top of every hour)
            </Link>
            , and{" "}
            <Link href="/cron/weekdays-at-9am/" className="text-emerald-400 hover:underline">
              weekdays at 9 AM
            </Link>{" "}
            among them — and the{" "}
            <Link
              href="/blog/cron-expressions-explained/"
              className="text-emerald-400 hover:underline"
            >
              field-by-field cron syntax guide
            </Link>{" "}
            covers every operator, macro, and dialect quirk. New to cron? Start with the guide.
            Chasing a specific schedule? Jump straight to its reference page.
          </p>
        </div>
      </section>
    </div>
  );
}
