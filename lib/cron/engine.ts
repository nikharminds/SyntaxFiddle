import parser from "cron-parser";
import cronstrue from "cronstrue";
import {
  DIALECTS,
  type CronDialect,
  type CronDialectSpec,
  type CronFieldSpec,
} from "./dialects";

export interface CronFieldDetail {
  name: string;
  value: string;
  allowedRange: string;
  isValid: boolean;
  error?: string;
}

export interface CronAnalysisResult {
  isValid: boolean;
  errorMessage?: string;
  humanReadable: string;
  fields: CronFieldDetail[];
  nextRuns: Date[];
  dialect: CronDialect;
}

const YEAR_MIN = 1970;
const YEAR_MAX = 2199;
const MAX_ITERATIONS = 5000;

/** Vixie-style macro expansions. Only valid in dialects with supportsMacros. */
const CRON_MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MACRO_LIST =
  "@yearly, @annually, @monthly, @weekly, @daily, @midnight, @hourly, @reboot";

export function analyzeCronExpression(
  expression: string,
  dialect: CronDialect,
  timezone: string = "UTC",
  runCount: number = 10
): CronAnalysisResult {
  const spec = DIALECTS[dialect] ?? DIALECTS.unix;
  const count = Math.min(Math.max(Math.trunc(runCount) || 0, 0), 100);
  let tokens = (typeof expression === "string" ? expression : "")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);

  const firstToken = tokens[0];
  if (tokens.length === 1 && firstToken !== undefined && firstToken.startsWith("@")) {
    const macro = firstToken.toLowerCase();
    if (macro === "@reboot") {
      return macroFailure(
        '"@reboot" runs once at system startup rather than on a schedule — there is nothing to simulate. Replace it with the schedule that should run after boot.',
        spec
      );
    }
    const expansion = CRON_MACROS[macro];
    if (!expansion) {
      return macroFailure(
        `Unknown macro "${firstToken}". Supported macros: ${MACRO_LIST}.`,
        spec
      );
    }
    if (!spec.supportsMacros) {
      return macroFailure(
        `The ${spec.label} dialect does not support "${macro}" — expand it manually, e.g. "${dialectExpansion(expansion, spec)}".`,
        spec
      );
    }
    tokens = expansion.split(" ");
  } else if (tokens.some((token) => token.startsWith("@"))) {
    return macroFailure(
      `Macros cannot be combined with other fields — use the macro alone or expand it (e.g. "@daily" = "${CRON_MACROS["@daily"]}").`,
      spec
    );
  }

  if (tokens.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Expression is empty. Provide all cron fields, e.g. "*/5 * * * *".',
      humanReadable: "",
      fields: spec.fields.map((field) => ({
        name: field.name,
        value: "",
        allowedRange: field.rangeLabel,
        isValid: false,
        error: `${field.name} field is empty.`,
      })),
      nextRuns: [],
      dialect: spec.id,
    };
  }

  if (tokens.length !== spec.fieldCount) {
    const message = fieldCountError(tokens.length, spec);
    return {
      isValid: false,
      errorMessage: message,
      humanReadable: "",
      fields: spec.fields.map((field, index) => ({
        name: field.name,
        value: tokens[index] ?? "",
        allowedRange: field.rangeLabel,
        isValid: false,
      })),
      nextRuns: [],
      dialect: spec.id,
    };
  }

  const fields: CronFieldDetail[] = spec.fields.map((field, index) => {
    const value = tokens[index] ?? "";
    const verdict = validateField(value, field, spec);
    return {
      name: field.name,
      value,
      allowedRange: field.rangeLabel,
      isValid: verdict.valid,
      error: verdict.error,
    };
  });

  const dialectError = checkDialectRules(tokens, spec);
  const firstInvalid = fields.find((field) => !field.isValid);

  if (dialectError || firstInvalid) {
    return {
      isValid: false,
      errorMessage: dialectError ?? firstInvalid?.error,
      humanReadable: "",
      fields,
      nextRuns: [],
      dialect: spec.id,
    };
  }

  if (!isSupportedTimezone(timezone)) {
    return {
      isValid: false,
      errorMessage: `Unknown or unsupported timezone "${timezone}". Use an IANA name such as "UTC", "Asia/Kolkata", or "America/New_York".`,
      humanReadable: humanize(tokens, spec),
      fields,
      nextRuns: [],
      dialect: spec.id,
    };
  }

  const humanReadable = humanize(tokens, spec) || `Runs on a recurring ${spec.label} schedule.`;

  let nextRuns: Date[] = [];
  if (count > 0) {
    try {
      nextRuns = computeNextRuns(tokens, spec, timezone, count);
    } catch {
      nextRuns = [];
    }
  }

  return {
    isValid: true,
    errorMessage:
      count > 0 && nextRuns.length === 0
        ? "The expression is syntactically valid, but no upcoming run dates could be computed (e.g. February 31st, a past-only year range, or tokens like 'W'/'LW' that the simulator cannot expand)."
        : undefined,
    humanReadable,
    fields,
    nextRuns,
    dialect: spec.id,
  };
}

