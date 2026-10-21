import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for SyntaxFiddle. 100% client-side tools: no data collection, no server-side processing, zero tool input logged.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <article className="prose prose-invert prose-zinc max-w-none prose-headings:tracking-tight">
        <h1>Privacy Policy</h1>
        <p>
          <em>Last updated: October 21, 2026</em>
        </p>
        <p>
          This policy explains what information SyntaxFiddle (&ldquo;we&rdquo;,
          &ldquo;the site&rdquo;) does and does not collect. The short version: the
          tools run entirely in your browser, and your input never leaves your device.
        </p>

        <h2>100% Client-Side Processing</h2>
        <p>
          Expressions and inputs are parsed entirely within your browser&rsquo;s
          JavaScript engine. No source strings, expressions, or IP addresses are ever
          transmitted, saved, or inspected on our servers. All utilities on this site —
          including the cron expression visualizer and the CSV converter — execute
          locally: expressions, files, and converted output are processed in memory on
          your machine, and there is no backend to receive them.
        </p>

        <h2>Information we do not collect</h2>
        <ul>
          <li>We do not collect, process, or store tool input or output.</li>
          <li>We do not require accounts, and we do not set authentication cookies.</li>
          <li>We do not maintain server-side session or analytics databases.</li>
        </ul>

        <h2>Traffic analytics</h2>
        <p>
          We use Google Analytics to understand aggregate site usage — such as page
          views, approximate geographic region, browser, and referral source. Google
          Analytics sets cookies and processes data (including your IP address, in
          truncated form where supported) under Google&rsquo;s own terms. Analytics
          tracking covers page traffic only; it has no access to tool input, output,
          or files, all of which remain strictly local to your browser. You can block
          analytics cookies through your browser settings or via{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noreferrer"
          >
            Google&rsquo;s official opt-out browser add-on
          </a>
          .
        </p>

        <h2>Cookies and advertising</h2>
        <p>
          This site displays advertising served by Google AdSense. Third-party vendors,
          including Google, use cookies to serve ads based on a user&rsquo;s prior
          visits to this website or other websites. Google&rsquo;s use of advertising
          cookies enables it and its partners to serve ads to you based on your visit to
          this site and/or other sites on the Internet. You may opt out of personalized
          advertising by visiting{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            Google Ads Settings (adssettings.google.com)
          </a>
          , or opt out of third-party vendor cookies at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
            aboutads.info/choices
          </a>
          . Advertising cookies are set by Google and its vendors — never by us — and
          advertising scripts have no access to tool input, which remains strictly
          local.
        </p>

        <h2>Local browser storage</h2>
        <p>
          Preference data (such as a selected cron dialect) may be persisted in your
          browser&rsquo;s localStorage. This data stays on your device, is never
          transmitted, and can be cleared at any time through your browser settings.
        </p>

        <h2>Third-party hosting and CDNs</h2>
        <p>
          The site is delivered as static files through a content delivery network. The
          hosting provider may log standard request metadata (such as IP address and
          user agent) for security and delivery purposes, as is typical for any website.
          These logs relate to asset delivery only and are not associated with your use
          of any tool.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, the revised version will be posted on this page with
          an updated date above. Material changes will be reflected in the page content.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy, or about how any tool on this site handles
          data? Email us at{" "}
          <a href="mailto:nikharminds@gmail.com">nikharminds@gmail.com</a> and we
          will respond within a few business days.
        </p>
      </article>
    </div>
  );
}
