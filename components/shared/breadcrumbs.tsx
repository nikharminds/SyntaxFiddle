import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export type BreadcrumbItem = { label: string; href?: string };

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
  currentPageClassName?: string;
};

/**
 * Single source of truth for breadcrumb navigation: renders the visible
 * trail AND the schema.org BreadcrumbList JSON-LD that lets search engines
 * display labeled trails (syntaxfiddle.com › Cron › …) in search results.
 * The last item is treated as the current page (no link, no `item` in JSON-LD).
 */
export function Breadcrumbs({ items, className, currentPageClassName }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href && index < items.length - 1 ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {!isLast && item.href ? (
                  <Link href={item.href} className="transition-colors hover:text-emerald-400">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? currentPageClassName ?? "text-zinc-300" : "text-zinc-300"}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
