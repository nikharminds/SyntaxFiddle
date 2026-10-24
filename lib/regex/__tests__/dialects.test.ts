import { describe, expect, it } from "vitest";
import {
  REGEX_FLAVORS,
  getRegexFlavor,
  translateDialectPattern,
} from "../dialects";

describe("dialect translation: MySQL", () => {
  it("expands POSIX bracket classes to explicit ASCII classes", () => {
    const result = translateDialectPattern("mysql", "^[[:alpha:]]+_[[:digit:]]+$", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("^[A-Za-z]+_[0-9]+$");
      expect(result.notices.some((notice) => notice.includes("[:alpha:]"))).toBe(true);
    }
  });

  it("expands negated POSIX classes", () => {
    const result = translateDialectPattern("mysql", "[[:^space:]]+", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("[^ \\t\\r\\n\\v\\f]+");
  });

  it("forces the case-insensitive flag with a notice", () => {
    const result = translateDialectPattern("mysql", "select\\s+\\w+", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsFlags).toContain("i");
      expect(result.notices.some((notice) => notice.includes("case-insensitive"))).toBe(true);
    }
  });

  it("keeps the user's case sensitivity untouched when i is already set", () => {
    const result = translateDialectPattern("mysql", "abc", "gi");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsFlags).toBe("gi");
      expect(result.notices.some((notice) => notice.includes("case-insensitive"))).toBe(false);
    }
  });

  it("warns that \\d style escapes require MySQL 8+", () => {
    const result = translateDialectPattern("mysql", "\\d{4}-\\d{2}", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("\\d{4}-\\d{2}");
      expect(result.notices.some((notice) => notice.includes("MySQL 8.0+"))).toBe(true);
    }
  });

  it("blocks lookahead-free recursion constructs is not applicable; possessive is blocked", () => {
    const result = translateDialectPattern("mysql", "a*+", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Possessive quantifier");
  });
});

