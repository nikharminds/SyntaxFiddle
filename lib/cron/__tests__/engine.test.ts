import { describe, expect, it } from "vitest";
import { analyzeCronExpression } from "../engine";

const isIncreasing = (dates: Date[]) =>
  dates.every((date, index) => index === 0 || date.getTime() > dates[index - 1]!.getTime());

describe("analyzeCronExpression", () => {
  describe("required fixtures", () => {
    it("accepts */15 * * * * as valid Unix cron", () => {
      const result = analyzeCronExpression("*/15 * * * *", "unix", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.dialect).toBe("unix");
      expect(result.errorMessage).toBeUndefined();
      expect(result.humanReadable).toMatch(/every 15 minutes/i);
      expect(result.fields).toHaveLength(5);
      expect(result.fields.every((field) => field.isValid)).toBe(true);
      expect(result.nextRuns).toHaveLength(10);
      expect(isIncreasing(result.nextRuns)).toBe(true);
      for (const run of result.nextRuns) {
        expect(run.getUTCMinutes() % 15).toBe(0);
        expect(run.getUTCSeconds()).toBe(0);
      }
    });

    it("accepts 0 12 * * ? * as valid AWS EventBridge cron", () => {
      const result = analyzeCronExpression("0 12 * * ? *", "aws", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.dialect).toBe("aws");
      expect(result.fields).toHaveLength(6);
      expect(result.fields.every((field) => field.isValid)).toBe(true);
      expect(result.humanReadable).toMatch(/12:00 PM/);
      expect(result.nextRuns).toHaveLength(10);
      for (const run of result.nextRuns) {
        expect(run.getUTCHours()).toBe(12);
        expect(run.getUTCMinutes()).toBe(0);
        expect(run.getUTCSeconds()).toBe(0);
      }
    });

    it("rejects 0 0 12 * * * as AWS EventBridge (missing '?')", () => {
      const result = analyzeCronExpression("0 0 12 * * *", "aws", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/\?/);
      expect(result.errorMessage).toContain("0 0 12 * ? *");
      expect(result.humanReadable).toBe("");
      expect(result.nextRuns).toEqual([]);
    });

    it("accepts 0 15 10 ? * 6#3 as valid Quartz (third Friday)", () => {
      const result = analyzeCronExpression("0 15 10 ? * 6#3", "quartz", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.dialect).toBe("quartz");
      expect(result.fields).toHaveLength(6);
      expect(result.fields.every((field) => field.isValid)).toBe(true);
      expect(result.humanReadable).toMatch(/third Friday/i);
      expect(result.nextRuns.length).toBeGreaterThan(0);
      for (const run of result.nextRuns) {
        expect(run.getUTCDay()).toBe(5);
        expect(Math.ceil(run.getUTCDate() / 7)).toBe(3);
        expect(run.getUTCHours()).toBe(10);
        expect(run.getUTCMinutes()).toBe(15);
        expect(run.getUTCSeconds()).toBe(0);
      }
    });

    it("rejects 65 * * * * with an out-of-range minute", () => {
      const result = analyzeCronExpression("65 * * * *", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/between 0 and 59, but got 65/);
      expect(result.fields[0]?.isValid).toBe(false);
      expect(result.fields[0]?.error).toMatch(/between 0 and 59/);
      expect(result.nextRuns).toEqual([]);
    });

    it("rejects * * * * * * * * * * (too many segments)", () => {
      const result = analyzeCronExpression("* * * * * * * * * *", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/expects 5 fields, but found 10/);
      expect(result.nextRuns).toEqual([]);
      expect(result.fields.every((field) => !field.isValid)).toBe(true);
    });
  });

  describe("AWS EventBridge '?' rules", () => {
    it("rejects '?' in both Day-of-Month and Day-of-Week", () => {
      const result = analyzeCronExpression("0 12 ? * ? *", "aws", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/both Day-of-Month and Day-of-Week/);
    });

    it("accepts '?' in Day-of-Month instead", () => {
      const result = analyzeCronExpression("0 12 ? * MON-FRI *", "aws", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.nextRuns.length).toBeGreaterThan(0);
      for (const run of result.nextRuns) {
        expect(run.getUTCDay()).toBeGreaterThanOrEqual(1);
        expect(run.getUTCDay()).toBeLessThanOrEqual(5);
      }
    });

    it("applies the year field to future runs (year 2100)", () => {
      const result = analyzeCronExpression("0 12 ? * * 2100", "aws", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.nextRuns).toHaveLength(10);
      for (const run of result.nextRuns) {
        expect(run.getUTCFullYear()).toBe(2100);
      }
    });

    it("returns no runs when the year range is entirely in the past", () => {
      const result = analyzeCronExpression("0 12 ? * * 2020", "aws", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.nextRuns).toEqual([]);
      expect(result.errorMessage).toMatch(/no upcoming run dates/);
    });

    it("validates the AWS year range", () => {
      const result = analyzeCronExpression("0 12 ? * * 2200", "aws", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.fields[5]?.isValid).toBe(false);
      expect(result.fields[5]?.error).toMatch(/1970 and 2199/);
    });
  });

  describe("dialect field semantics", () => {
    it("treats day-of-week 7 as Sunday in Unix cron", () => {
      const result = analyzeCronExpression("0 12 * * 7", "unix", "UTC");

      expect(result.isValid).toBe(true);
      for (const run of result.nextRuns) {
        expect(run.getUTCDay()).toBe(0);
      }
    });

    it("rejects day-of-week 0 in Quartz (1 = SUN)", () => {
      const result = analyzeCronExpression("0 15 10 ? * 0", "quartz", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.fields[5]?.error).toMatch(/between 1 and 7/);
    });

    it("accepts month and weekday names in Unix cron", () => {
      const result = analyzeCronExpression("0 9 * 1-12 MON-FRI", "unix", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.humanReadable).toMatch(/Monday through Friday/);
    });

    it("honors the Quartz seconds field", () => {
      const result = analyzeCronExpression("30 15 10 ? * *", "quartz", "UTC");

      expect(result.isValid).toBe(true);
      for (const run of result.nextRuns) {
        expect(run.getUTCSeconds()).toBe(30);
        expect(run.getUTCMinutes()).toBe(15);
      }
    });

    it("accepts L in Quartz day-of-month", () => {
      const result = analyzeCronExpression("0 0 12 L * ?", "quartz", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.nextRuns.length).toBeGreaterThan(0);
      for (const run of result.nextRuns) {
        expect(run.getUTCDate()).toBeGreaterThan(27);
      }
    });

    it("rejects '#' outside the Quartz/AWS day-of-week fields", () => {
      const result = analyzeCronExpression("* * * 6#3 *", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/'#'/);
    });

    it("rejects reversed ranges with a clear message", () => {
      const result = analyzeCronExpression("50-10 * * * *", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/reversed/);
    });

    it("treats cloudflare cron identically to unix cron", () => {
      const result = analyzeCronExpression("*/30 * * * *", "cloudflare", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.dialect).toBe("cloudflare");
      expect(result.nextRuns).toHaveLength(10);
      for (const run of result.nextRuns) {
        expect(run.getUTCMinutes() % 30).toBe(0);
      }
    });
  });

  describe("corrupted and hostile input", () => {
    it("returns an invalid result for empty input without crashing", () => {
      for (const expression of ["", "   ", "\t\n "]) {
        const result = analyzeCronExpression(expression, "unix", "UTC");
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toMatch(/empty/i);
        expect(result.nextRuns).toEqual([]);
      }
    });

    it("rejects '?' in Unix cron with a fix suggestion", () => {
      const result = analyzeCronExpression("* * * * ?", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/use '\*'/);
    });

    it("rejects garbage tokens without crashing", () => {
      for (const expression of ["*/*/*/*/*/", "/////", "* * * * !!", "a b c d e"]) {
        const result = analyzeCronExpression(expression, "unix", "UTC");
        expect(result.isValid).toBe(false);
        expect(result.nextRuns).toEqual([]);
      }
    });

    it("returns empty runs for syntactically valid but impossible schedules", () => {
      const result = analyzeCronExpression("0 12 31 2 *", "unix", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.nextRuns).toEqual([]);
      expect(result.errorMessage).toMatch(/no upcoming run dates/);
    });
  });

  describe("timezones and run counts", () => {
    it("computes runs in the selected IANA timezone", () => {
      const result = analyzeCronExpression("0 12 * * ? *", "aws", "Asia/Kolkata");

      expect(result.isValid).toBe(true);
      for (const run of result.nextRuns) {
        expect(run.getUTCHours()).toBe(6);
        expect(run.getUTCMinutes()).toBe(30);
      }
    });

    it("rejects unknown timezones with a friendly message", () => {
      const result = analyzeCronExpression("* * * * *", "unix", "Mars/Olympus");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/timezone/i);
      expect(result.nextRuns).toEqual([]);
    });

    it("honors a custom run count", () => {
      const result = analyzeCronExpression("*/15 * * * *", "unix", "America/New_York", 3);

      expect(result.isValid).toBe(true);
      expect(result.nextRuns).toHaveLength(3);
    });
  });

  describe("@ macros", () => {
    it("expands @daily to an equivalent 5-field schedule", () => {
      const result = analyzeCronExpression("@daily", "unix", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.fields.map((field) => field.value)).toEqual(["0", "0", "*", "*", "*"]);
      expect(result.nextRuns.length).toBeGreaterThan(0);
      for (const run of result.nextRuns) {
        expect(run.getUTCHours()).toBe(0);
        expect(run.getUTCMinutes()).toBe(0);
      }
    });

    it("expands macros case-insensitively (@HOURLY)", () => {
      const result = analyzeCronExpression("@HOURLY", "unix", "UTC");

      expect(result.isValid).toBe(true);
      for (const run of result.nextRuns) {
        expect(run.getUTCMinutes()).toBe(0);
      }
    });

    it("expands @weekly on the cloudflare dialect (Sundays)", () => {
      const result = analyzeCronExpression("@weekly", "cloudflare", "UTC");

      expect(result.isValid).toBe(true);
      for (const run of result.nextRuns) {
        expect(run.getUTCDay()).toBe(0);
      }
    });

    it("rejects @reboot with an explanatory message", () => {
      const result = analyzeCronExpression("@reboot", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/startup/i);
      expect(result.nextRuns).toEqual([]);
    });

    it("rejects macros in dialects that do not support them, with the expanded equivalent", () => {
      const quartz = analyzeCronExpression("@daily", "quartz", "UTC");
      expect(quartz.isValid).toBe(false);
      expect(quartz.errorMessage).toMatch(/Quartz/);
      expect(quartz.errorMessage).toContain('"0 0 0 * * ?"');

      const aws = analyzeCronExpression("@weekly", "aws", "UTC");
      expect(aws.isValid).toBe(false);
      expect(aws.errorMessage).toContain('"0 0 ? * 1 *"');
    });

    it("rejects unknown macros with the supported list", () => {
      const result = analyzeCronExpression("@fortnightly", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/Unknown macro/);
      expect(result.errorMessage).toContain("@daily");
    });

    it("rejects macros mixed with other fields", () => {
      const result = analyzeCronExpression("@daily * * * *", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/cannot be combined/i);
    });

    it("reports a field-count error once, not repeated per field", () => {
      const result = analyzeCronExpression("* * * *", "unix", "UTC");

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/expects 5 fields, but found 4/);
      expect(result.fields.every((field) => !field.isValid)).toBe(true);
      expect(result.fields.every((field) => field.error === undefined)).toBe(true);
    });
  });

  describe("day-of-month + day-of-week union wording", () => {
    it("describes the Vixie union with 'or' when both day fields are restricted", () => {
      const result = analyzeCronExpression("0 0 13 * 5", "unix", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.humanReadable).toContain("of the month, or on Friday");
      expect(result.humanReadable).not.toContain("of the month, and on");
    });

    it("uses 'or' for day-of-week ranges and steps in the union", () => {
      const range = analyzeCronExpression("0 0 13 * 1-5", "unix", "UTC");
      expect(range.humanReadable).toContain("of the month, or ");

      const step = analyzeCronExpression("0 0 13 * */2", "unix", "UTC");
      expect(step.humanReadable).toContain("of the month, or every 2 days of the week");
    });

    it("keeps 'and' inside day lists when only one day field is restricted", () => {
      const result = analyzeCronExpression("0 0 1,15 * *", "unix", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.humanReadable).toContain("day 1 and 15 of the month");
    });

    it("leaves Quartz wording untouched (AND semantics when both day fields are set)", () => {
      const result = analyzeCronExpression("0 0 0 13 * 5", "quartz", "UTC");

      expect(result.isValid).toBe(true);
      expect(result.humanReadable).toContain("and on");
    });
  });
});
