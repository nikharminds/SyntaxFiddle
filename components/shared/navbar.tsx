"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CodeXml, Menu, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";
import type { SourceFormat } from "@/lib/converter/types";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/cron", label: "Cron Visualizer", badge: undefined as string | undefined },
  { href: "/regex-tester", label: "Regex", badge: undefined as string | undefined },
  { href: "/jwt-decoder", label: "JWT", badge: undefined as string | undefined },
  { href: "/curl-converter", label: "cURL Converter", badge: undefined as string | undefined },
] as const;

const DATA_GROUPS: {
  label: string;
  href: string;
  items: { href: string; label: string }[];
}[] = [
  {
    label: "JSON to Schema",
    href: "/json-to-schema/",
    items: [
      { href: "/json-to-zod/", label: "JSON to Zod" },
      { href: "/json-to-typescript/", label: "JSON to TypeScript" },
      { href: "/json-to-pydantic/", label: "JSON to Pydantic" },
      { href: "/json-to-go-struct/", label: "JSON to Go Struct" },
    ],
  },
  {
    label: "XML to Schema",
    href: "/xml-to-schema/",
    items: [
      { href: "/xml-to-zod/", label: "XML to Zod" },
      { href: "/xml-to-typescript/", label: "XML to TypeScript" },
      { href: "/xml-to-pydantic/", label: "XML to Pydantic" },
      { href: "/xml-to-go-struct/", label: "XML to Go Struct" },
    ],
  },
];

const CONVERTER_GROUPS: {
  label: string;
  items: { href: string; label: string }[];
}[] = [
  ...( ["csv", "excel"] as SourceFormat[]).map((source) => ({
    label: source === "csv" ? "From CSV" : "From Excel",
    items: CONVERSION_PAIRS.filter((pair) => pair.source === source).map((pair) => ({
      href: `/${pair.slug}/`,
      label: `${pair.sourceLabel} to ${pair.targetLabel}`,
    })),
  })),
  {
    label: "From XML",
    items: CONVERSION_PAIRS.filter((pair) => pair.source === "xml").map((pair) => ({
      href: `/${pair.slug}/`,
      label: `${pair.sourceLabel} to ${pair.targetLabel}`,
    })),
  },
  {
    label: "To Spreadsheet",
    items: CONVERSION_PAIRS.filter((pair) => pair.source === "json" || pair.source === "sql").map(
      (pair) => ({
        href: `/${pair.slug}/`,
        label: `${pair.sourceLabel} to ${pair.targetLabel}`,
      }),
    ),
  },
];

