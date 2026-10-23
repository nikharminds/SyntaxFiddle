import Link from "next/link";
import { ArrowRight, Check, ServerOff, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SecurityTextSection } from "@/components/shared/security-text-section";
import { TabularConverters } from "@/components/shared/tabular-converters";
import { ToolGrid } from "@/components/shared/tool-grid";

const PROOF_STATS: [string, string][] = [
  ["0", "servers"],
  ["0", "databases"],
  ["0", "logs"],
];

function NetworkProofPanel() {
  return (
    <Card
      aria-label="Proof that nothing is transmitted"
      className="w-full max-w-md border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </span>
          <span className="font-mono text-xs text-zinc-500">Network · syntaxfiddle.com</span>
        </div>
        <Badge variant="success">
          <Check size={12} />
          0 requests after load
        </Badge>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-300">GET /</span>
          <span className="text-zinc-500">200 · document</span>
        </div>
        <div className="my-3 border-t border-dashed border-zinc-800" aria-hidden="true" />
        <p className="flex items-center gap-2 text-emerald-400">
          <Check size={14} className="shrink-0" />
          nothing is sent afterwards — ever
        </p>
        <p className="mt-1 text-zinc-500">
          run a pattern, convert a file, validate a token
        </p>
        <p className="text-zinc-500">0 bytes leave this tab</p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {PROOF_STATS.map(([value, label]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2.5">
            <dd className="text-lg font-semibold leading-6 text-zinc-100">{value}</dd>
            <dt className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</dt>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="border-b border-zinc-800/60 bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pb-12 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <Zap size={12} className="text-emerald-400" />
                  Static export
                </Badge>
                <Badge variant="outline">
                  <ServerOff size={12} className="text-emerald-400" />
                  Zero backend
                </Badge>
                <Badge variant="outline">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  No telemetry
                </Badge>
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
                Developer tools that run entirely in{" "}
                <span className="text-emerald-400">your browser</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
                SyntaxFiddle runs every parser, converter, and simulator entirely in
                your browser. No accounts, no servers, no telemetry — just fast,
                deterministic utilities built for engineers who care about correctness
                and data hygiene.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/cron"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
                >
                  Open Cron Tester &amp; Generator
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="#tools"
                  className="inline-flex h-10 items-center rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:text-zinc-100"
                >
                  Browse tools
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <NetworkProofPanel />
            </div>
          </div>
        </div>
      </section>

      <section id="tools" aria-labelledby="tools-heading" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <ToolGrid />
      </section>

      <SecurityTextSection />

      <TabularConverters />

      <article
        aria-label="About SyntaxFiddle"
        className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6"
      >
        <div className="max-w-3xl">
          <div className="prose max-w-none prose-headings:tracking-tight prose-a:text-emerald-400 prose-code:rounded prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-emerald-400 prose-code:before:content-none prose-code:after:content-none">
          <h2>Privacy by architecture, not by policy</h2>
          <p>
            Most web-based developer tools quietly ship your input to a backend. You
            paste a schedule, the browser posts it to an API, a server parses it, and
            the result travels back — leaving copies in application logs, load
            balancers, and analytics pipelines you will never audit. SyntaxFiddle
            eliminates that entire class of risk through architecture: the platform is
            a fully static application, compiled ahead of time and executed completely
            inside your browser tab. When you type a cron expression or load a
            spreadsheet, the parsing engine runs locally using standard web APIs. You
            can verify this claim yourself — open your browser&rsquo;s network panel and
            watch it after the page loads. No outbound request ever carries your data,
            because we cannot log what we never receive. This makes SyntaxFiddle
            appropriate for sensitive inputs such as production crontabs, customer
            exports, and internal schedules that would normally violate policy if
            pasted into an unknown web tool.
          </p>

          <h2>A performance philosophy, not a benchmark</h2>
          <p>
            Static-first is also a performance decision. Every page is pre-rendered at
            build time and served from any CDN edge as plain HTML, which means there
            are no cold starts, no server round trips, and no database lookups between
            you and the tool. First paint is a single document fetch; interactivity
            begins as soon as the JavaScript bundle hydrates. The computation itself is
            handled by deterministic TypeScript engines — the same input always
            produces the same output, with no hidden server-side variability. We also
            budget aggressively for visual stability: system font stacks eliminate
            font-swap jank and the layout shift it causes, every dynamic region
            reserves its space before hydration, and controls render at fixed sizes.
            The result is a tool that feels like a native desktop utility rather than a
            website — and a Cumulative Layout Shift score of zero on every route.
          </p>

          <h2>Built to scale across tools without scaling infrastructure</h2>
          <p>
            Because there is no runtime to operate, adding a new utility only adds
            static assets. The cron engine, dialect definitions, and recipe datasets
            live in plain modules that are code-split per route, so the CSV converter
            never pays for the cron playground&rsquo;s weight. For teams working under
            GDPR, SOC 2, or similar regimes, client-side processing dramatically
            shrinks the compliance surface: there is no data in transit, no data at
            rest, and no vendor to assess. Bookmark the suite, load it once, and it
            keeps working even on a flaky connection — your data and your workflow stay
            yours.
          </p>
          </div>
        </div>
      </article>
    </>
  );
}
