import type { Metadata } from "next";
import { EyeOff, KeyRound, WifiOff } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { JwtLayout } from "@/components/jwt/JwtLayout";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "JWT Decoder — Inspect Header, Payload & Claims",
  description:
    "Decode JSON Web Tokens locally with color-coded header, payload, and signature segments, syntax-highlighted claims, and expiry checks. Decode-only and 100% client-side — tokens never leave your browser.",
  keywords: [
    "jwt decoder",
    "jwt debugger",
    "decode jwt",
    "json web token",
    "jwt inspector",
    "jwt claims",
    "bearer token",
    "base64url",
  ],
  alternates: { canonical: "/jwt-decoder/" },
};

export default function JwtPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <PageHero
          badges={
            <>
              <Badge variant="success">100% Client-Side</Badge>
              <Badge variant="outline">Zero Network Calls</Badge>
              <Badge variant="outline">Signature Never Verified</Badge>
            </>
          }
          title="JWT Decoder & Inspector"
          description="Paste a token and watch the header, payload, and signature light up in their standard colors while claims decode into readable JSON. This tool is decode-only — signatures are never verified because no secret ever reaches (or leaves) your browser."
          facts={[
            {
              icon: WifiOff,
              title: "Works offline",
              description: "Disable your Wi-Fi — decoding keeps working in this tab.",
            },
            {
              icon: EyeOff,
              title: "Zero network calls",
              description: "Tokens are parsed in-memory; verify it in your DevTools.",
            },
            {
              icon: KeyRound,
              title: "Decode-only by design",
              description: "No secrets required; signatures are never verified here.",
            },
          ]}
        />
      </header>

      <section aria-label="JWT playground" className="mt-8">
        <JwtLayout />
      </section>

      <AdUnit format="leaderboard" className="mt-10" />
    </div>
  );
}
