import Link from "next/link";
import { ArrowRight, Braces, FileJson, KeyRound, Terminal, WifiOff, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type SecurityTool = {
  href: string;
  name: string;
  badge: string;
  badgeVariant: "success" | "info";
  description: string;
  chips: string[];
  icon: LucideIcon;
  cta: string;
};

const SECURITY_TOOLS: SecurityTool[] = [
  {
    href: "/jwt-decoder",
    name: "JWT Decoder",
    badge: "Offline Secure",
    badgeVariant: "success",
    description:
      "Decode JSON Web Tokens with color-coded header, payload, and signature segments — parsed by your browser, never transmitted. Disable your Wi-Fi and it still works.",
    chips: ["Base64Url + UTF-8", "Live exp checks", "Signature never verified"],
    icon: KeyRound,
    cta: "Open decoder",
  },
  {
    href: "/regex-tester",
    name: "Regex Tester",
    badge: "JS Flavor",
    badgeVariant: "info",
    description:
      "Test JavaScript regular expressions with real-time match highlighting and underlined named capture groups — evaluated in a sandboxed worker that cannot freeze your tab.",
    chips: ["Live highlighting", "g i m s u y flags", "ReDoS watchdog"],
    icon: Braces,
    cta: "Open tester",
  },
  {
    href: "/curl-converter",
    name: "cURL Converter",
    badge: "Zero Upload",
    badgeVariant: "success",
    description:
      "Paste a cURL command and get idiomatic fetch(), axios, or Python requests code — bearer tokens, cookies, and basic-auth credentials are parsed by your browser and never transmitted.",
    chips: ["fetch · axios · Python", "Basic auth & JSON bodies", "100 ms live transpile"],
    icon: Terminal,
    cta: "Open converter",
  },
  {
    href: "/json-to-schema",
    name: "JSON to Schema Converter",
    badge: "Web Worker",
    badgeVariant: "info",
    description:
      "Infer Zod schemas, TypeScript interfaces, Pydantic models, or Go structs from any JSON payload — unions, optionals, and ISO-8601 dates included. Generation runs in a local worker guarded by a watchdog, so payloads with PII are never uploaded.",
    chips: ["Zod · TS · Pydantic · Go", "Unions & optional fields", "3 s watchdog"],
    icon: FileJson,
    cta: "Open generator",
  },
];

export function SecurityTextSection() {
  return (
    <section
      aria-labelledby="security-text-heading"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="security-text-heading" className="text-2xl font-bold tracking-tight text-zinc-100">
            Security &amp; Text Parsing
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Decode credentials and dissect patterns without a server in sight — the
            newest additions to the hub.
          </p>
        </div>
        <Badge variant="outline">
          <WifiOff size={12} className="text-emerald-400" />
          Works offline
        </Badge>
      </div>

      <ul className="mt-8 grid list-none gap-4 md:grid-cols-2">
        {SECURITY_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.href}>
              <Card hover className="h-full">
                <Link
                  href={tool.href}
                  className="flex h-full flex-col gap-4 p-6 focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                      <Icon size={20} className="text-emerald-400" />
                    </span>
                    <Badge variant={tool.badgeVariant}>{tool.badge}</Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
                      {tool.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{tool.description}</p>
                  </div>
                  <ul className="flex flex-wrap gap-1.5" aria-hidden="true">
                    {tool.chips.map((chip) => (
                      <li
                        key={chip}
                        className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-emerald-400/90"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    {tool.cta}
                    <ArrowRight size={15} />
                  </span>
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
