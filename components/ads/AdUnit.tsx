"use client";

import { useEffect } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

const FORMAT_CLASSES = {
  "top-workspace": "min-h-[50px] md:min-h-[90px] w-full",
  "bottom-content": "min-h-[280px] sm:min-w-[336px] w-full",
  leaderboard: "min-h-[50px] md:min-h-[90px] w-full max-w-[728px]",
  rectangle: "min-h-[250px] w-full max-w-[300px]",
  "in-feed": "min-h-[100px] w-full",
} as const;

export type AdFormat = keyof typeof FORMAT_CLASSES;

export type AdUnitProps = {
  format: AdFormat;
  slot?: string;
  className?: string;
};

export function AdUnit({ format, slot, className }: AdUnitProps) {
  if (!ADS_ENABLED || !ADSENSE_CLIENT) {
    return null;
  }

  useEffect(() => {
    try {
      const globalWindow = window as unknown as { adsbygoogle?: unknown[] };
      globalWindow.adsbygoogle = globalWindow.adsbygoogle || [];
      globalWindow.adsbygoogle.push({});
    } catch {
      return;
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        "mx-auto flex w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/40",
        FORMAT_CLASSES[format],
        className
      )}
    >
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
