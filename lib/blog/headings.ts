/**
 * Table-of-contents support shared by the MDX renderer and the post loader.
 *
 * Heading ids are computed from the raw MDX source (lib/blog/posts.ts side)
 * and from the rendered heading text (components/blog/mdx-content.tsx side).
 * Both paths MUST produce identical ids, which is why they share
 * `slugifyHeading` and why duplicate heading texts per document are rejected
 * at build time (no dedup suffixes to keep in sync).
 */

export type TocHeading = {
  id: string;
  text: string;
  /** 2 for ## headings, 3 for ### headings. */
  depth: 2 | 3;
};

/** GitHub-style slug: lowercase, punctuation stripped, whitespace → hyphens. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Unicode-aware strip: keeps letters/digits (incl. accents), drops
    // apostrophes, em dashes, ampersands, symbols.
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const FENCE_PATTERN = /^\s{0,3}(?:```|~~~)/;
const HEADING_PATTERN = /^(#{2,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/;

/**
 * Extracts h2/h3 headings from MDX source. Fenced code blocks are skipped so
 * `## examples` inside a ``` shell block never pollute the ToC. Throws on
 * duplicate heading text so anchor ids are always unambiguous.
 */
export function extractHeadings(body: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const seen = new Set<string>();

  const lines = body.split(/\r?\n/);
  let insideFence = false;

  for (const line of lines) {
    if (FENCE_PATTERN.test(line)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) continue;

    const match = HEADING_PATTERN.exec(line);
    if (!match) continue;

    const level = match[1];
    // Strip inline code backticks so "## The `-u` flag" reads "The -u flag"
    // in the ToC while keeping the id identical on the renderer side.
    const text = match[2]?.replace(/`([^`]*)`/g, "$1").trim() ?? "";
    if (!text) continue;

    const id = slugifyHeading(text);
    if (!id) continue;
    if (seen.has(id)) {
      throw new Error(
        `Duplicate heading "${text}" — heading texts must be unique per post so ToC anchor ids stay stable.`,
      );
    }
    seen.add(id);

    headings.push({ id, text, depth: level === "##" ? 2 : 3 });
  }

  return headings;
}
