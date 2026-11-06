/**
 * Content for the /cron/salesforce/ landing page: the System.schedule
 * reference tables, technical prose sections, and FAQ entries used for
 * both the rendered page and its FAQ structured data.
 */

export interface SalesforceFieldRow {
  position: number;
  name: string;
  allowed: string;
  required: boolean;
  description: string;
}

export interface SalesforceSpecialChar {
  char: string;
  appliesTo: string;
  description: string;
}

export interface SalesforceSection {
  heading: string;
  body: string[];
}

export interface SalesforceFaq {
  question: string;
  answer: string;
}

export const SALESFORCE_FIELDS: SalesforceFieldRow[] = [
  {
    position: 1,
    name: "Seconds",
    allowed: "0-59",
    required: true,
    description: "Mandatory leading field — the most commonly forgotten one when pasting Unix cron.",
  },
  {
    position: 2,
    name: "Minutes",
    allowed: "0-59",
    required: true,
    description: "Minute of the hour, with lists (5,35), ranges, and steps (0/5) supported.",
  },
  {
    position: 3,
    name: "Hours",
    allowed: "0-23",
    required: true,
    description: "Hour of the day in the scheduling user's timezone, not UTC.",
  },
  {
    position: 4,
    name: "Day of month",
    allowed: "1-31, L, W, ?",
    required: true,
    description: "Use '?' when the day-of-week field carries the restriction instead.",
  },
  {
    position: 5,
    name: "Month",
    allowed: "1-12 or JAN-DEC",
    required: true,
    description: "Numbers or three-letter names; JAN-MAR style ranges work in both.",
  },
  {
    position: 6,
    name: "Day of week",
    allowed: "1-7 (1 = SUN) or SUN-SAT, L, #, ?",
    required: true,
    description: "One-based like Quartz — 1 is Sunday, 7 is Saturday. Names avoid the numbering trap.",
  },
  {
    position: 7,
    name: "Year",
    allowed: "1970-2099",
    required: false,
    description: "Optional trailing field that bounds how long the schedule stays active.",
  },
];

export const SALESFORCE_SPECIAL_CHARS: SalesforceSpecialChar[] = [
  { char: ",", appliesTo: "Any field", description: "Comma-separated list of values (e.g. 9,17)." },
  { char: "-", appliesTo: "Any field", description: "Inclusive range (e.g. MON-FRI, 1-15)." },
  { char: "*", appliesTo: "Any field", description: "Every value in the field's range." },
  { char: "?", appliesTo: "Day of month, Day of week", description: "No specific value — use in the day field you are not restricting." },
  { char: "/", appliesTo: "Any field", description: "Step increments (e.g. 0/5 = starting at 0, every 5)." },
  { char: "L", appliesTo: "Day of month, Day of week", description: "Last day of the month in day-of-month; in day-of-week it stands for the last day of the week (Saturday)." },
  { char: "W", appliesTo: "Day of month", description: "Weekday nearest the given day (e.g. 15W — skips back to Friday or forward to Monday)." },
  { char: "#", appliesTo: "Day of week", description: "Nth weekday of the month (e.g. 6#3 = third Friday, because 6 = FRI)." },
];

export const SALESFORCE_SECTIONS: SalesforceSection[] = [
  {
    heading: "How System.schedule reads the expression",
    body: [
      "System.schedule(jobName, cronExpression, schedulable) expects six mandatory fields — seconds, minutes, hours, day-of-month, month, day-of-week — plus an optional seventh year. Unlike classic crontab, the leading seconds field is not optional: \"0 * * * * ?\" is how Salesforce spells every minute, and forgetting the seconds field is the single most common reason a pasted Unix expression is rejected here. Day-of-week is one-based, so 1 is Sunday and 7 is Saturday. That flips Unix muscle memory: a Unix \"1\" means Monday, but a Salesforce \"1\" means Sunday, so the Unix Monday expression \"0 12 * * 1\" becomes \"0 0 12 ? * 2\" in Apex. Three-letter names such as MON-FRI and JAN sidestep the numbering confusion entirely and are accepted in both the month and day-of-week fields.",
    ],
  },
  {
    heading: "The two day fields: '?', 'L', 'W', and '#'",
    body: [
      "Salesforce inherits Quartz's convention for the two day fields: when one of them carries a real restriction, put '?' in the other so the scheduler knows which one you mean. \"0 0 12 ? * MON-FRI\" fires at noon on weekdays — the '?' in day-of-month defers to the weekday restriction — while \"0 0 0 1 * ?\" fires at midnight on the first of every month. 'L' selects the last day of the month (\"0 0 0 L * ?\" is the canonical month-end cleanup), 'W' selects the weekday nearest a given date (\"15W\" lands on the Friday or Monday closest to the 15th), and '#' picks the nth weekday of the month — \"6#3\" is the third Friday because 6 is Friday in the one-based numbering. The simulator above validates all of these; a few '#' and 'L'/'W' combinations the next-run engine cannot expand still validate and say so explicitly.",
    ],
  },
  {
    heading: "Salesforce cron vs Quartz vs Unix",
    body: [
      "The Salesforce dialect is closest to Quartz: both are seconds-first, both number weekdays 1-7 with 1 = Sunday, and both support ?, L, W, and #. Three differences matter in practice. First, Salesforce adds an optional trailing year field (1970-2099) that Quartz triggers in the wild rarely use — handy for time-boxed data migrations or temporary integrations. Second, there are no @daily-style macros: expand them yourself, so \"@hourly\" becomes \"0 0 * * * ?\" and \"@daily\" becomes \"0 0 0 * * ?\". Third, evaluation time differs — Quartz follows the scheduler or JVM timezone, while System.schedule uses the timezone of the user who called it. Switching the dialect selector above converts your expression between Unix, Quartz, AWS EventBridge, Cloudflare, and Salesforce without losing the schedule's meaning.",
    ],
  },
  {
    heading: "The optional year field and the 100-job limit",
    body: [
      "Appending a seventh field such as \"2027\" or \"2026-2028\" bounds the schedule's lifetime: once the year window passes, the job stops firing. A plain \"0 0 12 ? * MON-FRI\" with no year runs indefinitely. While scheduling, keep the org-wide ceiling in mind — Salesforce allows 100 scheduled Apex jobs at any one time, and every System.schedule call occupies a slot until the job completes or you abort it with System.abortJob(jobId). Audit what is actually queued with SOQL on the CronTrigger object: SELECT Id, CronExpression, NextFireTime, State FROM CronTrigger. That query is also the fastest way to answer \"why didn't my job run?\" — State and NextFireTime tell you whether the schedule is still alive and when it next fires.",
    ],
  },
  {
    heading: "Timezone pitfalls that shift scheduled Apex",
    body: [
      "System.schedule evaluates the expression in the timezone of the scheduling user — not UTC, and not necessarily the org default. Three classic traps follow from that. A job scheduled by an admin in New York at \"9 AM\" fires at 9 AM America/New_York; if a London colleague reschedules the identical expression it fires at 9 AM Europe/London instead. Daylight saving time shifts every affected run by an hour twice a year, so a \"2:30 AM\" job silently becomes a \"3:30 AM\" job for a week in spring. And the Setup → Scheduled Jobs screen renders times in the viewer's timezone, which is rarely the scheduler's. Before shipping, pick the scheduling user's timezone in the simulator above and confirm the fire times match what the business expects.",
    ],
  },
];

