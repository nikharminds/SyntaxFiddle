// Fixed timeZone keeps rendered dates identical across build machines.
// Lives in its own module (no node:fs imports) so client components can use
// it without pulling the file-system-based post loader into the browser bundle.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Short date for cards and meta rows. */
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** UTC timestamp for a frontmatter date — used by JSON-LD and OpenGraph. */
export function toUtcTimestamp(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toISOString();
}
