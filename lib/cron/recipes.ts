import type { CronDialect } from "./dialects";

export type RecipeCategory =
  | "minutes"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "platform-specific";

export interface CronRecipe {
  slug: string;
  expression: string;
  dialect: CronDialect;
  title: string;
  description: string;
  category: RecipeCategory;
  relatedSlugs: string[];
}

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  minutes: "Minute-based schedules",
  hourly: "Hourly schedules",
  daily: "Daily schedules",
  weekly: "Weekly schedules",
  monthly: "Monthly & yearly schedules",
  "platform-specific": "Platform-specific expressions",
};

const DIALECT_LABELS: Record<CronDialect, string> = {
  unix: "Unix cron",
  aws: "AWS EventBridge",
  quartz: "Quartz",
  cloudflare: "Cloudflare Workers",
};

const DESCRIPTION_DIALECTS: Record<CronDialect, string> = {
  unix: "Unix",
  aws: "AWS EventBridge",
  quartz: "Quartz",
  cloudflare: "Cloudflare Workers",
};

type Seed = readonly [slug: string, expression: string, name: string, dialect?: CronDialect];

function describe(name: string, expression: string, dialect: CronDialect): string {
  const awsWrapper =
    dialect === "aws" ? ` In an EventBridge rule you write it as cron(${expression}).` : "";
  return `The ${DESCRIPTION_DIALECTS[dialect]} cron expression "${expression}" runs a task ${name.toLowerCase()}.${awsWrapper} Preview the next run times in your timezone, read the plain-English translation, and copy ready-to-paste snippets for crontab, Node.js, GitHub Actions, and AWS EventBridge.`;
}

function buildCategory(category: RecipeCategory, seeds: Seed[]): CronRecipe[] {
  return seeds.map(([slug, expression, name, dialect]) => {
    const resolvedDialect = dialect ?? "unix";
    return {
      slug,
      expression,
      dialect: resolvedDialect,
      title: `Cron Expression for ${name}`,
      description: describe(name, expression, resolvedDialect),
      category,
      relatedSlugs: [],
    };
  });
}

const MINUTES: Seed[] = [
  ["every-6-minutes", "*/6 * * * *", "Every 6 Minutes"],
  ["every-7-minutes", "*/7 * * * *", "Every 7 Minutes"],
  ["every-8-minutes", "*/8 * * * *", "Every 8 Minutes"],
  ["every-9-minutes", "*/9 * * * *", "Every 9 Minutes"],
  ["every-12-minutes", "*/12 * * * *", "Every 12 Minutes"],
  ["every-25-minutes", "*/25 * * * *", "Every 25 Minutes"],
  ["every-even-minute", "0-59/2 * * * *", "Every Even Minute"],
  ["every-15-minutes-offset", "7-59/15 * * * *", "Every 15 Minutes Starting at :07"],
  ["every-10-minutes-between-9am-and-5pm", "*/10 9-17 * * *", "Every 10 Minutes Between 9 AM and 5 PM"],
  ["every-15-minutes-during-business-hours", "*/15 9-17 * * *", "Every 15 Minutes During Business Hours"],
  ["at-15-and-45-past-every-hour", "15,45 * * * *", "At :15 and :45 of Every Hour"],
];

const HOURLY: Seed[] = [
  ["hourly-at-quarter-past", "15 * * * *", "Hourly at Quarter Past"],
  ["hourly-at-half-past", "30 * * * *", "Hourly at Half Past"],
  ["hourly-at-quarter-to", "45 * * * *", "Hourly at Quarter To"],
  ["every-5-hours", "0 */5 * * *", "Every 5 Hours"],
  ["every-2-hours-offset", "15 */2 * * *", "Every 2 Hours Starting at :15"],
  ["every-4-hours-offset", "30 */4 * * *", "Every 4 Hours Starting at :30"],
  ["hourly-between-9am-and-5pm", "0 9-17 * * *", "Hourly Between 9 AM and 5 PM"],
  ["every-2-hours-between-9am-and-6pm", "0 9-18/2 * * *", "Every 2 Hours Between 9 AM and 6 PM"],
  ["every-3-hours-between-8am-and-8pm", "0 8-20/3 * * *", "Every 3 Hours Between 8 AM and 8 PM"],
];