function validateField(
  value: string,
  field: CronFieldSpec,
  dialect: CronDialectSpec
): { valid: boolean; error?: string } {
  if (value === "?") {
    if (!field.allowsQuestionMark) {
      return {
        valid: false,
        error: `The '?' wildcard is not part of the ${dialect.label} dialect — use '*' instead.`,
      };
    }
    return { valid: true };
  }

  const items = value.split(",");
  for (const item of items) {
    const error = validateItem(item, field);
    if (error) {
      return { valid: false, error };
    }
  }
  return { valid: true };
}

function validateItem(item: string, field: CronFieldSpec): string | undefined {
  if (item === "") {
    return `Empty segment in the ${field.name} field — check for stray commas.`;
  }
  if (item === "*") {
    return undefined;
  }

  const slashParts = item.split("/");
  if (slashParts.length > 2) {
    return `"${item}" has too many '/' separators — at most one step is allowed, e.g. "*/5".`;
  }
  const base = slashParts[0] ?? item;
  const step = slashParts[1];

  if (step !== undefined && !/^\d+$/.test(step)) {
    return `The step "${step}" in "${item}" must be a positive number.`;
  }
  if (step !== undefined && Number(step) < 1) {
    return `The step in "${item}" must be at least 1.`;
  }
  if (base === "*") {
    return undefined;
  }

  if (base.startsWith("L-")) {
    return `"${base}" (an offset from the last day) is not supported by this engine yet — use an exact day, a range, or 'L'.`;
  }

  if (base.includes("#")) {
    if (!field.allowsHash) {
      return "The '#' wildcard (nth weekday of the month) is only supported in Day of Week for the AWS EventBridge and Quartz dialects.";
    }
    const hashParts = base.split("#");
    if (hashParts.length > 2) {
      return `"${base}" contains more than one '#'.`;
    }
    const day = hashParts[0] ?? "";
    const nth = hashParts[1] ?? "";
    const dayError = validateAtom(day, field);
    if (dayError) {
      return dayError;
    }
    if (!/^\d+$/.test(nth) || Number(nth) < 1 || Number(nth) > 5) {
      return `The value after '#' in "${base}" must be between 1 and 5 (e.g. "6#3" = third Friday).`;
    }
    if (step !== undefined) {
      return `Steps cannot be combined with '#' in "${item}".`;
    }
    return undefined;
  }

  if (base === "L") {
    if (!field.allowsL) {
      return "The 'L' wildcard (last day) is only supported in the AWS EventBridge and Quartz dialects.";
    }
    if (step !== undefined) {
      return `Steps cannot be combined with 'L' in "${item}".`;
    }
    return undefined;
  }

  if (base === "LW") {
    if (!field.allowsL || !field.allowsW) {
      return "The 'LW' wildcard (last weekday of the month) is only supported in Day of Month for AWS EventBridge and Quartz.";
    }
    if (step !== undefined) {
      return `Steps cannot be combined with 'LW' in "${item}".`;
    }
    return undefined;
  }

  if (/^\d+W$/.test(base)) {
    if (!field.allowsW) {
      return "The 'W' wildcard (nearest weekday) is only supported in Day of Month for AWS EventBridge and Quartz.";
    }
    const day = Number(base.slice(0, -1));
    if (day < field.min || day > field.max) {
      return `${field.name} must be between ${field.min} and ${field.max}, but got ${day}.`;
    }
    if (step !== undefined) {
      return `Steps cannot be combined with 'W' in "${item}".`;
    }
    return undefined;
  }

  if (base.includes("-")) {
    const rangeParts = base.split("-");
    if (rangeParts.length > 2) {
      return `"${base}" has too many '-' separators.`;
    }
    const start = rangeParts[0] ?? "";
    const end = rangeParts[1] ?? "";
    const startError = validateAtom(start, field);
    if (startError) {
      return startError;
    }
    const endError = validateAtom(end, field);
    if (endError) {
      return endError;
    }
    const startValue = resolveAtom(start, field);
    const endValue = resolveAtom(end, field);
    if (startValue !== null && endValue !== null && startValue > endValue) {
      return `The range "${base}" is reversed — ${start} must not exceed ${end}.`;
    }
    return undefined;
  }

  return validateAtom(base, field);
}

