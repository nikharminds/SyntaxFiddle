import { describe, expect, it } from "vitest";
import {
  assertConverterRouteIntegrity,
  CONVERTER_ROUTES,
  getAllConverterSlugs,
  RESERVED_ROUTES,
  type SeoConverterRoute,
} from "../converters";

// Importing the module already ran the module-scope integrity assertion —
// reaching these tests proves the shipped registry is valid.

const EXPECTED_SLUGS = [
  "curl-to-salesforce-apex",
  "curl-to-python-requests",
  "curl-to-javascript-fetch",
  "json-to-zod",
  "json-to-pydantic",
];

/** Minimal valid route for exercising the guard's failure paths. */
function makeRoute(overrides: Partial<SeoConverterRoute> = {}): SeoConverterRoute {
  return {
    slug: "valid-slug",
    toolType: "curl",
    sourceName: "cURL",
    targetName: "Target",
    metaTitle: "Meta Title",
    metaDescription: "Meta description.",
    h1: "H1",
    tagline: "Tagline",
    preloadedInput: "input",
    staticSeoExplanation: "Explanation",
    syntaxHighlights: [{ title: "T", description: "D" }],
    faq: [{ question: "Q", answer: "A" }],
    relatedSlugs: [],
    ...overrides,
  };
}

describe("converter registry", () => {
  it("contains the six converter routes", () => {
    expect(getAllConverterSlugs()).toEqual(EXPECTED_SLUGS);
  });

  it("never claims a reserved route segment", () => {
    for (const slug of getAllConverterSlugs()) {
      expect(RESERVED_ROUTES).not.toContain(slug);
    }
  });

  it("keeps Record keys in sync with entry slugs", () => {
    for (const [key, route] of Object.entries(CONVERTER_ROUTES)) {
      expect(key).toBe(route.slug);
    }
    expect(Object.keys(CONVERTER_ROUTES).sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  it("resolves every relatedSlug inside the registry without self-links", () => {
    for (const route of Object.values(CONVERTER_ROUTES)) {
      expect(route.relatedSlugs.length).toBeGreaterThan(0);
      for (const related of route.relatedSlugs) {
        expect(related).not.toBe(route.slug);
        expect(CONVERTER_ROUTES[related]).toBeDefined();
      }
    }
  });

  it("passes the integrity assertion for the shipped registry", () => {
    expect(() => assertConverterRouteIntegrity()).not.toThrow();
  });

  it("consolidated curl pages target both keyword variants with ported docs", () => {
    const variants: Record<string, [string, string]> = {
      "curl-to-salesforce-apex": ["curl to apex", "curl to salesforce apex"],
      "curl-to-python-requests": ["curl to python", "curl to python requests"],
      "curl-to-javascript-fetch": ["curl to fetch", "curl to javascript fetch"],
    };

    for (const [slug, [shortVariant, longVariant]] of Object.entries(variants)) {
      const route = CONVERTER_ROUTES[slug];
      expect(route, slug).toBeDefined();
      if (!route) continue;
      expect(route.keywords, slug).toContain(shortVariant);
      expect(route.keywords, slug).toContain(longVariant);
      expect(route.sections?.length ?? 0, slug).toBeGreaterThanOrEqual(3);
      expect(route.faq.length, slug).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("registry guard (failure paths)", () => {
  it("throws a hard error when a slug collides with a reserved route", () => {
    expect(() =>
      assertConverterRouteIntegrity([makeRoute({ slug: "jwt" })]),
    ).toThrow(/collides with a reserved route/u);
  });

  it("throws when a slug collides with the root route", () => {
    expect(() => assertConverterRouteIntegrity([makeRoute({ slug: "" })])).toThrow(
      /collides with a reserved route/u,
    );
  });

  it("throws on non-kebab-case slugs", () => {
    expect(() =>
      assertConverterRouteIntegrity([makeRoute({ slug: "Bad_Slug" })]),
    ).toThrow(/kebab-case/u);
  });

  it("throws on duplicate slugs", () => {
    expect(() =>
      assertConverterRouteIntegrity([makeRoute(), makeRoute()]),
    ).toThrow(/Duplicate slug/u);
  });

  it("throws on dangling relatedSlugs", () => {
    expect(() =>
      assertConverterRouteIntegrity([
        makeRoute({ slug: "route-a", relatedSlugs: ["does-not-exist"] }),
      ]),
    ).toThrow(/unknown relatedSlug/u);
  });

  it("throws on self-referencing relatedSlugs", () => {
    expect(() =>
      assertConverterRouteIntegrity([
        makeRoute({ slug: "route-a", relatedSlugs: ["route-a"] }),
      ]),
    ).toThrow(/links to itself/u);
  });
});
