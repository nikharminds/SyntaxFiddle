"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/salesforce-log/format";

/**
 * Generic, accessible data table for worker-returned collections that can
 * reach thousands of rows. Two DOM-safety guarantees:
 *
 *  1. Only one page of rows is ever mounted (default 25) — sorting operates
 *     on the data array inside a useMemo, never on rendered nodes.
 *  2. Column sort values are plain string/number accessors, so comparisons
 *     never touch React elements.
 *
 * Accessibility: caption for screen readers, `aria-sort` on the active
 * header, `<button>` sort triggers, a polite live region announcing the
 * visible range, and a labelled pagination `<nav>`.
 */

export type DataTableColumn<Row> = {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right";
  /** Extra classes applied to both the <th> and every <td>. */
  className?: string;
  /** Omit to make the column non-sortable. */
  sortValue?: (row: Row) => string | number;
  render: (row: Row) => React.ReactNode;
};

type SortDirection = "asc" | "desc";

type ActiveSort<Row> = {
  key: string;
  direction: SortDirection;
  value: (row: Row) => string | number;
};

export type DataTableProps<Row> = {
  /** Read by screen readers via <caption>; visually hidden. */
  caption: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
  emptyState?: React.ReactNode;
  /** Footer (counts + pagination) renders only when rows exceed the smallest option. */
  pageSizeOptions?: number[];
};

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  initialSortKey,
  initialSortDirection = "desc",
  emptyState,
  pageSizeOptions = [25, 50, 100],
}: DataTableProps<Row>) {
  const initialColumn = initialSortKey
    ? columns.find((column) => column.key === initialSortKey && column.sortValue)
    : undefined;

  const [sort, setSort] = React.useState<ActiveSort<Row> | null>(
    initialColumn && initialColumn.sortValue
      ? {
          key: initialColumn.key,
          direction: initialSortDirection,
          value: initialColumn.sortValue,
        }
      : null,
  );
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(pageSizeOptions[0] ?? 25);
  const selectId = React.useId();

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) => factor * compareValues(sort.value(a), sort.value(b)),
    );
  }, [rows, sort]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const end = Math.min(start + pageSize, total);

  const toggleSort = (column: DataTableColumn<Row>) => {
    if (!column.sortValue) return;
    setPage(0);
    setSort((current) => {
      if (current && current.key === column.key) {
        return current.direction === "asc"
          ? { key: column.key, direction: "desc", value: column.sortValue! }
          : { key: column.key, direction: "asc", value: column.sortValue! };
      }
      return { key: column.key, direction: "asc", value: column.sortValue! };
    });
  };

  if (total === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const showFooter = total > (pageSizeOptions[0] ?? 25);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              {columns.map((column) => {
                const sortable = column.sortValue !== undefined;
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      active
                        ? sort?.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : sortable
                          ? "none"
                          : undefined
                    }
                    className={cn(
                      "px-3 py-2.5 font-semibold text-zinc-300",
                      column.align === "right" ? "text-right" : "text-left",
                      column.className,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-zinc-100",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-emerald-300",
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === "asc" ? (
                            <ArrowUp size={12} aria-hidden />
                          ) : (
                            <ArrowDown size={12} aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-zinc-600" aria-hidden />
                        )}
                        <span className="sr-only">
                          {active
                            ? `, sorted ${sort?.direction === "asc" ? "ascending" : "descending"}`
                            : ", activate to sort"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr
                key={rowKey(row, start + index)}
                className="border-b border-zinc-800/50 transition-colors last:border-0 hover:bg-zinc-900/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-2.5 align-top",
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showFooter ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-xs text-zinc-500 tabular-nums">
            Showing {formatCount(start + 1)}–{formatCount(end)} of{" "}
            {formatCount(total)} rows
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={selectId} className="sr-only">
              Rows per page
            </label>
            <select
              id={selectId}
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
            <nav
              aria-label={`${caption} pagination`}
              className="flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={13} aria-hidden />
                <span className="sr-only">Previous page</span>
              </button>
              <span className="min-w-16 text-center text-xs text-zinc-400 tabular-nums">
                {currentPage + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
                disabled={currentPage >= pageCount - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight size={13} aria-hidden />
                <span className="sr-only">Next page</span>
              </button>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Inline notice for detail lists the parser capped to protect memory. */
export function CoverageNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-xs leading-5 text-amber-300/80">
      <span aria-hidden>⚠</span> {children}
    </p>
  );
}