function validateAtom(token: string, field: CronFieldSpec): string | undefined {
  if (/^\d+$/.test(token)) {
    const value = Number(token);
    if (value < field.min || value > field.max) {
      return `${field.name} must be between ${field.min} and ${field.max}, but got ${value}.`;
    }
    return undefined;
  }
  if (/^[A-Za-z]{3}$/.test(token)) {
    if (!field.names) {
      return `Names like "${token}" are not supported in the ${field.name} field — use numbers (${field.rangeLabel}).`;
    }
    if (resolveName(token, field.names) === null) {
      return `"${token.toUpperCase()}" is not a valid name for ${field.name}. Allowed names: ${Object.keys(field.names).join(", ")}.`;
    }
    return undefined;
  }
  return `"${token}" is not a valid ${field.name} value — expected ${field.rangeLabel}, '*', steps ("*/5"), ranges ("1-5"), or comma-separated lists ("1,15,30").`;
}

function resolveName(token: string, names: Record<string, number>): number | null {
  const value = names[token.toUpperCase()];
  return value === undefined ? null : value;
}

function resolveAtom(token: string, field: CronFieldSpec): number | null {
  if (/^\d+$/.test(token)) {
    return Number(token);
  }
  if (field.names) {
    return resolveName(token, field.names);
  }
  return null;
}

function checkDialectRules(tokens: string[], spec: CronDialectSpec): string | undefined {
  if (!spec.requiresQuestionMarkInDayFields) {
    return undefined;
  }
  const dayOfMonth = tokens[2] ?? "";
  const dayOfWeek = tokens[4] ?? "";
  const domQuestion = dayOfMonth.includes("?");
  const dowQuestion = dayOfWeek.includes("?");

  if (domQuestion && dowQuestion) {
    return "AWS EventBridge does not allow '?' in both Day-of-Month and Day-of-Week — keep '?' in one field and use '*' in the other.";
  }
  if (!domQuestion && !dowQuestion) {
    const fixed = [...tokens];
    if (dayOfMonth === "*") {
      fixed[2] = "?";
    } else {
      fixed[4] = "?";
    }
    return `AWS EventBridge requires '?' in either Day-of-Month or Day-of-Week. Try: "${fixed.join(" ")}".`;
  }
  return undefined;
}

