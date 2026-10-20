export interface RegexMatch {
  text: string;
  start: number;
  end: number;
  groups: Record<string, string>;
  groupRanges?: Record<string, [number, number]>;
}

export type RegexFailureCode =
  | "empty-pattern"
  | "invalid-flags"
  | "invalid-pattern"
  | "input-too-large"
  | "match-limit"
  | "timeout"
  | "worker-unavailable"
  | "worker-error";

export interface RegexSuccess {
  ok: true;
  matches: RegexMatch[];
  matchCount: number;
  durationMs: number;
}

export interface RegexFailure {
  ok: false;
  code: RegexFailureCode;
  message: string;
  durationMs: number;
}

export type RegexRunResult = RegexSuccess | RegexFailure;

export interface RegexRunOptions {
  timeBudgetMs?: number;
  maxMatches?: number;
  maxInputLength?: number;
}

export const REGEX_ALLOWED_FLAGS = ["g", "i", "m", "s", "u", "y"] as const;
export const REGEX_TIME_BUDGET_MS = 2000;
export const REGEX_MAX_MATCHES = 100_000;
export const REGEX_MAX_INPUT_LENGTH = 5_000_000;
export const CATASTROPHIC_BACKTRACKING_MESSAGE =
  "Catastrophic Backtracking Detected — evaluation exceeded the time budget. Simplify the pattern (avoid nested quantifiers such as (a+)+ or (a|a)+) and try again.";

const TIME_CHECK_INTERVAL = 1024;

function elapsedMs(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}

function collectGroups(match: RegExpExecArray): Record<string, string> {
  const groups: Record<string, string> = {};
  if (match.groups) {
    for (const key of Object.keys(match.groups)) {
      groups[key] = match.groups[key] ?? "";
    }
  }
  return groups;
}

export function runRegex(
  pattern: string,
  flags: string,
  testString: string,
  options: RegexRunOptions = {},
): RegexRunResult {
  const startedAt = performance.now();
  const fail = (code: RegexFailureCode, message: string): RegexFailure => ({
    ok: false,
    code,
    message,
    durationMs: elapsedMs(startedAt),
  });

  if (typeof pattern !== "string" || pattern.length === 0) {
    return fail("empty-pattern", "Pattern is empty — enter a regular expression first.");
  }

  const cleanedFlags = typeof flags === "string" ? flags.replace(/\s+/g, "") : "";
  const seenFlags = new Set<string>();
  for (const char of cleanedFlags) {
    if (!(REGEX_ALLOWED_FLAGS as readonly string[]).includes(char)) {
      return fail(
        "invalid-flags",
        `"${char}" is not a supported flag. Allowed flags: ${REGEX_ALLOWED_FLAGS.join(", ")}.`,
      );
    }
    seenFlags.add(char);
  }
  const normalizedFlags = [...seenFlags].join("");

  const input = typeof testString === "string" ? testString : "";
  const maxInputLength = options.maxInputLength ?? REGEX_MAX_INPUT_LENGTH;
  if (input.length > maxInputLength) {
    return fail(
      "input-too-large",
      `Test string exceeds the ${maxInputLength.toLocaleString()} character client-side limit.`,
    );
  }

  let regex: RegExp;
  let hasGroupIndices = false;
  try {
    regex = new RegExp(pattern, `${normalizedFlags}d`);
    hasGroupIndices = true;
  } catch {
    try {
      regex = new RegExp(pattern, normalizedFlags);
    } catch (error) {
      return fail("invalid-pattern", error instanceof Error ? error.message : String(error));
    }
  }

  const matches: RegexMatch[] = [];
  const maxMatches = options.maxMatches ?? REGEX_MAX_MATCHES;
  const budgetMs = options.timeBudgetMs ?? REGEX_TIME_BUDGET_MS;
  const deadline = startedAt + budgetMs;
  const isGlobal = normalizedFlags.includes("g") || normalizedFlags.includes("y");
  let iterations = 0;

  while (true) {
    if ((iterations & (TIME_CHECK_INTERVAL - 1)) === 0 && performance.now() > deadline) {
      return fail("timeout", CATASTROPHIC_BACKTRACKING_MESSAGE);
    }
    const match = regex.exec(input);
    if (match === null) {
      break;
    }
    if (matches.length >= maxMatches) {
      return fail(
        "match-limit",
        `Pattern produced more than the ${maxMatches.toLocaleString()} supported matches. Narrow the pattern or shorten the test string.`,
      );
    }
    const matchText = match[0];
    const entry: RegexMatch = {
      text: matchText,
      start: match.index,
      end: match.index + matchText.length,
      groups: collectGroups(match),
    };
    if (hasGroupIndices && match.indices) {
      const indices = match.indices.groups;
      if (indices) {
        const groupRanges: Record<string, [number, number]> = {};
        for (const key of Object.keys(indices)) {
          const range = indices[key];
          if (range && range[0] >= 0 && range[1] >= range[0]) {
            groupRanges[key] = [range[0], range[1]];
          }
        }
        if (Object.keys(groupRanges).length > 0) {
          entry.groupRanges = groupRanges;
        }
      }
    }
    matches.push(entry);
    if (!isGlobal) {
      break;
    }
    if (matchText.length === 0) {
      regex.lastIndex += 1;
    }
    iterations += 1;
  }

  return {
    ok: true,
    matches,
    matchCount: matches.length,
    durationMs: elapsedMs(startedAt),
  };
}
