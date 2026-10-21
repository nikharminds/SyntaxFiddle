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
    "client-side tools",
    "privacy-first tools",
  ],
  applicationName: "SyntaxFiddle",
  robots: { index: true, follow: true },
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
    <html lang="en" className="dark" suppressHydrationWarning>
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
