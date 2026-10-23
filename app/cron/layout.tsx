import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const TITLE = "Cron Expression Tester & Generator";
const DESCRIPTION =
  "Cron expression tester and generator for Unix, Quartz, AWS EventBridge, and Cloudflare — live run timeline, timezone-aware next runs, and plain-English output.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/cron/` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/cron/`,
    type: "website",
    siteName: "SyntaxFiddle",
    images: [{ url: `${SITE_URL}/og/cron.jpg`, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og/cron.jpg`],
  },
};

export default function CronLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
