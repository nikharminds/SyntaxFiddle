"use client";

import { CalendarClock, Layers, Link2 } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { CronPlayground } from "@/components/cron/cron-playground";
import { RelatedRecipes } from "@/components/cron/related-recipes";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";

const CRON_FACTS = [
  {
    icon: Layers,
    title: "4 cron dialects",
    description: "Unix, Quartz, AWS EventBridge, and Cloudflare on one screen.",
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
  "quartz-every-10-seconds",
  "spring-boot-daily",
  "cloudflare-every-5-minutes",
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
          title="Cron Expression Visualizer & Simulator"
          description={
            <>
              Type an expression — validation, the plain-English translation, and the run
              timeline update instantly as you type. Everything is computed in your
              browser, and the URL updates silently so you can share the exact state.
              Looking for a specific schedule? Browse the{" "}
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

      <div id="related" className="mt-10">
        <RelatedRecipes slugs={POPULAR_SLUGS} />
      </div>
    </div>
  );
}
