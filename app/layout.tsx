import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { GoogleAnalytics } from "@/components/shared/analytics";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SyntaxFiddle — Client-Side Developer Utilities",
    template: "%s · SyntaxFiddle",
  },
  description:
    "Free, private, browser-based developer tools. Cron expression visualizer and simulator, CSV to SQL/JSON converter, and more — 100% client-side, zero data logged.",
  keywords: [
    "developer tools",
    "cron visualizer",
    "cron simulator",
    "crontab generator",
    "csv to sql",
    "csv to json",
    "curl converter",
    "curl to fetch",
    "curl to python",
    "curl to php",
    "curl to go",
    "curl to c#",
    "curl to java",
    "client-side tools",
    "privacy-first tools",
  ],
  openGraph: {
    type: "website",
    siteName: "SyntaxFiddle",
    url: `${SITE_URL}/`,
    title: "SyntaxFiddle — Client-Side Developer Utilities",
    description:
      "Free, private, browser-based developer tools. Cron expression visualizer and simulator, CSV to SQL/JSON converter, cURL converter, and more — 100% client-side, zero data logged.",
    images: [{ url: `${SITE_URL}/og/site.jpg`, width: 1200, height: 630, alt: "SyntaxFiddle" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SyntaxFiddle — Client-Side Developer Utilities",
    description:
      "Free, private, browser-based developer tools. 100% client-side, zero data logged.",
    images: [`${SITE_URL}/og/site.jpg`],
  },
  applicationName: "SyntaxFiddle",
  robots: { index: true, follow: true },
  alternates: {
    // RSS autodiscovery — feed readers and crawlers pick this up on every page.
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "SyntaxFiddle Blog" }] },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ToastProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-zinc-100"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <GoogleAnalytics />
        </ToastProvider>
      </body>
    </html>
  );
}
