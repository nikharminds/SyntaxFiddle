import { CRON_MACROS } from "./engine";
import { DIALECTS, type CronDialect, type CronFieldKey } from "./dialects";

/**
 * Cross-dialect cron expression conversion.
 *
 * Switching dialects in the playground translates the current expression
 * instead of discarding it: times survive, day-of-week numbering crosses the
 * 0-based (Unix: 0 = SUN) ↔ 1-based (AWS/Quartz: 1 = SUN) boundary, and the
 * `?` placement rules of the target are applied. Conversions that would be
 * lossy (non-zero Quartz seconds, a restricted AWS year, or day-of-month +
 * day-of-week both restricted moving onto a dialect that forbids it) return
 * null so the caller can keep the user's text and let validation explain.
 */

const DOW_NAME_TO_CANONICAL: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const CANONICAL_TO_DOW_NAME = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface CanonicalCron {
  second: string;
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  year: string;
}

function isZeroBased(dialect: CronDialect): boolean {
  return DIALECTS[dialect].dayOfWeekStartIndexZero;
}

function splitFields(expression: string): string[] | null {
  const trimmed = expression.trim();
  if (!trimmed) return null;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 1 && tokens[0]?.startsWith("@")) {
    const expansion = CRON_MACROS[tokens[0].toLowerCase()];
    return expansion ? expansion.split(" ") : null;
  }
  if (tokens.some((token) => token.startsWith("@"))) return null;
  return tokens;
}

function extractCanonical(
  tokens: string[],
  from: CronDialect,
): CanonicalCron | null {
  const spec = DIALECTS[from];
  if (!spec || tokens.length !== spec.fieldCount) return null;
  const fields: CanonicalCron = {
    second: "0",
    minute: "*",
    hour: "*",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
    year: "*",
  };
  for (let i = 0; i < spec.fields.length; i++) {
    const fieldSpec = spec.fields[i];
    if (!fieldSpec) return null;
    const token = tokens[i] as string;
    (fields as Record<CronFieldKey, string>)[fieldSpec.key] =
      token === "?" ? "*" : token;
  }
  return fields;
}

function toCanonicalDow(token: string, from: CronDialect): number | null {
  const name = DOW_NAME_TO_CANONICAL[token.toUpperCase()];
  if (name !== undefined) return name;
  if (!/^\d+$/.test(token)) return null;
  const value = parseInt(token, 10);
  if (isZeroBased(from)) {
    return value >= 0 && value <= 7 ? value % 7 : null;
  }
  return value >= 1 && value <= 7 ? value - 1 : null;
}

/** Expands a restricted day-of-week field into canonical day numbers (0 = SUN). */
function parseDowDays(field: string, from: CronDialect): number[] | null {
  const days = new Set<number>();
  for (const unit of field.split(",")) {
    const stepMatch = unit.match(/^(.*)\/(\d+)$/);
    const body = stepMatch ? stepMatch[1] : unit;
    const step = stepMatch ? parseInt(stepMatch[2] as string, 10) : 1;
    if (!body || !Number.isFinite(step) || step < 1) return null;

    let start: number;
    let end: number;
    if (body === "*") {
      start = 0;
      end = 6;
    } else {
      const rangeMatch = body.match(/^(.+?)-(.+)$/);
      if (rangeMatch) {
        const a = toCanonicalDow(rangeMatch[1] as string, from);
        const b = toCanonicalDow(rangeMatch[2] as string, from);
        if (a === null || b === null) return null;
        start = a;
        end = b;
      } else {
        const value = toCanonicalDow(body, from);
        if (value === null) return null;
        start = value;
        // "n/step" means every `step` days from n to the end of the range.
        end = stepMatch ? 6 : value;
      }
    }

    if (start <= end) {
      for (let day = start; day <= end; day += step) days.add(day);
    } else {
      // Wrap-around ranges (FRI-SUN) cross the week boundary.
      for (let day = start; day <= 6; day += step) days.add(day);
      for (let day = 0; day <= end; day += step) days.add(day);
    }
  }
  return days.size > 0 ? [...days] : null;
}

