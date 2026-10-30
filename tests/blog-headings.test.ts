import { describe, expect, it } from "vitest";
import { extractHeadings, slugifyHeading } from "../lib/blog/headings";
import { getAllPosts } from "../lib/blog/posts";

describe("slugifyHeading", () => {
  it("keeps letters, digits, and hyphens", () => {
    expect(slugifyHeading("Cron Expressions Explained")).toBe("cron-expressions-explained");
  });

  it("strips punctuation, symbols, and em dashes", () => {
    expect(slugifyHeading("The asterisk — every value")).toBe("the-asterisk-every-value");
    expect(slugifyHeading("Don't do this")).toBe("dont-do-this");
    expect(slugifyHeading("What is the */5 syntax?")).toBe("what-is-the-5-syntax");
  });

  it("collapses whitespace and stray hyphens", () => {
    expect(slugifyHeading("  Strict   vs   loose  ")).toBe("strict-vs-loose");
    expect(slugifyHeading("a - - b")).toBe("a-b");
  });
});

describe("extractHeadings", () => {
  const body = [
    "Intro paragraph.",
    "",
    "## Why cron breaks",
    "",
    "```bash",
    "## not a heading inside a fence",
    "### nor this",
    "```",
    "",
    "### Field by field",
    "",
    "#### Too deep to index",
    "",
    "## Special characters",
    "",
    "The `## inline` mention is not a heading either.",
  ].join("\n");

  it("extracts h2 and h3 with slugified ids", () => {
    const headings = extractHeadings(body);
    expect(headings).toEqual([
      { id: "why-cron-breaks", text: "Why cron breaks", depth: 2 },
      { id: "field-by-field", text: "Field by field", depth: 3 },
      { id: "special-characters", text: "Special characters", depth: 2 },
    ]);
  });

  it("strips inline code backticks from heading text", () => {
    const headings = extractHeadings("## The `-u` flag");
    expect(headings[0]?.text).toBe("The -u flag");
    // Consecutive hyphens collapse (spaces around the stripped dashes).
    expect(headings[0]?.id).toBe("the-u-flag");
  });

  it("rejects duplicate heading text so anchor ids stay unique", () => {
    expect(() => extractHeadings("## Same\n\n## Same")).toThrow(/Duplicate heading/);
  });

  it("returns empty for bodies without headings", () => {
    expect(extractHeadings("Just prose.\n\nMore prose.")).toEqual([]);
  });
});

describe("content/blog ToC integrity", () => {
  it("extracts at least one heading from every shipped post", () => {
    for (const post of getAllPosts()) {
      const headings = extractHeadings(post.body);
      expect(headings.length).toBeGreaterThan(0);
      for (const heading of headings) {
        expect(heading.id).not.toBe("");
        expect([2, 3]).toContain(heading.depth);
      }
    }
  });
});
