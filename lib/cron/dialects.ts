export type CronDialect = "unix" | "aws" | "quartz" | "cloudflare" | "salesforce";

export type CronFieldKey =
  | "second"
  | "minute"
  | "hour"
  | "dayOfMonth"
  | "month"
  | "dayOfWeek"
  | "year";

export interface CronFieldSpec {
  key: CronFieldKey;
  name: string;
  min: number;
  max: number;
  rangeLabel: string;
  names?: Record<string, number>;
  allowsQuestionMark?: boolean;
  allowsL?: boolean;
  allowsW?: boolean;
  allowsHash?: boolean;
}

export interface CronDialectSpec {
  id: CronDialect;
  label: string;
  fieldCount: number;
  /** Maximum accepted field count when trailing fields are optional (the Salesforce year). Defaults to fieldCount. */
  maxFieldCount?: number;
  fields: CronFieldSpec[];
  dayOfWeekStartIndexZero: boolean;
  requiresQuestionMarkInDayFields: boolean;
  /** Dialect accepts Vixie-style "@daily" macros as a standalone expression. */
  supportsMacros?: boolean;
  notes: string[];
}

export const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

export const DOW_NAMES_ZERO_BASED: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const DOW_NAMES_ONE_BASED: Record<string, number> = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
  SAT: 7,
};

const secondField: CronFieldSpec = {
  key: "second",
  name: "Seconds",
  min: 0,
  max: 59,
  rangeLabel: "0-59",
};

const minuteField: CronFieldSpec = {
  key: "minute",
  name: "Minute",
  min: 0,
  max: 59,
  rangeLabel: "0-59",
};

const hourField: CronFieldSpec = {
  key: "hour",
  name: "Hour",
  min: 0,
  max: 23,
  rangeLabel: "0-23",
};

const monthField: CronFieldSpec = {
  key: "month",
  name: "Month",
  min: 1,
  max: 12,
  rangeLabel: "1-12 or JAN-DEC",
  names: MONTH_NAMES,
};

const salesforceYearField: CronFieldSpec = {
  key: "year",
  name: "Year",
  min: 1970,
  max: 2099,
  rangeLabel: "1970-2099 (optional)",
};

function unixDayOfMonthField(): CronFieldSpec {
  return {
    key: "dayOfMonth",
    name: "Day of Month",
    min: 1,
    max: 31,
    rangeLabel: "1-31",
  };
}

function unixDayOfWeekField(): CronFieldSpec {
  return {
    key: "dayOfWeek",
    name: "Day of Week",
    min: 0,
    max: 7,
    rangeLabel: "0-7 or SUN-SAT (0 and 7 = SUN)",
    names: DOW_NAMES_ZERO_BASED,
  };
}

function extendedDayOfMonthField(): CronFieldSpec {
  return {
    key: "dayOfMonth",
    name: "Day of Month",
    min: 1,
    max: 31,
    rangeLabel: "1-31, L (last day), W (nearest weekday)",
    allowsQuestionMark: true,
    allowsL: true,
    allowsW: true,
  };
}

function extendedDayOfWeekField(): CronFieldSpec {
  return {
    key: "dayOfWeek",
    name: "Day of Week",
    min: 1,
    max: 7,
    rangeLabel: "1-7 or SUN-SAT (1 = SUN)",
    names: DOW_NAMES_ONE_BASED,
    allowsQuestionMark: true,
    allowsL: true,
    allowsHash: true,
  };
}

export const DIALECTS: Record<CronDialect, CronDialectSpec> = {
  unix: {
    id: "unix",
    label: "Unix cron",
    fieldCount: 5,
    fields: [minuteField, hourField, unixDayOfMonthField(), monthField, unixDayOfWeekField()],
    dayOfWeekStartIndexZero: true,
    requiresQuestionMarkInDayFields: false,
    supportsMacros: true,
    notes: [
      "Standard 5-field crontab format: minute hour day-of-month month day-of-week.",
      "Both 0 and 7 mean Sunday in the day-of-week field.",
      "Three-letter month (JAN-DEC) and weekday (SUN-SAT) names are accepted.",
    ],
  },
  cloudflare: {
    id: "cloudflare",
    label: "Cloudflare Workers",
    fieldCount: 5,
    fields: [minuteField, hourField, unixDayOfMonthField(), monthField, unixDayOfWeekField()],
    dayOfWeekStartIndexZero: true,
    requiresQuestionMarkInDayFields: false,
    supportsMacros: true,
    notes: [
      "Cloudflare Workers Cron Triggers use the standard 5-field Unix format.",
      "Triggers always evaluate in UTC, so simulate with the UTC timezone.",
    ],
  },
  aws: {
    id: "aws",
    label: "AWS EventBridge",
    fieldCount: 6,
    fields: [
      minuteField,
      hourField,
      extendedDayOfMonthField(),
      monthField,
      extendedDayOfWeekField(),
      {
        key: "year",
        name: "Year",
        min: 1970,
        max: 2199,
        rangeLabel: "1970-2199",
      },
    ],
    dayOfWeekStartIndexZero: false,
    requiresQuestionMarkInDayFields: true,
    notes: [
      "6-field format: minute hour day-of-month month day-of-week year.",
      "Exactly one of day-of-month or day-of-week must be '?', with '*' in the other.",
      "Supports L (last day), W (nearest weekday), and # (nth weekday of month).",
      "Year accepts 1970-2199, including ranges, lists, and steps.",
    ],
  },
  quartz: {
    id: "quartz",
    label: "Quartz",
    fieldCount: 6,
    fields: [
      secondField,
      minuteField,
      hourField,
      extendedDayOfMonthField(),
      monthField,
      extendedDayOfWeekField(),
    ],
    dayOfWeekStartIndexZero: false,
    requiresQuestionMarkInDayFields: false,
    notes: [
      "6-field Quartz/Spring format: seconds minute hour day-of-month month day-of-week.",
      "Day-of-week is 1-7 where 1 = SUN, and supports L and # (nth weekday).",
      "Use '?' for the day field you want to leave unspecified.",
    ],
  },
  salesforce: {
    id: "salesforce",
    label: "Salesforce (System.schedule)",
    fieldCount: 6,
    maxFieldCount: 7,
    fields: [
      secondField,
      minuteField,
      hourField,
      extendedDayOfMonthField(),
      monthField,
      extendedDayOfWeekField(),
      salesforceYearField,
    ],
    dayOfWeekStartIndexZero: false,
    requiresQuestionMarkInDayFields: false,
    notes: [
      "System.schedule format: seconds minute hour day-of-month month day-of-week — the leading Seconds field is required.",
      "Day-of-week runs 1-7 where 1 = SUN (Quartz-style) and accepts SUN-SAT names.",
      "An optional 7th Year field (1970-2099) bounds how long the schedule stays active.",
      "Supports ? , - * / L W # — use '?' for the day field you leave unspecified.",
      "The expression is evaluated in the timezone of the user who schedules the job.",
    ],
  },
};