const DAILY: Seed[] = [
  ["daily-at-midnight", "0 0 * * *", "Daily at Midnight"],
  ["daily-at-1am", "0 1 * * *", "Daily at 1 AM"],
  ["daily-at-2am", "0 2 * * *", "Daily at 2 AM"],
  ["daily-at-3am", "0 3 * * *", "Daily at 3 AM"],
  ["daily-at-4am", "0 4 * * *", "Daily at 4 AM"],
  ["daily-at-5am", "0 5 * * *", "Daily at 5 AM"],
  ["daily-at-6am", "0 6 * * *", "Daily at 6 AM"],
  ["daily-at-6-30am", "30 6 * * *", "Daily at 6:30 AM"],
  ["daily-at-7am", "0 7 * * *", "Daily at 7 AM"],
  ["daily-at-8am", "0 8 * * *", "Daily at 8 AM"],
  ["daily-at-9am", "0 9 * * *", "Daily at 9 AM"],
  ["daily-at-10am", "0 10 * * *", "Daily at 10 AM"],
  ["daily-at-11am", "0 11 * * *", "Daily at 11 AM"],
  ["daily-at-noon", "0 12 * * *", "Daily at Noon"],
  ["daily-at-1pm", "0 13 * * *", "Daily at 1 PM"],
  ["daily-at-2pm", "0 14 * * *", "Daily at 2 PM"],
  ["daily-at-3pm", "0 15 * * *", "Daily at 3 PM"],
  ["daily-at-4pm", "0 16 * * *", "Daily at 4 PM"],
  ["daily-at-5pm", "0 17 * * *", "Daily at 5 PM"],
  ["daily-at-6pm", "0 18 * * *", "Daily at 6 PM"],
  ["daily-at-7pm", "0 19 * * *", "Daily at 7 PM"],
  ["daily-at-8pm", "0 20 * * *", "Daily at 8 PM"],
  ["daily-at-9pm", "0 21 * * *", "Daily at 9 PM"],
  ["daily-at-10pm", "0 22 * * *", "Daily at 10 PM"],
  ["daily-at-11-30pm", "30 23 * * *", "Daily at 11:30 PM"],
  ["twice-daily-at-9am-and-5pm", "0 9,17 * * *", "Twice Daily at 9 AM and 5 PM"],
  ["twice-daily-at-6am-and-6pm", "0 6,18 * * *", "Twice Daily at 6 AM and 6 PM"],
  ["three-times-daily", "0 8,14,20 * * *", "Three Times Daily"],
  ["weekdays-at-9am", "0 9 * * 1-5", "Weekdays at 9 AM"],
  ["weekdays-at-midnight", "0 0 * * 1-5", "Weekdays at Midnight"],
  ["weekdays-at-noon", "0 12 * * 1-5", "Weekdays at Noon"],
  ["weekends-at-midnight", "0 0 * * 0,6", "Weekends at Midnight"],
  ["weekends-at-noon", "0 12 * * 0,6", "Weekends at Noon"],
];

const WEEKLY: Seed[] = [
  ["every-tuesday-at-noon", "0 12 * * 2", "Every Tuesday at Noon"],
  ["every-thursday-at-noon", "0 12 * * 4", "Every Thursday at Noon"],
  ["every-saturday-at-9am", "0 9 * * 6", "Every Saturday at 9 AM"],
  ["every-sunday-at-noon", "0 12 * * 0", "Every Sunday at Noon"],
  ["every-monday-wednesday-and-friday", "0 0 * * 1,3,5", "Every Monday, Wednesday and Friday"],
  ["every-tuesday-and-thursday", "0 0 * * 2,4", "Every Tuesday and Thursday"],
  ["weekdays-at-6pm", "0 18 * * 1-5", "Weekdays at 6 PM"],
];

const MONTHLY: Seed[] = [
  ["on-the-15th", "0 0 15 * *", "On the 15th of Every Month"],
  ["on-the-1st-and-15th", "0 0 1,15 * *", "On the 1st and 15th of Every Month"],
  ["month-end-guard", "59 23 28-31 * *", "At 23:59 on Days 28-31 (Month-End Guard)"],
  ["quarterly", "0 0 1 1,4,7,10 *", "Quarterly (First Day of Jan, Apr, Jul, Oct)"],
  ["twice-a-year", "0 0 1 1,7 *", "Twice a Year (Jan 1 and Jul 1)"],
  ["yearly-on-january-1st", "0 0 1 1 *", "Yearly on January 1st"],
  ["never-runs", "0 0 31 2 *", "That Never Runs (February 31st)"],
];

