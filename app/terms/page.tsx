import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for SyntaxFiddle — acceptable use, licensing, and disclaimers for the client-side developer utilities.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <article className="prose prose-invert prose-zinc max-w-none prose-headings:tracking-tight">
        <h1>Terms of Service</h1>
        <p>
          <em>Last updated: October 20, 2026</em>
        </p>
        <p>
          By accessing or using SyntaxFiddle (the &ldquo;site&rdquo;), you agree to
          these terms. If you do not agree, please do not use the site.
        </p>

        <h2>Use of the service</h2>
        <p>
          The site provides free, browser-based developer utilities. You may use them
          for any lawful personal or commercial purpose. You agree not to attempt to
          disrupt availability, reverse the static delivery layer for malicious
          purposes, or use the site in violation of applicable laws.
        </p>

        <h2>No warranty</h2>
        <p>
          The tools are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          without warranties of any kind, express or implied. While the engines are
          built to be deterministic and well tested, users are responsible for verifying
          schedules prior to deploying critical production jobs. Always validate
          generated output — such as cron schedules or SQL statements — in a staging
          environment first. We are not liable for damages arising from reliance on tool
          output.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, the site&rsquo;s operators shall not
          be liable for any indirect, incidental, special, or consequential damages
          resulting from your use of, or inability to use, the site or its tools.
        </p>

        <h2>Advertising</h2>
        <p>
          The site may display third-party advertisements, including Google AdSense.
          Advertisements are clearly distinguishable from tool functionality and do not
          alter, intercept, or read tool input.
        </p>

        <h2>Intellectual property</h2>
        <p>
          The site design, branding, and original content are the property of their
          respective owners. You retain full ownership of any data you process with the
          tools; because processing is local, your data is never copied to us.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated from time to time. Continued use of the site after
          changes are posted constitutes acceptance of the revised terms. The current
          version is always available on this page.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these terms — or anything else related to the site,
          including support, bug reports, and partnership inquiries — contact us at{" "}
          <a href="mailto:nikharminds@gmail.com">nikharminds@gmail.com</a>. We aim to
          respond within a few business days.
        </p>
      </article>
    </div>
  );
}
