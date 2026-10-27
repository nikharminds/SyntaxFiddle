import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About SyntaxFiddle — a privacy-first, fully client-side platform of developer utilities built for the global developer community.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <article className="prose max-w-none prose-headings:tracking-tight">
        <h1>About SyntaxFiddle</h1>
        <p>
          SyntaxFiddle is a collection of browser-based utilities for developers —
          starting with a cron expression visualizer and simulator, with a CSV to
          SQL/JSON converter close behind. Built for the global developer community and
          runnable from any browser, anywhere, the project exists because too many
          &ldquo;free&rdquo; web tools quietly relay your input to a server, and too
          many teams discover that only after pasting something sensitive into them.
        </p>
        <p>
          The entire platform is a statically exported Next.js application served as
          pure static assets from the CDN edge: no API tier, no database, no session
          store, no cold starts. The architecture philosophy is zero bloat and instant
          response — every page is pre-rendered HTML plus a lean client-side bundle, and
          tool engines are written in strict TypeScript and designed to be
          deterministic: the same input always yields the same output, on every machine,
          every time.
        </p>

        <h2>Bug reports and contact</h2>
        <p>
          Found a parsing edge case, a calculation that looks wrong, or want to
          suggest a tool? Head over to the <a href="/contact/">contact page</a>{" "}
          — reproducible bug reports go straight into the engine&rsquo;s test
          suite.
        </p>

        <h2>Principles</h2>
        <ul>
          <li>
            <strong>Client-side by default.</strong> If a computation can run in your
            browser, it must run in your browser.
          </li>
          <li>
            <strong>Zero data retention.</strong> We do not receive, process, or store
            your tool input, because nothing is ever transmitted.
          </li>
          <li>
            <strong>Deterministic engines.</strong> No hidden server variability in
            parsing, formatting, or date math.
          </li>
          <li>
            <strong>Fast and stable.</strong> System fonts, fixed-size controls, and
            pre-rendered routes keep layout shift at zero.
          </li>
        </ul>

        <h2>Technology</h2>
        <p>
          The suite is built with Next.js App Router in static-export mode, TypeScript
          in strict mode, Tailwind CSS, and Lucide icons. The site is supported by
          unobtrusive advertising; ads never intercept, modify, or read tool input.
        </p>
      </article>
    </div>
  );
}