const PLATFORM: Seed[] = [
  ["aws-eventbridge-every-hour", "0 * * * ? *", "Every Hour (AWS EventBridge)", "aws"],
  ["aws-eventbridge-every-5-minutes", "0/5 * * * ? *", "Every 5 Minutes (AWS EventBridge)", "aws"],
  ["aws-eventbridge-every-15-minutes", "0/15 * * * ? *", "Every 15 Minutes (AWS EventBridge)", "aws"],
  ["aws-eventbridge-every-12-hours", "0 0/12 * * ? *", "Every 12 Hours (AWS EventBridge)", "aws"],
  ["aws-eventbridge-daily-at-midnight", "0 0 * * ? *", "Daily at Midnight (AWS EventBridge)", "aws"],
  ["aws-eventbridge-daily-at-1am", "0 1 * * ? *", "Daily at 1 AM (AWS EventBridge)", "aws"],
  ["aws-eventbridge-daily-at-8am", "0 8 * * ? *", "Daily at 8 AM (AWS EventBridge)", "aws"],
  ["aws-eventbridge-daily-at-9am", "0 9 * * ? *", "Daily at 9 AM (AWS EventBridge)", "aws"],
  ["aws-eventbridge-weekdays-at-9am", "0 9 ? * MON-FRI *", "Weekdays at 9 AM (AWS EventBridge)", "aws"],
  ["aws-eventbridge-every-monday-at-9am", "0 9 ? * MON *", "Every Monday at 9 AM (AWS EventBridge)", "aws"],
  ["aws-eventbridge-first-day-of-month", "0 0 1 * ? *", "First Day of Month (AWS EventBridge)", "aws"],
  ["aws-eventbridge-last-day-of-month", "0 0 L * ? *", "Last Day of Month (AWS EventBridge)", "aws"],
  ["quartz-every-10-seconds", "*/10 * * * * ?", "Every 10 Seconds (Quartz)", "quartz"],
  ["quartz-every-30-seconds", "*/30 * * * * ?", "Every 30 Seconds (Quartz)", "quartz"],
  ["quartz-every-second", "* * * * * ?", "Every Second (Quartz)", "quartz"],
  ["quartz-every-15-minutes", "0 0/15 * * * ?", "Every 15 Minutes (Quartz)", "quartz"],
  ["quartz-daily-at-midnight", "0 0 0 * * ?", "Daily at Midnight (Quartz)", "quartz"],
  ["quartz-daily-at-noon", "0 0 12 * * ?", "Daily at Noon (Quartz)", "quartz"],
  ["quartz-weekdays-at-9am", "0 0 9 ? * MON-FRI", "Weekdays at 9 AM (Quartz)", "quartz"],
  ["quartz-first-monday-of-month", "0 0 12 ? * 2#1", "First Monday of Month (Quartz)", "quartz"],
  ["spring-boot-daily", "0 0 0 * * *", "Daily at Midnight (Spring Boot)", "quartz"],
  ["spring-boot-hourly", "0 0 * * * ?", "Hourly (Spring Boot)", "quartz"],
  ["spring-boot-every-5-minutes", "0 0/5 * * * *", "Every 5 Minutes (Spring Boot)", "quartz"],
  ["spring-boot-every-30-seconds", "*/30 * * * * *", "Every 30 Seconds (Spring Boot)", "quartz"],
  ["spring-boot-weekdays-at-noon", "0 0 12 ? * MON-FRI", "Weekdays at Noon (Spring Boot)", "quartz"],
  ["cloudflare-every-5-minutes", "*/5 * * * *", "Every 5 Minutes (Cloudflare Workers)", "cloudflare"],
  ["cloudflare-every-15-minutes", "*/15 * * * *", "Every 15 Minutes (Cloudflare Workers)", "cloudflare"],
  ["cloudflare-every-hour", "0 * * * *", "Every Hour (Cloudflare Workers)", "cloudflare"],
  ["cloudflare-daily-at-midnight", "0 0 * * *", "Daily at Midnight (Cloudflare Workers)", "cloudflare"],
  ["cloudflare-every-monday-at-midnight", "0 0 * * 1", "Every Monday at Midnight (Cloudflare Workers)", "cloudflare"],
  ["cloudflare-first-day-of-month", "0 0 1 * *", "First Day of Month (Cloudflare Workers)", "cloudflare"],
];

const DIALECT_PREFIXES = ["aws-eventbridge-", "quartz-", "spring-boot-", "cloudflare-"];

function conceptOf(slug: string): string {
  for (const prefix of DIALECT_PREFIXES) {
    if (slug.startsWith(prefix)) {
      return slug.slice(prefix.length);
    }
  }
  return slug;
}

function assignRelatedSlugs(recipes: CronRecipe[]): void {
  for (const recipe of recipes) {
    const concept = conceptOf(recipe.slug);
    const sameCategory = recipes.filter(
      (other) => other.category === recipe.category && other.slug !== recipe.slug
    );
    const crossDialect = recipes.filter(
      (other) => other.slug !== recipe.slug && conceptOf(other.slug) === concept
    );
    const seen = new Set<string>([recipe.slug]);
    const related: string[] = [];
    for (const candidate of [...crossDialect, ...sameCategory]) {
      if (seen.has(candidate.slug)) continue;
      seen.add(candidate.slug);
      related.push(candidate.slug);
      if (related.length >= 8) break;
    }
    recipe.relatedSlugs = related;
  }
}

