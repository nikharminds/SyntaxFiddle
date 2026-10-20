import { afterEach, describe, expect, it, vi } from "vitest";
import {
  JWTError,
  MAX_TOKEN_LENGTH,
  decodeJWT,
  isJWTError,
} from "../jwt/engine";
import {
  REGEX_MAX_INPUT_LENGTH,
  runRegex,
} from "../regex/engine";
import { runRegexViaWorker } from "../regex/client";

function encodeSegment(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeJson(value: unknown): string {
  return encodeSegment(JSON.stringify(value));
}

describe("decodeJWT security boundaries", () => {
  it("decodes a well-formed HS256 token into header, payload, and signature", () => {
    const signature = "SFLKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const token = `${encodeJson({ alg: "HS256", typ: "JWT" })}.${encodeJson({
      sub: "1234567890",
      name: "Ada Lovelace",
      admin: true,
    })}.${signature}`;

    const result = decodeJWT(token);

    expect(isJWTError(result)).toBe(false);
    if (!isJWTError(result)) {
      expect(result.header.json).toEqual({ alg: "HS256", typ: "JWT" });
      expect(result.payload.json).toEqual({
        sub: "1234567890",
        name: "Ada Lovelace",
        admin: true,
      });
      expect(result.signature).toBe(signature);
      expect(result.payload.decoded).toContain("Ada Lovelace");
    }
  });

  it("round-trips multibyte UTF-8 claims", () => {
    const token = `${encodeJson({ alg: "none" })}.${encodeJson({
      name: "Ádám ✓ 你好",
    })}.`;

    const result = decodeJWT(token);

    expect(isJWTError(result)).toBe(false);
    if (!isJWTError(result)) {
      expect(result.payload.json.name).toBe("Ádám ✓ 你好");
    }
  });

  it("accepts unpadded base64url segments and a Bearer prefix", () => {
    const token = `Bearer ${encodeJson({ alg: "none" })}.${encodeJson({ sub: "42" })}.`;

    const result = decodeJWT(token);

    expect(isJWTError(result)).toBe(false);
    if (!isJWTError(result)) {
      expect(result.payload.json.sub).toBe("42");
    }
  });

  it("returns an error boundary for empty or whitespace-only input", () => {
    for (const token of ["", "   ", "\n\t "]) {
      const result = decodeJWT(token);
      expect(result).toBeInstanceOf(JWTError);
      if (result instanceof JWTError) {
        expect(result.code).toBe("empty");
      }
    }
  });

  it("rejects tokens without exactly three dot-separated segments", () => {
    for (const token of ["abc", "a.b.c.d", "only-two-parts"]) {
      const result = decodeJWT(token);
      expect(result).toBeInstanceOf(JWTError);
      if (result instanceof JWTError) {
        expect(result.code).toBe("invalid-structure");
        expect(result.message).toContain("header.payload.signature");
      }
    }
  });

  it("rejects empty header or payload segments", () => {
    const noHeader = decodeJWT(`.${encodeJson({ sub: "1" })}.sig`);
    const noPayload = decodeJWT(`${encodeJson({ alg: "none" })}..sig`);

    expect(noHeader).toBeInstanceOf(JWTError);
    expect(noPayload).toBeInstanceOf(JWTError);
    if (noHeader instanceof JWTError) {
      expect(noHeader.code).toBe("invalid-structure");
      expect(noHeader.segment).toBe("header");
    }
    if (noPayload instanceof JWTError) {
      expect(noPayload.code).toBe("invalid-structure");
      expect(noPayload.segment).toBe("payload");
    }
  });

  it("rejects invalid base64url characters in any segment", () => {
    const header = decodeJWT(`!!!.${encodeJson({ sub: "1" })}.sig`);
    const signature = decodeJWT(
      `${encodeJson({ alg: "none" })}.${encodeJson({ sub: "1" })}.???`,
    );

    for (const result of [header, signature]) {
      expect(result).toBeInstanceOf(JWTError);
      if (result instanceof JWTError) {
        expect(result.code).toBe("invalid-base64url");
      }
    }
    if (header instanceof JWTError) expect(header.segment).toBe("header");
    if (signature instanceof JWTError) expect(signature.segment).toBe("signature");
  });

  it("rejects segments that decode to non-JSON or non-object JSON", () => {
    const notJson = decodeJWT(`${encodeJson({ alg: "none" })}.${encodeSegment("not json")}.sig`);
    const jsonArray = decodeJWT(`${encodeJson({ alg: "none" })}.${encodeSegment("[1,2,3]")}.sig`);
    const jsonNumber = decodeJWT(`${encodeSegment("42")}.${encodeJson({ sub: "1" })}.sig`);

    for (const result of [notJson, jsonArray, jsonNumber]) {
      expect(result).toBeInstanceOf(JWTError);
      if (result instanceof JWTError) {
        expect(result.code).toBe("invalid-json");
      }
    }
    if (notJson instanceof JWTError) expect(notJson.segment).toBe("payload");
    if (jsonNumber instanceof JWTError) expect(jsonNumber.segment).toBe("header");
  });

  it("refuses tokens above the client-side size cap before parsing", () => {
    const result = decodeJWT("A".repeat(MAX_TOKEN_LENGTH + 1));

    expect(result).toBeInstanceOf(JWTError);
    if (result instanceof JWTError) {
      expect(result.code).toBe("token-too-large");
    }
  });

  it("keeps a __proto__ claim contained without prototype pollution", () => {
    const token = `${encodeJson({ alg: "none" })}.${encodeSegment(
      '{"__proto__":{"polluted":true}}',
    )}.`;

    const result = decodeJWT(token);

    expect(isJWTError(result)).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    if (!isJWTError(result)) {
      expect(Object.keys(result.payload.json)).toContain("__proto__");
    }
  });

  it("does not misclassify generic errors as JWT errors", () => {
    expect(isJWTError(new Error("generic"))).toBe(false);
    expect(isJWTError(null)).toBe(false);
  });
});

describe("runRegex matching correctness", () => {
  it("captures global matches with named groups and exact indices", () => {
    const result = runRegex(
      "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
      "g",
      "Dates: 2024-06-15 and 1999-12-31.",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matchCount).toBe(2);
      expect(result.matches[0]?.groups).toEqual({ year: "2024", month: "06", day: "15" });
      expect(result.matches[0]?.start).toBe(7);
      expect(result.matches[0]?.end).toBe(17);
      expect(result.matches[1]?.text).toBe("1999-12-31");
      expect(result.matches[1]?.start).toBe(22);
      expect(result.matches[1]?.end).toBe(32);
    }
  });

  it("finds every global match with start and end offsets", () => {
    const result = runRegex("\\d+", "g", "a1 bb22 ccc333");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches.map((match) => match.text)).toEqual(["1", "22", "333"]);
      expect(result.matches.map((match) => match.start)).toEqual([1, 5, 11]);
      expect(result.matches.map((match) => match.end)).toEqual([2, 7, 14]);
    }
  });

  it("returns only the first match without the global or sticky flags", () => {
    const result = runRegex("\\d+", "", "a1 bb22");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matchCount).toBe(1);
      expect(result.matches[0]?.text).toBe("1");
    }
  });

  it("honors the i, m, and s flags", () => {
    const caseInsensitive = runRegex("hello", "i", "HELLO world");
    const multiline = runRegex("^b$", "gm", "a\nb\nc");
    const dotAll = runRegex("a.b", "s", "a\nb");
    const noDotAll = runRegex("a.b", "", "a\nb");

    expect(caseInsensitive.ok && caseInsensitive.matchCount).toBe(1);
    expect(multiline.ok && multiline.matches[0]?.start).toBe(2);
    expect(dotAll.ok && dotAll.matches[0]?.text).toBe("a\nb");
    expect(noDotAll.ok && noDotAll.matchCount).toBe(0);
  });

  it("anchors sticky matches to lastIndex", () => {
    const anchored = runRegex("a", "y", "aaa");
    const misaligned = runRegex("a", "y", "baa");

    expect(anchored.ok && anchored.matchCount).toBe(3);
    expect(misaligned.ok && misaligned.matchCount).toBe(0);
  });

  it("maps non-participating optional groups to empty strings", () => {
    const result = runRegex("(?<vowel>a)?b", "", "b");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches[0]?.groups).toEqual({ vowel: "" });
    }
  });

  it("terminates zero-length global matches without an infinite loop", () => {
    const result = runRegex("a*", "g", "bab");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matchCount).toBe(4);
      expect(result.matches.map((match) => match.start)).toEqual([0, 1, 2, 3]);
      expect(result.matches.map((match) => match.end)).toEqual([0, 2, 2, 3]);
    }
  });

  it("deduplicates flags and ignores stray whitespace in the flag string", () => {
    const result = runRegex("a", " g g ", "aa");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matchCount).toBe(2);
    }
  });

  it("captures named group ranges for overlay underlines", () => {
    const result = runRegex(
      "(?<user>[\\w.]+)@(?<domain>\\w+\\.\\w+)",
      "g",
      "mail ada@example.com now",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const match = result.matches[0];
      expect(match?.groupRanges).toEqual({ user: [5, 8], domain: [9, 20] });
      expect(match?.start).toBe(5);
      expect(result.matches[0]?.groups).toEqual({ user: "ada", domain: "example.com" });
    }
  });

  it("skips group ranges for non-participating optional groups", () => {
    const result = runRegex("(?<a>a)?(?<b>b)", "g", "b");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches[0]?.groupRanges).toEqual({ b: [0, 1] });
      expect(result.matches[0]?.groups).toEqual({ a: "", b: "b" });
    }
  });

  it("reports invalid patterns and unsupported flags as error boundaries", () => {
    const invalidPattern = runRegex("(unclosed", "g", "test");
    const invalidFlags = runRegex("a", "q", "a");
    const mixedInvalidFlags = runRegex("a", "gx", "a");

    expect(invalidPattern.ok).toBe(false);
    if (!invalidPattern.ok) {
      expect(invalidPattern.code).toBe("invalid-pattern");
    }
    expect(invalidFlags.ok).toBe(false);
    if (!invalidFlags.ok) {
      expect(invalidFlags.code).toBe("invalid-flags");
    }
    expect(mixedInvalidFlags.ok).toBe(false);
    if (!mixedInvalidFlags.ok) {
      expect(mixedInvalidFlags.code).toBe("invalid-flags");
    }
  });

  it("enforces the client-side input size cap", () => {
    const result = runRegex("a", "g", "a".repeat(REGEX_MAX_INPUT_LENGTH + 1));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("input-too-large");
    }
  });

  it("aborts when the match count exceeds the configured cap", () => {
    const result = runRegex("x", "g", "x".repeat(10), { maxMatches: 5 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("match-limit");
    }
  });
});

describe("ReDoS defenses", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aborts a slow global match loop once the time budget expires", () => {
    const result = runRegex("x", "g", "x".repeat(2_000_000), {
      timeBudgetMs: 5,
      maxMatches: Number.POSITIVE_INFINITY,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("timeout");
      expect(result.message).toContain("Catastrophic Backtracking Detected");
    }
  });

  it("hard-terminates an unresponsive worker via the main-thread watchdog", async () => {
    class StubWorker {
      static lastInstance: StubWorker | undefined;
      terminated = false;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      constructor() {
        StubWorker.lastInstance = this;
      }

      postMessage() {}

      terminate() {
        this.terminated = true;
      }
    }

    vi.stubGlobal("Worker", StubWorker);

    const result = await runRegexViaWorker("(a+)+b", "g", "a".repeat(28), {
      timeoutMs: 20,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("timeout");
      expect(result.message).toContain("Catastrophic Backtracking Detected");
    }
    expect(StubWorker.lastInstance?.terminated).toBe(true);
  });

  it("signals worker-unavailable in environments without Worker support", async () => {
    const result = await runRegexViaWorker("a", "g", "a");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("worker-unavailable");
    }
  });
});