type MenuId = "converters" | "data";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [openSection, setOpenSection] = useState<MenuId | null>(null);
  const convertersRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const convertersActive =
    pathname === "/csv" ||
    pathname.startsWith("/csv/") ||
    CONVERSION_PAIRS.some(
      (pair) => pathname === `/${pair.slug}` || pathname.startsWith(`/${pair.slug}/`),
    );
  const dataActive = pathname.startsWith("/json-to") || pathname.startsWith("/xml-to");

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (convertersRef.current?.contains(target)) return;
      if (dataRef.current?.contains(target)) return;
      setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [openMenu]);

  const closeMenus = () => {
    setOpen(false);
    setOpenMenu(null);
    setOpenSection(null);
  };

  const toggleSection = (section: MenuId) =>
    setOpenSection(openSection === section ? null : section);

  const renderDesktopLinkClasses = (active: boolean, highlighted = false) =>
    cn(
      "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active || highlighted
        ? "bg-zinc-900 text-zinc-100"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
    );
  const renderSubLinkClasses = (active: boolean) =>
    cn(
      "block rounded-md px-2 py-1.5 text-sm transition-colors",
      active
        ? "bg-zinc-900 text-zinc-100"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
    );

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
            <CodeXml size={16} className="text-emerald-400" />
          </span>
          <span className="text-base font-semibold tracking-tight">SyntaxFiddle</span>
        </Link>

        <div className="hidden items-center gap-1.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={renderDesktopLinkClasses(isActive(link.href))}
            >
              {link.label}
              {link.badge ? (
                <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                  {link.badge}
                </Badge>
              ) : null}
            </Link>
          ))}

          <div ref={convertersRef} className="relative">
            <button
              type="button"
              aria-expanded={openMenu === "converters"}
              aria-haspopup="true"
              onClick={() => setOpenMenu(openMenu === "converters" ? null : "converters")}
              className={renderDesktopLinkClasses(
                openMenu === "converters" || convertersActive,
              )}
            >
              Converters
              <ChevronDown
                size={14}
                className={cn("transition-transform", openMenu === "converters" && "rotate-180")}
              />
            </button>
            <div
              hidden={openMenu !== "converters"}
              className="absolute left-0 top-full z-50 mt-1 w-[400px] rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl shadow-black/40"
            >
              <Link
                href="/csv/"
                onClick={closeMenus}
                className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
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
                            onClick={closeMenus}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={renderSubLinkClasses(isActive(item.href))}
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

          <div ref={dataRef} className="relative">
            <button
              type="button"
              aria-expanded={openMenu === "data"}
              aria-haspopup="true"
              onClick={() => setOpenMenu(openMenu === "data" ? null : "data")}
              className={renderDesktopLinkClasses(openMenu === "data" || dataActive)}
            >
              Data &amp; Schemas
              <ChevronDown
                size={14}
                className={cn("transition-transform", openMenu === "data" && "rotate-180")}
              />
            </button>
            <div
              hidden={openMenu !== "data"}
              className="absolute left-0 top-full z-50 mt-1 w-[440px] rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl shadow-black/40"
            >
              <div className="grid grid-cols-2 gap-5">
                {DATA_GROUPS.map((group) => (
                  <div key={group.label}>
                    <Link
                      href={group.href}
                      onClick={closeMenus}
                      className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      {group.label}
                      <span aria-hidden>→</span>
                    </Link>
                    <ul className="mt-2 list-none space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={closeMenus}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={renderSubLinkClasses(isActive(item.href))}
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
          <ThemeToggle />
          <Badge variant="success" className="hidden sm:inline-flex" title="100% Client-Side / Zero Data Logged">
            <ShieldCheck size={12} />
            <span className="hidden xl:inline">100% Client-Side / Zero Data Logged</span>
            <span className="xl:hidden">Client-Side</span>
          </Badge>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => {
              setOpen((current) => !current);
              setOpenSection(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-zinc-800/80 lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenus}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
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
              onClick={closeMenus}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive("/csv")
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              Conversion Studio
            </Link>

            <button
              type="button"
              aria-expanded={openSection === "converters"}
              aria-controls="mobile-converters-section"
              onClick={() => toggleSection("converters")}
              className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Converters
              <ChevronDown
                size={14}
                aria-hidden
                className={cn(
                  "transition-transform",
                  openSection === "converters" && "rotate-180",
                )}
              />
            </button>
            <div
              id="mobile-converters-section"
              aria-hidden={openSection !== "converters"}
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                openSection === "converters"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
              inert={openSection !== "converters"}
            >
              <div className="overflow-hidden">
                {CONVERTER_GROUPS.map((group) => (
                  <div key={group.label} className="pt-2">
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenus}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(
                          "block rounded-md py-1.5 pl-5 pr-3 text-sm transition-colors",
                          isActive(item.href)
                            ? "bg-zinc-900 text-zinc-100"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              aria-expanded={openSection === "data"}
              aria-controls="mobile-data-section"
              onClick={() => toggleSection("data")}
              className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Data &amp; Schemas
              <ChevronDown
                size={14}
                aria-hidden
                className={cn(
                  "transition-transform",
                  openSection === "data" && "rotate-180",
                )}
              />
            </button>
            <div
              id="mobile-data-section"
              aria-hidden={openSection !== "data"}
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                openSection === "data"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
              inert={openSection !== "data"}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 gap-2 pb-1 pt-2">
                  {DATA_GROUPS.map((group) => (
                    <div key={group.label}>
                      <Link
                        href={group.href}
                        onClick={closeMenus}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                          isActive(group.href)
                            ? "text-emerald-400"
                            : "text-zinc-500 hover:text-zinc-300",
                        )}
                      >
                        {group.label}
                      </Link>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMenus}
                          aria-current={isActive(item.href) ? "page" : undefined}
                          className={cn(
                            "block rounded-md py-1.5 pl-4 pr-2 text-sm transition-colors",
                            isActive(item.href)
                              ? "bg-zinc-900 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
