"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, ShieldCheck, Terminal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";
import type { SourceFormat } from "@/lib/converter/types";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/cron", label: "Cron Visualizer", badge: undefined as string | undefined },
  { href: "/regex-tester", label: "Regex", badge: undefined as string | undefined },
  { href: "/jwt-decoder", label: "JWT", badge: undefined as string | undefined },
] as const;

const CONVERTER_GROUPS: {
  label: string;
  items: { href: string; label: string }[];
}[] = (["csv", "excel"] as SourceFormat[]).map((source) => ({
  label: source === "csv" ? "From CSV" : "From Excel",
  items: CONVERSION_PAIRS.filter((pair) => pair.source === source).map((pair) => ({
    href: `/${pair.slug}/`,
    label: `${pair.sourceLabel} to ${pair.targetLabel}`,
  })),
}));

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [convertersOpen, setConvertersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const convertersActive =
    pathname === "/csv" ||
    pathname.startsWith("/csv/") ||
    CONVERSION_PAIRS.some(
      (pair) => pathname === `/${pair.slug}` || pathname.startsWith(`/${pair.slug}/`),
    );

  useEffect(() => {
    if (!convertersOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConvertersOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setConvertersOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [convertersOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md text-zinc-100 transition-colors hover:text-emerald-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <Terminal size={16} className="text-emerald-400" />
          </span>
          <span className="text-base font-semibold tracking-tight">SyntaxFiddle</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
            >
              {link.label}
              {link.badge ? (
                <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                  {link.badge}
                </Badge>
              ) : null}
            </Link>
          ))}

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-expanded={convertersOpen}
              aria-haspopup="true"
              onClick={() => setConvertersOpen((current) => !current)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                convertersOpen || convertersActive
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              Converters
              <ChevronDown
                size={14}
                className={cn("transition-transform", convertersOpen && "rotate-180")}
              />
            </button>
            <div
              hidden={!convertersOpen}
              className="absolute left-0 top-full z-50 mt-1 w-[400px] rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl shadow-black/40"
            >
              <Link
                href="/csv/"
                onClick={() => setConvertersOpen(false)}
                className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                Conversion Studio
                <span aria-hidden>→</span>
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {CONVERTER_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {group.label}
                    </p>
                    <ul className="list-none space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setConvertersOpen(false)}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={cn(
                              "block rounded-md px-2 py-1.5 text-sm transition-colors",
                              isActive(item.href)
                                ? "bg-zinc-900 text-zinc-100"
                                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="hidden sm:inline-flex" title="100% Client-Side / Zero Data Logged">
            <ShieldCheck size={12} />
            <span className="hidden lg:inline">100% Client-Side / Zero Data Logged</span>
            <span className="lg:hidden">Client-Side</span>
          </Badge>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-zinc-800/80 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                {link.label}
                {link.badge ? (
                  <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                    {link.badge}
                  </Badge>
                ) : null}
              </Link>
            ))}
            <Link
              href="/csv/"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive("/csv")
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              Conversion Studio
            </Link>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Converters
            </p>
            {CONVERSION_PAIRS.map((pair) => (
              <Link
                key={pair.slug}
                href={`/${pair.slug}/`}
                onClick={() => setOpen(false)}
                aria-current={isActive(`/${pair.slug}`) ? "page" : undefined}
                className={cn(
                  "block rounded-md py-1.5 pl-6 pr-3 text-sm transition-colors",
                  isActive(`/${pair.slug}`)
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                )}
              >
                {pair.sourceLabel} to {pair.targetLabel}
              </Link>
            ))}
            <p className="flex items-center gap-2 px-3 pb-1 pt-2 text-xs text-zinc-500">
              <ShieldCheck size={12} className="text-emerald-400" />
              100% Client-Side / Zero Data Logged
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