function compressDays(
  days: number[],
  render: (day: number) => string,
): string {
  const sorted = [...days].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === (sorted[j] as number) + 1) {
      j++;
    }
    const first = sorted[i] as number;
    const last = sorted[j] as number;
    parts.push(i === j ? render(first) : `${render(first)}-${render(last)}`);
    i = j + 1;
  }
  return parts.join(",");
}

function serializeDow(days: number[], to: CronDialect): string {
  if (days.length === 7) return "*";
  return isZeroBased(to)
    ? compressDays(days, (day) => String(day))
    : compressDays(days, (day) => CANONICAL_TO_DOW_NAME[day] as string);
}

function targetField(to: CronDialect, key: CronFieldKey) {
  return DIALECTS[to].fields.find((field) => field.key === key);
}

function specialTokensSurvive(
  fields: CanonicalCron,
  from: CronDialect,
  to: CronDialect,
): boolean {
  if (/[LW]/i.test(fields.dayOfMonth)) {
    const dom = targetField(to, "dayOfMonth");
    if (/L/i.test(fields.dayOfMonth) && !dom?.allowsL) return false;
    if (/W/i.test(fields.dayOfMonth) && !dom?.allowsW) return false;
  }
  if (/L/i.test(fields.dayOfWeek) || fields.dayOfWeek.includes("#")) {
    // L/# day-of-week offsets are numbered per dialect family, so they can
    // only cross between dialects that share the same indexing.
    if (isZeroBased(from) !== isZeroBased(to)) return false;
    const dow = targetField(to, "dayOfWeek");
    if (/L/i.test(fields.dayOfWeek) && !dow?.allowsL) return false;
    if (fields.dayOfWeek.includes("#") && !dow?.allowsHash) return false;
  }
  return true;
}

export function convertCronExpression(
  expression: string,
  from: CronDialect,
  to: CronDialect,
): string | null {
  if (from === to) {
    const collapsed = expression.trim().split(/\s+/).join(" ");
    return collapsed.length > 0 ? collapsed : null;
  }

  const tokens = splitFields(expression);
  if (!tokens) return null;
  const fields = extractCanonical(tokens, from);
  if (!fields) return null;

  // Lossy conversions are rejected rather than silently changing semantics:
  // sub-minute Quartz seconds and year-restricted AWS schedules cannot be
  // expressed in the 5-field Unix family or across the other 6-field dialect.
  if (fields.second !== "0" && to !== "quartz") return null;
  if (fields.year !== "*" && to !== "aws") return null;

  const domRestricted = fields.dayOfMonth !== "*";
  const dowRestricted = fields.dayOfWeek !== "*";
  const questionMarkTarget = to === "aws" || to === "quartz";
  if (questionMarkTarget && domRestricted && dowRestricted) return null;
  if (!specialTokensSurvive(fields, from, to)) return null;

  // L/# day-of-week tokens carry dialect-specific numbering and cannot be
  // re-encoded as a day set — they pass through verbatim after validation.
  const dowSpecial =
    /L/i.test(fields.dayOfWeek) || fields.dayOfWeek.includes("#");

  let dayOfMonth: string;
  let dayOfWeek: string;
  if (questionMarkTarget) {
    // AWS/Quartz: exactly one day field carries '?', the other '*'.
    if (dowRestricted) {
      dayOfMonth = "?";
      dayOfWeek = fields.dayOfWeek;
    } else if (domRestricted) {
      dayOfMonth = fields.dayOfMonth;
      dayOfWeek = "?";
    } else if (to === "aws") {
      dayOfMonth = "?";
      dayOfWeek = "*";
    } else {
      // Quartz documents the wildcard case with '?' in day-of-week.
      dayOfMonth = "*";
      dayOfWeek = "?";
    }
  } else {
    dayOfMonth = domRestricted ? fields.dayOfMonth : "*";
    dayOfWeek = dowRestricted ? fields.dayOfWeek : "*";
  }

  if (dowRestricted && !dowSpecial) {
    const dowDays = parseDowDays(fields.dayOfWeek, from);
    if (!dowDays) return null;
    dayOfWeek = serializeDow(dowDays, to);
  }

  const parts: string[] = [];
  if (to === "quartz") parts.push(fields.second);
  parts.push(fields.minute, fields.hour, dayOfMonth, fields.month, dayOfWeek);
  if (to === "aws") parts.push(fields.year);
  return parts.join(" ");
}
