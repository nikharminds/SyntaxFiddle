import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const TITLE = "Cron Expression Generator & Tester";
const DESCRIPTION =
  "Free cron expression generator, tester, validator, and plain-English reader for Unix, Quartz, AWS EventBridge, Cloudflare, and Salesforce System.schedule — live run timeline and timezone-aware next runs.";

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