describe("dialect translation: Python", () => {
  it("rewrites (?P<name>...) to (?<name>...)", () => {
    const result = translateDialectPattern("python", "(?P<year>\\d{4})-(?P<month>\\d{2})", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(?<year>\\d{4})-(?<month>\\d{2})");
  });

  it("rewrites (?P=name) backreferences to \\k<name>", () => {
    const result = translateDialectPattern("python", "(?P<w>\\w+)\\s+(?P=w)", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(?<w>\\w+)\\s+\\k<w>");
  });

  it("promotes leading inline flags to pattern flags", () => {
    const result = translateDialectPattern("python", "(?i)error", "");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("error");
      expect(result.jsFlags).toContain("i");
    }
  });

  it("translates \\A and \\Z anchors with notices", () => {
    const result = translateDialectPattern("python", "\\Astart", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("^start");
      expect(result.notices.some((notice) => notice.includes("\\A"))).toBe(true);
    }
  });

  it("blocks verbose mode", () => {
    const result = translateDialectPattern("python", "(?x) \\d+ # comment", "");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Verbose mode");
  });

  it("blocks Python 3.11 atomic groups", () => {
    const result = translateDialectPattern("python", "(?>ab)+", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Atomic groups");
  });

  it("blocks mid-pattern scoped inline flags", () => {
    const result = translateDialectPattern("python", "a(?i)b", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("start of the pattern");
  });
});

describe("dialect translation: PHP / PCRE", () => {
  it("strips delimiters and applies trailing modifiers", () => {
    const result = translateDialectPattern("php", "/#[0-9a-f]{6}\\b/i", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("#[0-9a-f]{6}\\b");
      expect(result.jsFlags).toContain("i");
    }
  });

  it("rejects untranslatable PCRE modifiers", () => {
    const result = translateDialectPattern("php", "/abc/U", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("U");
  });

  it("converts (?'name'...) to (?<name>...)", () => {
    const result = translateDialectPattern("php", "(?'id'\\d+)", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(?<id>\\d+)");
  });

  it("translates \\h and \\R", () => {
    const horizontal = translateDialectPattern("php", "\\h+", "g");
    expect(horizontal.ok && horizontal.jsPattern).toBe("[ \\t]+");
    const lineBreak = translateDialectPattern("php", "\\R", "g");
    expect(lineBreak.ok && lineBreak.jsPattern).toBe("(?:\\r\\n|[\\n\\x0B\\f\\r\\u2028\\u2029])");
  });

  it("expands \\Q...\\E literal quoting", () => {
    const result = translateDialectPattern("php", "\\Q1+1=2\\E", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("1\\+1=2");
  });

  it("blocks \\K", () => {
    const result = translateDialectPattern("php", "foo\\Kbar", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("\\K");
  });

  it("blocks recursion constructs", () => {
    const result = translateDialectPattern("php", "\\((?:[^()]|(?R))*\\)", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Recursion");
  });
});

describe("dialect translation: Java", () => {
  it("expands \\p{Alpha} style POSIX properties", () => {
    const result = translateDialectPattern("java", "\\p{Alpha}{2,4}-\\d{3,6}", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("[A-Za-z]{2,4}-\\d{3,6}");
  });

  it("expands \\Q...\\E quoting", () => {
    const result = translateDialectPattern("java", "\\QC++17?\\E", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("C\\+\\+17\\?");
  });

  it("keeps (?<name>...) groups untouched", () => {
    const result = translateDialectPattern("java", "(?<host>[\\w.]+):(?<port>\\d+)", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(?<host>[\\w.]+):(?<port>\\d+)");
  });

  it("adds the u flag for general-category property escapes", () => {
    const result = translateDialectPattern("java", "\\p{L}+", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("\\p{L}+");
      expect(result.jsFlags).toContain("u");
    }
  });

  it("blocks possessive quantifiers", () => {
    const result = translateDialectPattern("java", "\\d++", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Possessive quantifier");
  });
});

describe("dialect translation: .NET", () => {
  it("converts (?'name'...) groups", () => {
    const result = translateDialectPattern("dotnet", "(?'area'\\d{3})-(?'line'\\d{4})", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(?<area>\\d{3})-(?<line>\\d{4})");
  });

  it("blocks balancing groups", () => {
    const result = translateDialectPattern("dotnet", "(?<a-b>.)*", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("balancing group");
  });

  it("blocks scoped inline flags", () => {
    const result = translateDialectPattern("dotnet", "(?i:abc)", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Scoped inline flags");
  });

  it("blocks Unicode block escapes like \\p{IsBasicLatin}", () => {
    const result = translateDialectPattern("dotnet", "\\p{IsBasicLatin}+", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("IsBasicLatin");
  });
});

describe("dialect translation: shared behavior", () => {
  it("leaves plain patterns byte-identical", () => {
    const result = translateDialectPattern("python", "^[A-Z]+$", "gm");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jsPattern).toBe("^[A-Z]+$");
      expect(result.jsFlags).toBe("gm");
      expect(result.notices).toHaveLength(0);
    }
  });

  it("keeps numbered backreferences", () => {
    const result = translateDialectPattern("java", "(\\w+)\\s+\\1", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(\\w+)\\s+\\1");
  });

  it("keeps lookbehind assertions that JavaScript supports", () => {
    const result = translateDialectPattern("dotnet", "(?<=\\$)\\d+", "g");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.jsPattern).toBe("(?<=\\$)\\d+");
  });

  it("every flavor has unique slugs and a non-empty sample", () => {
    const slugs = REGEX_FLAVORS.map((flavor) => flavor.slug);
    expect(new Set(slugs).size).toBe(REGEX_FLAVORS.length);
    for (const flavor of REGEX_FLAVORS) {
      expect(flavor.sample.pattern.length).toBeGreaterThan(0);
      expect(flavor.sample.testString.length).toBeGreaterThan(0);
    }
    expect(getRegexFlavor("dotnet")?.label).toBe(".NET");
    expect(getRegexFlavor("nope")).toBeUndefined();
  });

  it("translated samples all evaluate successfully as JavaScript RegExp", () => {
    for (const flavor of REGEX_FLAVORS) {
      const result = translateDialectPattern(
        flavor.id,
        flavor.sample.pattern,
        flavor.sample.flags,
      );
      expect(result.ok, flavor.id).toBe(true);
      if (result.ok) {
        expect(() => new RegExp(result.jsPattern, result.jsFlags)).not.toThrow();
      }
    }
  });
});
