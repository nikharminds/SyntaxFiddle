import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the SyntaxFiddle team — bug reports, tool suggestions, feedback, and partnership inquiries. Email us or open an issue on GitHub.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <article className="prose max-w-none prose-headings:tracking-tight">
        <h1>Contact SyntaxFiddle</h1>
        <p>
          Questions, bug reports, tool suggestions, feedback — we read
          everything. The fastest way to reach us is email:{" "}
          <a href="mailto:nikharminds@gmail.com">nikharminds@gmail.com</a>.
        </p>

        <h2>Bug reports</h2>
        <p>
          Found a parsing edge case or a result that looks wrong? Include the
          tool, the exact input, and the expected behavior — reproducible
          reports go straight into the engine&rsquo;s test suite. You can also{" "}
          <a href="https://github.com/nikharminds/SyntaxFiddle/issues">
            open an issue on GitHub
          </a>
          .
        </p>

        <h2>Tool suggestions</h2>
        <p>
          Missing a converter or a cron dialect? Send the use case and a sample
          input. Suggestions that fit the platform&rsquo;s client-side,
          deterministic philosophy get prioritized.
        </p>

        <h2>Everything else</h2>
        <p>
          Support questions, partnership inquiries, advertising questions, or
          anything else:{" "}
          <a href="mailto:nikharminds@gmail.com">nikharminds@gmail.com</a>. As a
          distributed, remote-first project we work across timezones and aim to
          reply within a few business days.
        </p>

        <h2>How your message is handled</h2>
        <p>
          There is no contact form and no ticketing system — email is the only
          channel, and nothing about your visit is logged server-side (the site
          is pure static assets). See the{" "}
          <a href="/privacy/">privacy policy</a> for details.
        </p>
      </article>
    </div>
  );
}
