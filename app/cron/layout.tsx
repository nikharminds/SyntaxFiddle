import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cron Expression Visualizer & Simulator",
  description:
    "Parse, explain, and simulate cron expressions for Unix, AWS EventBridge, Quartz, and Cloudflare dialects — with a 24-hour run timeline and timezone-aware next runs, 100% in your browser.",
};

export default function CronLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