function fieldCountError(found: number, spec: CronDialectSpec): string {
  let hint = "";
  if ((spec.id === "unix" || spec.id === "cloudflare") && found === 6) {
    hint = " Six fields usually means Quartz (leading seconds) or AWS EventBridge (trailing year) — switch the dialect selector.";
  } else if (found === 5 && spec.id === "quartz") {
    hint = " Quartz expects a leading Seconds field.";
  } else if (found === 5 && spec.id === "aws") {
    hint = " AWS EventBridge expects a trailing Year field.";
  }
  return `The ${spec.label} dialect expects ${spec.fieldCount} fields, but found ${found}.${hint}`;
}

function humanize(tokens: string[], spec: CronDialectSpec): string {
  let expression = tokens.join(" ");
  if (spec.id === "aws") {
    expression = tokens.slice(0, 5).join(" ").replace(/\?/g, "*");
  }
  try {
    const text = cronstrue.toString(expression, {
      throwExceptionOnParseError: false,
      verbose: false,
      dayOfWeekStartIndexZero: spec.dayOfWeekStartIndexZero,
      monthStartIndexZero: false,
    });
    if (!text || text.startsWith("An error occured")) {
      return "";
    }
    return bothDayFieldsRestricted(tokens, spec) ? joinDayUnionWithOr(text) : text;
  } catch {
    return "";
  }
}

function macroFailure(message: string, spec: CronDialectSpec): CronAnalysisResult {
  return {
    isValid: false,
    errorMessage: message,
    humanReadable: "",
    fields: spec.fields.map((field) => ({
      name: field.name,
      value: "",
      allowedRange: field.rangeLabel,
      isValid: false,
    })),
    nextRuns: [],
    dialect: spec.id,
  };
}

/** Suggests the manual expansion of a 5-field macro for Quartz / AWS dialects. */
function dialectExpansion(fiveFields: string, spec: CronDialectSpec): string {
  const parts = fiveFields.split(" ");
  parts[parts[4] === "*" ? 4 : 2] = "?";
  // Unix day-of-week 0 (Sunday) is 1 in the Quartz/AWS 1-based (1 = SUN) field.
  if (parts[4] === "0") parts[4] = "1";
  if (spec.id === "quartz") {
    parts.unshift("0");
  } else if (spec.id === "aws") {
    parts.push("*");
  }
  return parts.join(" ");
}

/**
 * Vixie cron runs the UNION of both day fields when both are restricted, so
 * only Unix-family dialects need the connective rewritten. Quartz and AWS
 * require '?' in one day field, so the case cannot occur there.
 */
function bothDayFieldsRestricted(tokens: string[], spec: CronDialectSpec): boolean {
  if (spec.id !== "unix" && spec.id !== "cloudflare") {
    return false;
  }
  const dayOfMonth = tokens[2] ?? "";
  const dayOfWeek = tokens[4] ?? "";
  return (
    dayOfMonth !== "*" &&
    dayOfMonth !== "?" &&
    dayOfWeek !== "*" &&
    dayOfWeek !== "?"
  );
}

/** Rewrites cronstrue's "and" join between the day fields as "or" (union). */
function joinDayUnionWithOr(text: string): string {
  if (text.includes("of the month, and on ")) {
    return text.replace("of the month, and on ", "of the month, or on ");
  }
  return text.replace("of the month, ", "of the month, or ");
}

