import { describe, expect, it } from "vitest";
import { convertCronExpression } from "../convert";

describe("convertCronExpression", () => {
  it("translates a unix weekday schedule to EventBridge without losing the hour", () => {
    // The exact feedback case: 9am weekdays must stay 9am, not become noon.
    expect(convertCronExpression("0 9 * * 1-5", "unix", "aws")).toBe(
      "0 9 ? * MON-FRI *",
    );
  });

  it("round-trips EventBridge back to the original unix form", () => {
    expect(convertCronExpression("0 9 ? * MON-FRI *", "aws", "unix")).toBe(
      "0 9 * * 1-5",
    );
  });

  it("converts every-15-minutes unix to the EventBridge '?' placement", () => {
    expect(convertCronExpression("*/15 * * * *", "unix", "aws")).toBe(
      "*/15 * ? * * *",
    );
  });

  it("prepends a zero seconds field when converting unix to quartz", () => {
    expect(convertCronExpression("0 9 * * 1-5", "unix", "quartz")).toBe(
      "0 0 9 ? * MON-FRI",
    );
  });

  it("moves a restricted unix day-of-month into the EventBridge dow '?' slot", () => {
    expect(convertCronExpression("0 0 1 * *", "unix", "aws")).toBe(
      "0 0 1 * ? *",
    );
  });

  it("converts quartz to aws by dropping zero seconds and appending the year", () => {
    expect(convertCronExpression("0 15 10 ? * 6#3", "quartz", "aws")).toBe(
      "15 10 ? * 6#3 *",
    );
  });

  it("converts aws to quartz by prepending seconds and dropping the year", () => {
    expect(convertCronExpression("0 12 ? * MON-FRI *", "aws", "quartz")).toBe(
      "0 0 12 ? * MON-FRI",
    );
  });

  it("maps unix numeric Sunday (0) to the unambiguous SUN name", () => {
    expect(convertCronExpression("0 9 * * 0", "unix", "aws")).toBe(
      "0 9 ? * SUN *",
    );
  });

  it("expands stepped weekday ranges exactly", () => {
    expect(convertCronExpression("0 9 * * 1-5/2", "unix", "aws")).toBe(
      "0 9 ? * MON,WED,FRI *",
    );
  });

  it("expands macros before converting", () => {
    expect(convertCronExpression("@daily", "unix", "aws")).toBe(
      "0 0 ? * * *",
    );
  });

  it("keeps unix and cloudflare expressions identical in shape", () => {
    expect(convertCronExpression("0 9 * * 1-5", "unix", "cloudflare")).toBe(
      "0 9 * * 1-5",
    );
  });

  it("rejects lossy conversions instead of silently changing semantics", () => {
    // Non-zero quartz seconds cannot be expressed in a 5-field dialect.
    expect(convertCronExpression("30 15 10 ? * MON-FRI", "quartz", "unix")).toBeNull();
    // A restricted EventBridge year has no unix equivalent.
    expect(convertCronExpression("0 12 ? * MON-FRI 2027", "aws", "unix")).toBeNull();
    // Unix union semantics (both day fields restricted) are forbidden in AWS.
    expect(convertCronExpression("0 0 1 1 1", "unix", "aws")).toBeNull();
    // The '#' token is unsupported by the unix day-of-week field.
    expect(convertCronExpression("0 15 10 ? * 6#3", "quartz", "unix")).toBeNull();
  });

  it("normalizes whitespace for same-dialect conversions", () => {
    expect(convertCronExpression("  0    9 *   *  1-5 ", "unix", "unix")).toBe(
      "0 9 * * 1-5",
    );
  });

  it("returns null for empty or malformed expressions", () => {
    expect(convertCronExpression("", "unix", "aws")).toBeNull();
    expect(convertCronExpression("   ", "unix", "aws")).toBeNull();
    expect(convertCronExpression("@nope", "unix", "aws")).toBeNull();
    expect(convertCronExpression("0 9 *", "unix", "aws")).toBeNull();
  });
});