export const RECIPES: CronRecipe[] = [
  ...buildCategory("minutes", MINUTES),
  ...buildCategory("hourly", HOURLY),
  ...buildCategory("daily", DAILY),
  ...buildCategory("weekly", WEEKLY),
  ...buildCategory("monthly", MONTHLY),
  ...buildCategory("platform-specific", PLATFORM),
];

assignRelatedSlugs(RECIPES);

export const RECIPES_BY_SLUG: Map<string, CronRecipe> = new Map(
  RECIPES.map((recipe) => [recipe.slug, recipe])
);

export function getRecipe(slug: string): CronRecipe | undefined {
  return RECIPES_BY_SLUG.get(slug);
}

export function shiftDayOfWeekField(field: string, delta: -1 | 1): string {
  const shiftAtom = (atom: string): string => {
    const hashIndex = atom.indexOf("#");
    let target = atom;
    let suffix = "";
    if (hashIndex !== -1) {
      target = atom.slice(0, hashIndex);
      suffix = atom.slice(hashIndex);
    }
    if (/^\d+$/.test(target)) {
      const value = Number(target);
      return String(value + delta) + suffix;
    }
    return atom;
  };
  return field
    .split(",")
    .map((item) => {
      const slashParts = item.split("/");
      const rangeParts = (slashParts[0] ?? "*").split("-");
      slashParts[0] = rangeParts.map(shiftAtom).join("-");
      return slashParts.join("/");
    })
    .join(",");
}

export function unixEquivalentExpression(recipe: CronRecipe): string | null {
  if (recipe.dialect === "unix" || recipe.dialect === "cloudflare") {
    return recipe.expression;
  }
  let fields = recipe.expression.trim().split(/\s+/);
  if (recipe.dialect === "quartz") {
    if (fields.length !== 6 || fields[0] !== "0") {
      return null;
    }
    fields = fields.slice(1);
  }
  if (recipe.dialect === "aws") {
    if (fields.length !== 6) {
      return null;
    }
    fields = fields.slice(0, 5);
  }
  if (fields.length !== 5) {
    return null;
  }
  const [min = "*", hour = "*", dom = "*", month = "*", dow = "*"] = fields;
  if (/[LW#]/.test(dom) || /[L#]/.test(dow.replace(/MON|TUE|WED|THU|FRI|SAT|SUN/g, ""))) {
    return null;
  }
  const domUnix = dom === "?" ? "*" : dom;
  const dowUnix = dow === "?" ? "*" : shiftDayOfWeekField(dow, -1);
  return [min, hour, domUnix, month, dowUnix].join(" ");
}

export interface AwsConversion {
  expression: string;
  note?: string;
}

export function awsEquivalentExpression(recipe: CronRecipe): AwsConversion {
  if (recipe.dialect === "aws") {
    return { expression: recipe.expression };
  }
  const fields = recipe.expression.trim().split(/\s+/);
  if (recipe.dialect === "quartz" && (fields.length !== 6 || fields[0] !== "0")) {
    return {
      expression: "0/1 * * * ? *",
      note: "AWS EventBridge cannot express sub-minute cadences. The closest equivalent fires at the top of every minute — combine it with in-code throttling if you need finer control.",
    };
  }
  const five = recipe.dialect === "quartz" ? fields.slice(1) : fields;
  if (five.length !== 5) {
    return { expression: recipe.expression };
  }
  const [min = "*", hour = "*", dom = "*", month = "*", dow = "*"] = five;
  const minuteAws = min.replace(/^\*\//, "0/");
  const hourAws = hour.replace(/^\*\//, "0/");
  const domAws = dom === "*" ? "?" : dom;
  const dowAws =
    domAws !== "?"
      ? "?"
      : dow === "*" || dow === "?"
        ? "*"
        : recipe.dialect === "unix" || recipe.dialect === "cloudflare"
          ? shiftDayOfWeekField(dow, 1)
          : dow;
  return {
    expression: [minuteAws, hourAws, domAws, month, dowAws, "*"].join(" "),
    note: "Converted to the AWS EventBridge 6-field cron() syntax, which evaluates in UTC and requires '?' in one of the two day fields.",
  };
}

export function nodeCronEquivalentExpression(recipe: CronRecipe): string {
  if (recipe.dialect !== "aws") {
    return recipe.expression;
  }
  const fields = recipe.expression.trim().split(/\s+/);
  if (fields.length !== 6) {
    return recipe.expression;
  }
  const [min = "*", hour = "*", dom = "*", month = "*", dow = "*"] = fields;
  const domNode = dom === "?" ? "*" : dom;
  const dowNode = dow === "?" ? "*" : shiftDayOfWeekField(dow, -1);
  return ["0", min, hour, domNode, month, dowNode].join(" ");
}