function computeNextRuns(
  tokens: string[],
  spec: CronDialectSpec,
  timezone: string,
  runCount: number
): Date[] {
  let expression: string;
  let yearMatcher: ((year: number) => boolean) | null = null;

  if (spec.id === "quartz") {
    const seconds = tokens[0] ?? "0";
    const minute = tokens[1] ?? "*";
    const hour = tokens[2] ?? "*";
    const dayOfMonth = (tokens[3] ?? "*").replace(/\?/g, "*");
    const month = tokens[4] ?? "*";
    const dayOfWeek = shiftDayOfWeekBase(tokens[5] ?? "*", true);
    expression = [seconds, minute, hour, dayOfMonth, month, dayOfWeek].join(" ");
  } else if (spec.id === "aws") {
    const minute = tokens[0] ?? "*";
    const hour = tokens[1] ?? "*";
    const dayOfMonth = (tokens[2] ?? "*").replace(/\?/g, "*");
    const month = tokens[3] ?? "*";
    const dayOfWeek = shiftDayOfWeekBase(tokens[4] ?? "*", true);
    expression = [minute, hour, dayOfMonth, month, dayOfWeek].join(" ");
    yearMatcher = buildYearMatcher(tokens[5] ?? "*");
  } else {
    expression = tokens.join(" ");
  }

  const dates: Date[] = [];
  let interval = parser.parseExpression(expression, {
    currentDate: new Date(),
    tz: timezone,
  });
  let guard = 0;
  let lastRestartYear = -1;

  while (dates.length < runCount && guard < MAX_ITERATIONS) {
    guard += 1;
    let next: Date;
    try {
      next = interval.next().toDate();
    } catch {
      break;
    }

    if (yearMatcher) {
      const year = yearInTimezone(next, timezone);
      if (!yearMatcher(year)) {
        const restartYear = nextAllowedYear(yearMatcher, year);
        if (restartYear === null || restartYear === lastRestartYear) {
          break;
        }
        lastRestartYear = restartYear;
        try {
          interval = parser.parseExpression(expression, {
            currentDate: new Date(Date.UTC(restartYear - 1, 11, 31, 12, 0, 0)),
            tz: timezone,
          });
        } catch {
          break;
        }
        continue;
      }
    }

    dates.push(next);
  }

  return dates;
}

function mapFieldAtoms(field: string, mapper: (atom: string) => string): string {
  return field
    .split(",")
    .map((item) => {
      const parts = item.split("/");
      const baseParts = (parts[0] ?? "*").split("-");
      parts[0] = baseParts.map(mapper).join("-");
      return parts.join("/");
    })
    .join(",");
}

function shiftDayOfWeekBase(field: string, oneBased: boolean): string {
  return mapFieldAtoms(field, (atom) => {
    const hashIndex = atom.indexOf("#");
    let target = atom;
    let suffix = "";
    if (hashIndex !== -1) {
      target = atom.slice(0, hashIndex);
      suffix = atom.slice(hashIndex);
    }
    if (/^\d+$/.test(target)) {
      const value = Number(target);
      return String(oneBased ? value - 1 : value === 7 ? 0 : value) + suffix;
    }
    return atom + suffix;
  });
}

function buildYearMatcher(field: string): (year: number) => boolean {
  const matchers = field.split(",").map((item) => {
    const parts = item.split("/");
    const step = parts[1] !== undefined && /^\d+$/.test(parts[1]) ? Number(parts[1]) : 1;
    let base = parts[0] ?? "*";
    if (base === "*" || base === "?") {
      base = `${YEAR_MIN}-${YEAR_MAX}`;
    }
    let start = YEAR_MIN;
    let end = YEAR_MAX;
    if (/^\d+$/.test(base)) {
      start = Number(base);
      end = Number(base);
    } else {
      const rangeParts = base.split("-");
      if (rangeParts.length === 2) {
        const startValue = Number(rangeParts[0]);
        const endValue = Number(rangeParts[1]);
        if (Number.isFinite(startValue)) {
          start = startValue;
        }
        if (Number.isFinite(endValue)) {
          end = endValue;
        }
      }
    }
    return (year: number): boolean =>
      year >= start && year <= end && (year - start) % step === 0;
  });
  return (year: number): boolean => matchers.some((matches) => matches(year));
}

function nextAllowedYear(
  matches: (year: number) => boolean,
  after: number
): number | null {
  for (let year = Math.max(after + 1, YEAR_MIN); year <= YEAR_MAX; year += 1) {
    if (matches(year)) {
      return year;
    }
  }
  return null;
}

function yearInTimezone(date: Date, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric" }).format(date)
  );
}

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