export const SALESFORCE_FAQS: SalesforceFaq[] = [
  {
    question: "What is the Salesforce cron expression format?",
    answer:
      "System.schedule uses six mandatory fields — seconds minutes hours day-of-month month day-of-week — plus an optional seventh year field (1970-2099). The leading seconds field is required (unlike Unix cron), day-of-week runs 1-7 with 1 = Sunday, and the special characters , - * ? / L W # are supported along with JAN-DEC and SUN-SAT names.",
  },
  {
    question: "What does the expression 0 0/5 * * * ? mean in Salesforce?",
    answer:
      "It runs every five minutes. The seconds field is 0, the minute field 0/5 means starting at minute 0 in steps of 5, and the '?' leaves day-of-week unspecified because no weekday restriction is in play. It is the Salesforce equivalent of the Unix expression */5 * * * *, and you can schedule it with System.schedule('Job', '0 0/5 * * * ?', new MySchedulable()).",
  },
  {
    question: "How is day-of-week numbered in a Salesforce cron expression?",
    answer:
      "One-based, exactly like Quartz: 1 is Sunday, 2 is Monday, …, 7 is Saturday. Unix cron instead uses 0-7 where both 0 and 7 mean Sunday, which is why pasting a Unix expression straight into System.schedule shifts weekdays by one day. Prefer names like MON-FRI in day-of-week — they are unambiguous in both dialects and this tool converts the numbering automatically when you switch dialects.",
  },
  {
    question: "Why is my scheduled Apex job firing at the wrong hour?",
    answer:
      "Almost always a timezone mismatch. System.schedule evaluates the cron expression in the timezone of the user who scheduled the job — not UTC and not necessarily the org default — and daylight saving shifts runs by an hour twice a year. Reschedule as a user in the intended timezone, or adjust the hour field to compensate, and verify the fire times with SELECT NextFireTime FROM CronTrigger.",
  },
  {
    question: "How many scheduled Apex jobs can a Salesforce org have?",
    answer:
      "The limit is 100 scheduled Apex jobs at any one time per org. Each System.schedule call holds a slot until the job completes or is aborted via System.abortJob(jobId). If you are near the ceiling, query the CronTrigger object to list live schedules and abort stale ones before scheduling new work.",
  },
  {
    question: "Does Salesforce cron support @daily or @hourly macros?",
    answer:
      "No. Unlike Vixie cron, System.schedule has no @macro shorthand — every field must be spelled out. Expand them yourself: @hourly becomes \"0 0 * * * ?\", @daily becomes \"0 0 0 * * ?\", @weekly becomes \"0 0 0 ? * SUN\", and @monthly becomes \"0 0 0 1 * ?\". The seconds field is mandatory in each expansion.",
  },
  {
    question: "How do I test a System.schedule job in an Apex test?",
    answer:
      "Wrap the scheduling call in Test.startTest() and Test.stopTest(). When Test.stopTest() executes, the scheduled job fires synchronously inside the test so you can assert on its side effects. Schedule with a year in the past or verify AsyncApexJob/CronTrigger rows if you need to assert on the schedule itself rather than the execution.",
  },
];

export const SALESFORCE_RECIPE_SLUGS = [
  "salesforce-every-minute",
  "salesforce-every-5-minutes",
  "salesforce-every-15-minutes",
  "salesforce-every-30-minutes",
  "salesforce-every-hour",
  "salesforce-every-6-hours",
  "salesforce-daily-at-midnight",
  "salesforce-weekdays-at-noon",
  "salesforce-every-monday-at-9am",
  "salesforce-first-day-of-month",
  "salesforce-last-day-of-month",
  "salesforce-third-friday",
];
